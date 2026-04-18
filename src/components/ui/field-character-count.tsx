import { cn } from "@/lib/utils";

/** Compteur « longueur / max » pour champs texte (formulaires admin). */
export function FieldCharacterCount({
  length,
  max,
  className,
}: {
  length: number;
  max: number;
  className?: string;
}) {
  const over = length > max;
  return (
    <span
      className={cn(
        "tabular-nums text-xs text-muted-foreground",
        over && "font-medium text-destructive",
        className
      )}
      aria-live="polite"
    >
      {length} / {max}
    </span>
  );
}
