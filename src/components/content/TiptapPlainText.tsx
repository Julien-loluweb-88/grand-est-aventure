import { tiptapStoredValueToPlainText } from "@/lib/adventure-description-tiptap";
import { cn } from "@/lib/utils";

type Props = {
  /** Valeur Prisma `Json` (document TipTap), ancienne chaîne, ou `null`. */
  value: unknown;
  className?: string;
  /** Si le texte est vide après conversion, ne rien afficher (défaut : `true`). */
  hideWhenEmpty?: boolean;
};

/**
 * Affichage **texte brut** d’un contenu TipTap (description d’aventure, énigme,
 * `answerMessage`, trésor, etc.). À utiliser sur les écrans joueur ou toute lecture simple.
 */
export function TiptapPlainText({
  value,
  className,
  hideWhenEmpty = true,
}: Props) {
  const text = tiptapStoredValueToPlainText(value);
  if (hideWhenEmpty && !text.trim()) {
    return null;
  }
  return (
    <div className={cn("wrap-break-word whitespace-pre-wrap text-sm", className)}>
      {text}
    </div>
  );
}
