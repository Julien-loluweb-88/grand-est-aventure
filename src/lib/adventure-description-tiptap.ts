import type { JSONContent } from "@tiptap/core";

/** Document TipTap vide (un paragraphe vide), valeur initiale des formulaires. */
export const EMPTY_TIPTAP_DOCUMENT: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph", content: [] }],
};

/**
 * Convertit une valeur Prisma `Json` (chaîne héritée, doc TipTap, ou autre) en document TipTap.
 */
export function adventureDescriptionToTiptapJSON(description: unknown): JSONContent {
  if (description == null) {
    return {
      type: "doc",
      content: [{ type: "paragraph", content: [] }],
    };
  }

  if (typeof description === "string") {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content:
            description.length > 0 ? [{ type: "text", text: description }] : [],
        },
      ],
    };
  }

  if (typeof description === "object" && description !== null) {
    const o = description as Record<string, unknown>;
    if (o.type === "doc" && Array.isArray(o.content)) {
      return description as JSONContent;
    }
  }

  let fallback = "";
  try {
    fallback = JSON.stringify(description);
  } catch {
    fallback = String(description);
  }
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: fallback }],
      },
    ],
  };
}

/** Longueur du texte « visible » (validation sans monter l’éditeur). */
export function tiptapJsonPlainTextLength(node: JSONContent | undefined): number {
  return tiptapJsonToPlainText(node).length;
}

/** Texte brut pour aperçu, recherche ou affichage hors éditeur. */
export function tiptapJsonToPlainText(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.type === "image") {
    return "";
  }
  if (node.type === "hardBreak") {
    return "\n";
  }
  if (node.type === "horizontalRule") {
    return "\n";
  }
  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }
  if (!node.content || !Array.isArray(node.content)) return "";
  const parts = node.content.map((child) => tiptapJsonToPlainText(child as JSONContent));
  if (node.type === "doc" || node.type === "bulletList" || node.type === "orderedList") {
    return parts.filter(Boolean).join("\n").trim();
  }
  if (node.type === "codeBlock") {
    return parts.join("\n").trim();
  }
  if (node.type === "blockquote") {
    return parts.filter(Boolean).join("\n").trim();
  }
  if (node.type === "listItem" || node.type === "paragraph" || node.type === "heading") {
    return parts.join(" ").trim();
  }
  return parts.join("").trim();
}

/**
 * Texte à afficher côté **jeu / API / hors admin** pour un champ stocké comme TipTap
 * (`Json`), ou encore comme **chaîne** (données anciennes).
 * Pour du rendu riche, utiliser un lecteur TipTap dédié ; ici c’est du plain texte sûr.
 */
export function tiptapStoredValueToPlainText(stored: unknown): string {
  return tiptapJsonToPlainText(adventureDescriptionToTiptapJSON(stored));
}

/** Construit un document TipTap à partir d’un texte brut (paragraphes séparés par des lignes vides). */
export function plainTextToTiptapDoc(plain: string): JSONContent {
  const normalized = plain.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return EMPTY_TIPTAP_DOCUMENT;
  }
  const blocks = normalized.split(/\n\n+/);
  return {
    type: "doc",
    content: blocks.map((block) => {
      const inline = paragraphInlineContent(block);
      return {
        type: "paragraph",
        ...(inline.length > 0 ? { content: inline } : {}),
      };
    }),
  };
}

function paragraphInlineContent(text: string): JSONContent[] {
  const lines = text.split("\n");
  const out: JSONContent[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 0) {
      out.push({ type: "text", text: line });
    }
    if (i < lines.length - 1) {
      out.push({ type: "hardBreak" });
    }
  }
  return out;
}
