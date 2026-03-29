import { mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";

export type AdventureImageAlign = "left" | "center" | "right";

function layoutStyle(
  align: AdventureImageAlign,
  width: string | null | undefined
): string {
  const w = width?.trim();
  const parts: string[] = ["height: auto"];
  if (w) {
    parts.push(`width: ${w}`);
    if (!w.endsWith("%")) {
      parts.push("max-width: 100%");
    }
  } else {
    parts.push("max-width: 100%");
  }
  if (align === "left") {
    parts.push(
      "display: block",
      "margin-left: 0",
      "margin-right: auto"
    );
  } else if (align === "right") {
    parts.push(
      "display: block",
      "margin-left: auto",
      "margin-right: 0"
    );
  } else {
    parts.push(
      "display: block",
      "margin-left: auto",
      "margin-right: auto"
    );
  }
  return parts.join("; ");
}

/**
 * Image bloc avec alignement (gauche / centre / droite) et largeur optionnelle (%, px).
 */
export const AdventureImage = Image.extend({
  /** Sinon le navigateur / ProseMirror démarre un glisser-déposer et le clic ne sélectionne pas le nœud. */
  draggable: false,

  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
        parseHTML: (element) => {
          const d = element.getAttribute("data-align");
          if (d === "left" || d === "right" || d === "center") {
            return d;
          }
          return "center";
        },
      },
      width: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-width") ?? null,
      },
    };
  },

  renderHTML({ node }) {
    const { src, alt, title, align, width } = node.attrs;
    const a: AdventureImageAlign =
      align === "left" || align === "right" ? align : "center";
    const style = layoutStyle(a, width as string | null);
    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, {
        src,
        alt,
        title,
        "data-align": a,
        ...(width ? { "data-width": width as string } : {}),
        draggable: "false",
        style,
      }),
    ];
  },
});
