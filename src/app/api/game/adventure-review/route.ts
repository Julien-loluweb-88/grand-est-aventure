import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getClientIp } from "@/lib/api/get-client-ip";
import { checkRateLimit } from "@/lib/api/simple-rate-limit";
import {
  processAdventureReview,
  ReviewValidationError,
} from "@/lib/game/process-adventure-review";
import { prisma } from "@/lib/prisma";
import { saveReviewPhotoFile } from "@/lib/uploads/save-review-photo";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

function parseBoolean(v: unknown): boolean {
  return v === true;
}

function parseBooleanFromForm(v: FormDataEntryValue | null): boolean {
  if (v == null) return false;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    return t === "true" || t === "1" || t === "on" || t === "yes";
  }
  return false;
}

type ParsedReviewBody = {
  adventureId: string;
  userId: string;
  content: string;
  rating: unknown;
  image: string | null | undefined;
  consentCommunicationNetworks: boolean;
  reportsMissingBadge: boolean;
  reportsStolenTreasure: boolean;
};

async function parseReviewRequest(request: NextRequest): Promise<
  | { ok: true; data: ParsedReviewBody }
  | { ok: false; status: number; error: string }
> {
  const ct = request.headers.get("content-type") ?? "";

  if (ct.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return { ok: false, status: 400, error: "Formulaire multipart invalide." };
    }

    const adventureId =
      typeof form.get("adventureId") === "string"
        ? (form.get("adventureId") as string).trim()
        : "";
    const userId =
      typeof form.get("userId") === "string" ? (form.get("userId") as string).trim() : "";

    if (!adventureId || !userId) {
      return { ok: false, status: 400, error: "adventureId et userId sont requis." };
    }

    const rawContent = form.get("content");
    const content =
      typeof rawContent === "string" ? rawContent : rawContent != null ? String(rawContent) : "";

    const ratingRaw = form.get("rating");
    const rating =
      ratingRaw === null || ratingRaw === ""
        ? undefined
        : typeof ratingRaw === "string"
          ? ratingRaw
          : String(ratingRaw);

    let image: string | null | undefined = undefined;
    const photo = form.get("photo") ?? form.get("image");
    if (photo instanceof File && photo.size > 0) {
      const saved = await saveReviewPhotoFile({ adventureId, file: photo });
      if (!saved.ok) {
        return { ok: false, status: 400, error: saved.error };
      }
      image = saved.publicUrl;
    } else if (typeof form.get("imageUrl") === "string") {
      const u = (form.get("imageUrl") as string).trim();
      image = u.length > 0 ? u : undefined;
    }

    return {
      ok: true,
      data: {
        adventureId,
        userId,
        content,
        rating,
        image,
        consentCommunicationNetworks: parseBooleanFromForm(form.get("consentCommunicationNetworks")),
        reportsMissingBadge: parseBooleanFromForm(form.get("reportsMissingBadge")),
        reportsStolenTreasure: parseBooleanFromForm(form.get("reportsStolenTreasure")),
      },
    };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, status: 400, error: "Corps JSON invalide." };
  }

  if (typeof body !== "object" || body === null) {
    return { ok: false, status: 400, error: "Corps invalide." };
  }

  const b = body as Record<string, unknown>;
  const adventureId = typeof b.adventureId === "string" ? b.adventureId.trim() : "";
  const userId = typeof b.userId === "string" ? b.userId.trim() : "";
  const image =
    typeof b.image === "string" ? b.image : b.image === null ? null : undefined;

  if (typeof b.content !== "string" && b.content != null) {
    return { ok: false, status: 400, error: "content doit être une chaîne." };
  }
  const content = typeof b.content === "string" ? b.content : "";

  return {
    ok: true,
    data: {
      adventureId,
      userId,
      content,
      rating: b.rating,
      image,
      consentCommunicationNetworks: parseBoolean(b.consentCommunicationNetworks),
      reportsMissingBadge: parseBoolean(b.reportsMissingBadge),
      reportsStolenTreasure: parseBoolean(b.reportsStolenTreasure),
    },
  };
}

/**
 * Enregistre ou met à jour l’avis / signalement de fin de parcours (1 ligne par user × aventure).
 * Accepte **JSON** (`application/json`) ou **multipart** (`multipart/form-data`) avec un champ fichier
 * **`photo`** (ou **`image`**) pour envoyer photo + texte en une seule requête.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const parsed = await parseReviewRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { adventureId, userId, content, rating, image, ...flags } = parsed.data;
  const sessionUserId = session.user.id;

  if (!adventureId) {
    return NextResponse.json(
      { error: "adventureId est requis." },
      { status: 400 }
    );
  }
  if (!userId) {
    return NextResponse.json({ error: "userId est requis." }, { status: 400 });
  }
  if (userId !== sessionUserId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`review:${ip}:${sessionUserId}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez plus tard." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  try {
    const result = await prisma.$transaction((tx) =>
      processAdventureReview(tx, {
        adventureId,
        userId: sessionUserId,
        rating,
        content,
        image,
        consentCommunicationNetworks: flags.consentCommunicationNetworks,
        reportsMissingBadge: flags.reportsMissingBadge,
        reportsStolenTreasure: flags.reportsStolenTreasure,
      })
    );

    return NextResponse.json({
      ok: true,
      id: result.id,
      message: "Avis enregistré.",
    });
  } catch (e) {
    if (e instanceof ReviewValidationError) {
      const map: Record<ReviewValidationError["code"], { status: number; msg: string }> = {
        INVALID_RATING: { status: 400, msg: "La note doit être un entier entre 1 et 5." },
        CONTENT_TOO_LONG: {
          status: 400,
          msg: "Le commentaire dépasse 10000 caractères.",
        },
        ADVENTURE_NOT_FOUND: { status: 404, msg: "Aventure introuvable." },
        EMPTY_REVIEW: {
          status: 400,
          msg: "Renseignez au moins une note, un commentaire, une photo, une option de signalement ou le consentement.",
        },
      };
      const { status, msg } = map[e.code];
      return NextResponse.json({ error: msg }, { status });
    }
    throw e;
  }
}
