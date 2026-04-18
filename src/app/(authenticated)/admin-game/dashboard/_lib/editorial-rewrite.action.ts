"use server";

import { Mistral } from "@mistralai/mistralai";
import * as z from "zod";
import {
  canCreateAdventure,
  gateAdventureDraftUpload,
  gateAdventureUpdateContent,
  getAdminActorForAuthorization,
} from "@/lib/adventure-authorization";
import { userHasPermissionServer } from "@/lib/better-auth-admin-permission";

const MAX_TEXT = 12_000;

const scopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("adventure-create") }),
  z.object({
    type: z.literal("adventure"),
    adventureId: z.string().min(1),
  }),
  z.object({ type: z.literal("city-editorial") }),
  z.object({ type: z.literal("adventure-creation-request") }),
]);

const inputSchema = z.object({
  text: z.string().max(MAX_TEXT),
  instruction: z.string().max(2000).optional(),
  preset: z
    .enum(["none", "shorter", "friendlier", "more_formal", "hook"])
    .optional(),
  variantCount: z.number().int().min(2).max(3),
  scope: scopeSchema,
});

export type EditorialRewriteInput = z.infer<typeof inputSchema>;

function presetToInstruction(preset: EditorialRewriteInput["preset"]): string {
  switch (preset) {
    case "shorter":
      return "Rends le texte plus court, sans perdre l’essentiel.";
    case "friendlier":
      return "Rends le ton plus chaleureux et accessible (familles, grand public).";
    case "more_formal":
      return "Rends le ton un peu plus sobre et professionnel.";
    case "hook":
      return "Rends l’accroche plus engageante pour un jeu de piste.";
    default:
      return "";
  }
}

async function gateEditorialRewrite(scope: EditorialRewriteInput["scope"]): Promise<boolean> {
  switch (scope.type) {
    case "adventure-create":
      return (await gateAdventureDraftUpload()).ok;
    case "adventure":
      return (await gateAdventureUpdateContent(scope.adventureId)).ok;
    case "city-editorial": {
      const actor = await getAdminActorForAuthorization();
      if (!actor) return false;
      return userHasPermissionServer({ permissions: { adventure: ["update"] } });
    }
    case "adventure-creation-request": {
      const actor = await getAdminActorForAuthorization();
      if (!actor) return false;
      if (await canCreateAdventure()) {
        return false;
      }
      return true;
    }
    default:
      return false;
  }
}

function variantsResponseSchema(variantCount: 2 | 3) {
  return z.object({
    variants: z
      .array(z.string())
      .length(variantCount)
      .describe(`${variantCount} variantes de reformulation`),
  });
}

export async function editorialRewriteAction(
  raw: EditorialRewriteInput
): Promise<
  { success: true; variants: string[] } | { success: false; error: string }
> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Requête invalide." };
  }
  const { text, instruction, preset, variantCount, scope } = parsed.data;
  const trimmed = text.trim();
  if (trimmed.length < 1) {
    return { success: false, error: "Texte vide." };
  }
  if (!(await gateEditorialRewrite(scope))) {
    return { success: false, error: "Non autorisé." };
  }

  const apiKey = process.env.MISTRAL_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      error: "Clé API Mistral absente (variable MISTRAL_API_KEY).",
    };
  }

  const model =
    process.env.MISTRAL_EDITORIAL_MODEL?.trim() || "mistral-small-latest";

  const presetLine = presetToInstruction(preset);
  const extra = instruction?.trim()
    ? `\nConsigne additionnelle : ${instruction.trim()}`
    : "";

  const system = `Tu es un assistant rédactionnel pour des parcours de jeu de piste et de découverte (Grand Est, France).
Réponds UNIQUEMENT au format JSON demandé.
Règles :
- Langue : français.
- Reformule le texte fourni sans inventer de faits, noms propres, dates ou lieux.
- Préserve les informations factuelles ; n’ajoute pas de contenu vérifiable non présent dans le texte source.
- Produit exactement ${variantCount} variantes distinctes dans le tableau "variants".
- Pas de commentaires hors JSON.`;

  const user = `Texte source :\n---\n${trimmed}\n---\n${presetLine ? `${presetLine}\n` : ""}${extra}
Propose exactement ${variantCount} reformulations (clés JSON : "variants" : tableau de ${variantCount} chaînes).`;

  const mistral = new Mistral({ apiKey });
  const variantKey: 2 | 3 = variantCount === 2 ? 2 : 3;
  const responseFormat = variantsResponseSchema(variantKey);

  try {
    const res = await mistral.chat.parse({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      responseFormat,
    });
    const parsedMsg = res.choices?.[0]?.message?.parsed as
      | { variants: string[] }
      | undefined;
    if (!parsedMsg?.variants?.length) {
      return { success: false, error: "Réponse Mistral vide ou invalide." };
    }
    return { success: true, variants: parsedMsg.variants };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur Mistral.";
    return { success: false, error: msg };
  }
}
