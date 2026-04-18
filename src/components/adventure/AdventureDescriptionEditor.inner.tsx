"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { uploadDashboardImage } from "@/lib/actions/upload-dashboard-image";
import { toast } from "sonner";
import type { AdventureDescriptionEditorProps } from "./adventure-description-editor.types";
import { AdventureImage } from "./adventure-image-extension";
import { EditorialRewriteControl } from "@/components/admin/EditorialRewriteControl";
import {
  plainTextToTiptapDoc,
  tiptapJsonToPlainText,
} from "@/lib/adventure-description-tiptap";

const TEXT_COLORS: { label: string; value: string }[] = [
  { label: "Par défaut", value: "" },
  { label: "Noir", value: "#171717" },
  { label: "Gris", value: "#737373" },
  { label: "Rouge", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Ambre", value: "#d97706" },
  { label: "Vert", value: "#16a34a" },
  { label: "Bleu", value: "#2563eb" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Rose", value: "#db2777" },
];

const HIGHLIGHT_COLORS: { label: string; value: string }[] = [
  { label: "Aucun", value: "" },
  { label: "Jaune", value: "#fef08a" },
  { label: "Citron", value: "#d9f99d" },
  { label: "Menthe", value: "#a7f3d0" },
  { label: "Ciel", value: "#bae6fd" },
  { label: "Lavande", value: "#e9d5ff" },
  { label: "Pêche", value: "#fed7aa" },
  { label: "Corail", value: "#fecaca" },
];

type Align = "left" | "center" | "right" | "justify";

function ImageLayoutToolbar({ editor }: { editor: Editor }) {
  const align = (editor.getAttributes("image").align ?? "center") as string;
  return (
    <>
      <Button
        type="button"
        variant={align === "left" ? "secondary" : "ghost"}
        size="icon"
        className="size-8 shrink-0"
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() =>
          editor.chain().focus().updateAttributes("image", { align: "left" }).run()
        }
        aria-label="Image à gauche"
        aria-pressed={align === "left"}
      >
        <AlignLeft className="size-4" />
      </Button>
      <Button
        type="button"
        variant={align === "center" ? "secondary" : "ghost"}
        size="icon"
        className="size-8 shrink-0"
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() =>
          editor
            .chain()
            .focus()
            .updateAttributes("image", { align: "center" })
            .run()
        }
        aria-label="Image centrée"
        aria-pressed={align === "center"}
      >
        <AlignCenter className="size-4" />
      </Button>
      <Button
        type="button"
        variant={align === "right" ? "secondary" : "ghost"}
        size="icon"
        className="size-8 shrink-0"
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() =>
          editor.chain().focus().updateAttributes("image", { align: "right" }).run()
        }
        aria-label="Image à droite"
        aria-pressed={align === "right"}
      >
        <AlignRight className="size-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1 px-2 text-xs"
            aria-label="Largeur de l’image"
          >
            Largeur
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="z-10050 min-w-[200px]"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <DropdownMenuLabel>Largeur de l’image</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              editor
                .chain()
                .focus()
                .updateAttributes("image", { width: null })
                .run()
            }
          >
            Automatique
          </DropdownMenuItem>
          {(["33%", "50%", "75%", "100%"] as const).map((pct) => (
            <DropdownMenuItem
              key={pct}
              onClick={() =>
                editor.chain().focus().updateAttributes("image", { width: pct }).run()
              }
            >
              {pct} de la colonne
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function normalizeMediaPath(src: string, base: string): string {
  const s = src.trim();
  if (!s) {
    return "";
  }
  try {
    if (s.startsWith("//")) {
      return normalizeMediaPath(`https:${s}`, base);
    }
    const u = new URL(s, base);
    return `${decodeURIComponent(u.pathname)}${u.search}`;
  } catch {
    const withSlash = s.startsWith("/") ? s : `/${s}`;
    return decodeURIComponent(withSlash);
  }
}

function imageSrcMatches(nodeSrc: string, imgEl: HTMLImageElement): boolean {
  if (!nodeSrc || typeof nodeSrc !== "string") {
    return false;
  }
  const a = nodeSrc.trim();
  if (!a) {
    return false;
  }
  const rawAttr = imgEl.getAttribute("src")?.trim();
  if (a === rawAttr) {
    return true;
  }

  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost";

  const fromImg = imgEl.currentSrc || imgEl.src || rawAttr || "";
  if (!fromImg) {
    return false;
  }

  const pNode = normalizeMediaPath(a, base);
  const pImg = normalizeMediaPath(fromImg, base);
  return pNode === pImg;
}

function tryPickPosFromDomOffsets(
  view: EditorView,
  img: HTMLImageElement
): number | null {
  for (const off of [0, -1, 1] as const) {
    try {
      const p = view.posAtDOM(img, off);
      const n = view.state.doc.nodeAt(p);
      if (n?.type.name === "image") {
        return p;
      }
    } catch {
      /* continuer */
    }
  }
  return null;
}

/**
 * Retourne la position ProseMirror juste avant le nœud `image` (requise pour NodeSelection).
 */
function clarifyImageAnchorPos(
  doc: EditorView["state"]["doc"],
  pos: number
): number | null {
  if (pos < 0 || pos > doc.content.size) {
    return null;
  }
  const $p = doc.resolve(pos);
  if ($p.nodeAfter?.type.name === "image") {
    return pos;
  }
  if ($p.nodeBefore?.type.name === "image") {
    return pos - $p.nodeBefore.nodeSize;
  }
  return null;
}

/**
 * Anciennes images : DOM / `src` en base ne correspondent pas toujours à `posAtDOM`.
 * Plusieurs images avec le même `src` : on prend celle sous le clic (rectangle / distance).
 */
function pickImagePosition(
  view: EditorView,
  img: HTMLImageElement,
  clientX: number,
  clientY: number
): number | null {
  const domTry = tryPickPosFromDomOffsets(view, img);
  if (domTry != null) {
    return domTry;
  }

  let byDom: number | null = null;
  view.state.doc.descendants((node, pos) => {
    if (node.type.name !== "image") {
      return true;
    }
    const dom = view.nodeDOM(pos);
    if (dom === img) {
      byDom = pos;
      return false;
    }
    if (dom instanceof HTMLElement && dom.contains(img)) {
      byDom = pos;
      return false;
    }
    return true;
  });
  if (byDom != null) {
    return byDom;
  }

  const srcHits: number[] = [];
  view.state.doc.descendants((node, pos) => {
    if (node.type.name !== "image") {
      return true;
    }
    const nsrc = node.attrs.src as string | null | undefined;
    if (nsrc && imageSrcMatches(nsrc, img)) {
      srcHits.push(pos);
    }
    return true;
  });

  if (srcHits.length === 0) {
    return null;
  }
  if (srcHits.length === 1) {
    return srcHits[0];
  }

  const inside: number[] = [];
  for (const pos of srcHits) {
    const dom = view.nodeDOM(pos);
    if (!(dom instanceof HTMLElement)) {
      continue;
    }
    const r = dom.getBoundingClientRect();
    if (
      clientX >= r.left &&
      clientX <= r.right &&
      clientY >= r.top &&
      clientY <= r.bottom
    ) {
      inside.push(pos);
    }
  }
  if (inside.length === 1) {
    return inside[0];
  }
  if (inside.length > 1) {
    let best = inside[0];
    let bestArea = Infinity;
    for (const pos of inside) {
      const dom = view.nodeDOM(pos) as HTMLElement;
      const r = dom.getBoundingClientRect();
      const area = r.width * r.height;
      if (area < bestArea) {
        bestArea = area;
        best = pos;
      }
    }
    return best;
  }

  const cr = img.getBoundingClientRect();
  const tcx = cr.left + cr.width / 2;
  const tcy = cr.top + cr.height / 2;
  let bestPos = srcHits[0];
  let bestD = Infinity;
  for (const pos of srcHits) {
    const dom = view.nodeDOM(pos);
    if (!(dom instanceof HTMLElement)) {
      continue;
    }
    const r = dom.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const d = Math.hypot(tcx - cx, tcy - cy);
    if (d < bestD) {
      bestD = d;
      bestPos = pos;
    }
  }
  return bestPos;
}

function selectProseMirrorImage(
  view: EditorView,
  event: MouseEvent
): boolean {
  if (event.button !== 0) {
    return false;
  }
  const raw = event.target;
  if (!(raw instanceof HTMLElement)) {
    return false;
  }
  const img =
    raw instanceof HTMLImageElement ? raw : raw.closest("img");
  if (!img || !view.dom.contains(img)) {
    return false;
  }

  let pos: number | null = pickImagePosition(
    view,
    img,
    event.clientX,
    event.clientY
  );

  if (pos == null) {
    const coords = view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });
    if (coords) {
      const $p = view.state.doc.resolve(coords.pos);
      if ($p.nodeAfter?.type.name === "image") {
        pos = $p.pos;
      } else if ($p.nodeBefore?.type.name === "image") {
        pos = $p.pos - $p.nodeBefore.nodeSize;
      }
    }
  }

  const anchor = pos == null ? null : clarifyImageAnchorPos(view.state.doc, pos);
  if (anchor == null) {
    return false;
  }

  event.preventDefault();
  if (!view.hasFocus()) {
    view.focus();
  }
  view.dispatch(
    view.state.tr.setSelection(NodeSelection.create(view.state.doc, anchor))
  );
  return true;
}

export function AdventureDescriptionEditorInner({
  id,
  value,
  onChange,
  disabled,
  "aria-invalid": ariaInvalid,
  className,
  richTextImageUploadAdventureId,
  richTextImageUploadDraftId,
  editorialRewrite,
}: AdventureDescriptionEditorProps) {
  const richTextImageInputRef = useRef<HTMLInputElement>(null);
  const canUploadRichTextImage = Boolean(
    richTextImageUploadAdventureId || richTextImageUploadDraftId
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      AdventureImage.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-md border border-border",
        },
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class:
            "text-primary underline underline-offset-2 decoration-primary/60 hover:text-primary/90",
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-multiline": "true",
        ...(ariaInvalid ? { "aria-invalid": "true" } : {}),
        class: "prose-desc min-h-[120px] px-0 py-1 text-left outline-none",
      },
      handleDOMEvents: {
        mousedown(view, event) {
          return selectProseMirrorImage(view, event);
        },
        click(view, event) {
          return selectProseMirrorImage(view, event);
        },
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const cur = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value);
    if (cur !== next) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [editor, disabled]);

  const imageLayoutOpen = useEditorState({
    editor,
    selector: (s) => {
      const ed = s.editor;
      if (!ed?.isEditable) {
        return false;
      }
      if (ed.isActive("image")) {
        return true;
      }
      const { selection } = ed.state;
      return (
        selection instanceof NodeSelection &&
        selection.node.type.name === "image"
      );
    },
  });

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-[152px] rounded-md border border-input bg-muted/30 animate-pulse",
          ariaInvalid && "border-destructive",
          className
        )}
        aria-hidden
      />
    );
  }

  const isAlign = (a: Align) => editor.isActive({ textAlign: a });

  const insertImageFromUrl = () => {
    const raw = window.prompt(
      "URL de l’image (https://… ou /uploads/…)",
      "https://"
    );
    if (raw === null) return;
    const t = raw.trim();
    if (!t) return;
    editor.chain().focus().setImage({ src: t }).run();
  };

  const onRichTextImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled) return;
    const body = new FormData();
    body.set("file", file);
    if (richTextImageUploadAdventureId) {
      body.set("scope", "adventure-editor-image");
      body.set("adventureId", richTextImageUploadAdventureId);
    } else if (richTextImageUploadDraftId) {
      body.set("scope", "adventure-editor-draft");
      body.set("draftId", richTextImageUploadDraftId);
    } else {
      return;
    }
    try {
      const res = await uploadDashboardImage(body);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      editor.chain().focus().setImage({ src: res.url }).run();
      toast.success("Image insérée.");
    } catch {
      toast.error("Téléversement impossible.");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {editorialRewrite && !disabled ? (
        <div className="flex flex-wrap justify-end gap-2">
          <EditorialRewriteControl
            scope={editorialRewrite.scope}
            getSourceText={() => tiptapJsonToPlainText(value)}
            onApply={(t) => onChange(plainTextToTiptapDoc(t))}
            disabled={disabled}
          />
        </div>
      ) : null}
      <input
        ref={richTextImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(ev) => void onRichTextImageFile(ev)}
      />
      <div
        className={cn(
          "flex flex-wrap items-center gap-0.5 rounded-md border border-input bg-muted/30 p-1",
          disabled && "pointer-events-none opacity-60"
        )}
        role="toolbar"
        aria-label="Mise en forme de la description"
      >
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Gras"
          aria-pressed={editor.isActive("bold")}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italique"
          aria-pressed={editor.isActive("italic")}
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Barré"
          aria-pressed={editor.isActive("strike")}
        >
          <Strikethrough className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("code") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().toggleCode().run()}
          aria-label="Code inline"
          aria-pressed={editor.isActive("code")}
        >
          <Code className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Souligné"
          aria-pressed={editor.isActive("underline")}
        >
          <UnderlineIcon className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-0.5 px-2 text-muted-foreground"
              aria-label="Couleur du texte"
            >
              <Palette className="size-4" />
              <ChevronDown className="size-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuLabel>Couleur du texte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-5 gap-1 p-2">
              {TEXT_COLORS.map(({ label, value: hex }) => (
                <button
                  key={label + hex}
                  type="button"
                  title={label}
                  className={cn(
                    "size-7 rounded-md border border-border shadow-sm transition hover:scale-105 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring",
                    hex === "" && "bg-background"
                  )}
                  style={
                    hex
                      ? { backgroundColor: hex }
                      : {
                          background:
                            "linear-gradient(135deg, #fafafa 50%, #e5e5e5 50%)",
                        }
                  }
                  onClick={() => {
                    if (hex === "") {
                      editor.chain().focus().unsetColor().run();
                    } else {
                      editor.chain().focus().setColor(hex).run();
                    }
                  }}
                />
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              Revenir à la couleur par défaut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("highlight") ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-0.5 px-2"
              aria-label="Couleur de surlignage"
              aria-pressed={editor.isActive("highlight")}
            >
              <Highlighter className="size-4" />
              <ChevronDown className="size-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            <DropdownMenuLabel>Surlignage</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-4 gap-1 p-2">
              {HIGHLIGHT_COLORS.map(({ label, value: hex }) => (
                <button
                  key={label + hex}
                  type="button"
                  title={label}
                  className={cn(
                    "size-8 rounded-md border border-border shadow-sm transition hover:scale-105 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring",
                    hex === "" && "bg-muted"
                  )}
                  style={hex ? { backgroundColor: hex } : undefined}
                  onClick={() => {
                    if (hex === "") {
                      editor.chain().focus().unsetHighlight().run();
                    } else {
                      editor.chain().focus().setHighlight({ color: hex }).run();
                    }
                  }}
                />
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().unsetHighlight().run()}
            >
              Retirer le surlignage
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => {
            const previous = editor.getAttributes("link").href as
              | string
              | undefined;
            const next = window.prompt(
              "Adresse du lien (vide = retirer le lien)",
              previous ?? "https://"
            );
            if (next === null) return;
            const trimmed = next.trim();
            if (trimmed === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              return;
            }
            const href = /^https?:\/\//i.test(trimmed)
              ? trimmed
              : `https://${trimmed}`;
            editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
          }}
          aria-label="Lien"
          aria-pressed={editor.isActive("link")}
        >
          <Link2 className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("image") ? "secondary" : "ghost"}
              size="icon"
              className="size-8 shrink-0"
              aria-label="Image"
              aria-pressed={editor.isActive("image")}
            >
              <ImagePlus className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[220px]">
            <DropdownMenuLabel>Image dans le texte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={disabled || !canUploadRichTextImage}
              onClick={() => richTextImageInputRef.current?.click()}
            >
              Téléverser une image…
            </DropdownMenuItem>
            <DropdownMenuItem disabled={disabled} onClick={insertImageFromUrl}>
              Insérer une URL…
            </DropdownMenuItem>
            {!canUploadRichTextImage ? (
              <>
                <DropdownMenuSeparator />
                <p className="px-2 py-1.5 text-[11px] text-muted-foreground">
                  Téléversement indisponible : aucun brouillon ni aventure associé.
                </p>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        <Button
          type="button"
          variant={isAlign("left") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          aria-label="Aligner le texte à gauche"
          aria-pressed={isAlign("left")}
        >
          <AlignLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant={isAlign("center") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          aria-label="Centrer le texte"
          aria-pressed={isAlign("center")}
        >
          <AlignCenter className="size-4" />
        </Button>
        <Button
          type="button"
          variant={isAlign("right") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          aria-label="Aligner le texte à droite"
          aria-pressed={isAlign("right")}
        >
          <AlignRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant={isAlign("justify") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          aria-label="Justifier"
          aria-pressed={isAlign("justify")}
        >
          <AlignJustify className="size-4" />
        </Button>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        <Button
          type="button"
          variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="Titre niveau 1"
          aria-pressed={editor.isActive("heading", { level: 1 })}
        >
          <Heading1 className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Titre niveau 2"
          aria-pressed={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-label="Titre niveau 3"
          aria-pressed={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 className="size-4" />
        </Button>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Liste à puces"
          aria-pressed={editor.isActive("bulletList")}
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Liste numérotée"
          aria-pressed={editor.isActive("orderedList")}
        >
          <ListOrdered className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Citation"
          aria-pressed={editor.isActive("blockquote")}
        >
          <Quote className="size-4" />
        </Button>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        <Button
          type="button"
          variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label="Bloc de code"
          aria-pressed={editor.isActive("codeBlock")}
        >
          <Code2 className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          aria-label="Ligne horizontale"
        >
          <Minus className="size-4" />
        </Button>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Annuler"
        >
          <Undo className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Rétablir"
        >
          <Redo className="size-4" />
        </Button>
      </div>
      {imageLayoutOpen
        ? createPortal(
            <div
              className="pointer-events-none fixed inset-0 flex items-center justify-center"
              style={{ zIndex: 100_000 }}
            >
              <div
                role="toolbar"
                aria-label="Mise en page de l’image"
                className="pointer-events-auto flex flex-wrap items-center gap-0.5 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
              >
                <ImageLayoutToolbar editor={editor} />
              </div>
            </div>,
            document.body
          )
        : null}
      <EditorContent
        editor={editor}
        className={cn(
          "text-left",
          "rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow]",
          "outline-none focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          "[&_.prose-desc]:min-h-[120px]",
          "[&_.prose-desc_ul]:list-disc [&_.prose-desc_ul]:pl-5 [&_.prose-desc_ol]:list-decimal [&_.prose-desc_ol]:pl-5",
          "[&_.prose-desc_h1]:text-xl [&_.prose-desc_h1]:font-bold [&_.prose-desc_h1]:my-2",
          "[&_.prose-desc_h2]:text-lg [&_.prose-desc_h2]:font-semibold [&_.prose-desc_h2]:my-2",
          "[&_.prose-desc_h3]:text-base [&_.prose-desc_h3]:font-semibold [&_.prose-desc_h3]:my-1.5",
          "[&_.prose-desc_p]:my-1",
          "[&_.prose-desc_blockquote]:my-2 [&_.prose-desc_blockquote]:border-l-4 [&_.prose-desc_blockquote]:border-muted-foreground/40 [&_.prose-desc_blockquote]:pl-4 [&_.prose-desc_blockquote]:italic [&_.prose-desc_blockquote]:text-muted-foreground",
          "[&_.prose-desc_code]:rounded-md [&_.prose-desc_code]:bg-muted [&_.prose-desc_code]:px-1.5 [&_.prose-desc_code]:py-0.5 [&_.prose-desc_code]:font-mono [&_.prose-desc_code]:text-[0.85em]",
          "[&_.prose-desc_pre]:my-2 [&_.prose-desc_pre]:overflow-x-auto [&_.prose-desc_pre]:rounded-md [&_.prose-desc_pre]:border [&_.prose-desc_pre]:border-border [&_.prose-desc_pre]:bg-muted/80 [&_.prose-desc_pre]:p-3 [&_.prose-desc_pre]:font-mono [&_.prose-desc_pre]:text-xs",
          "[&_.prose-desc_hr]:my-4 [&_.prose-desc_hr]:border-border",
          "[&_.prose-desc_mark]:rounded-sm [&_.prose-desc_mark]:px-0.5",
          "[&_.prose-desc_img]:my-2 [&_.prose-desc_img]:block [&_.prose-desc_img]:max-w-full [&_.prose-desc_img]:cursor-pointer",
          "[&_img.ProseMirror-selectednode]:ring-2 [&_img.ProseMirror-selectednode]:ring-ring [&_img.ProseMirror-selectednode]:ring-offset-2 [&_img.ProseMirror-selectednode]:ring-offset-background",
          ariaInvalid && "border-destructive"
        )}
      />
    </div>
  );
}
