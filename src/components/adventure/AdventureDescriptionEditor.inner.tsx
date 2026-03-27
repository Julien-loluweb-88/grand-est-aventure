"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
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
import type { AdventureDescriptionEditorProps } from "./adventure-description-editor.types";

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

export function AdventureDescriptionEditorInner({
  id,
  value,
  onChange,
  disabled,
  "aria-invalid": ariaInvalid,
  className,
}: AdventureDescriptionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
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

  return (
    <div className={cn("space-y-2", className)}>
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

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        <Button
          type="button"
          variant={isAlign("left") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 shrink-0"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          aria-label="Aligner à gauche"
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
          aria-label="Centrer"
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
          aria-label="Aligner à droite"
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
          ariaInvalid && "border-destructive"
        )}
      />
    </div>
  );
}
