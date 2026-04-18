"use client";

import { useCallback, useState, type ComponentProps } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { editorialRewriteAction } from "@/app/(authenticated)/admin-game/dashboard/_lib/editorial-rewrite.action";
import type { EditorialRewriteScope } from "@/lib/editorial-rewrite-scope";

type Preset = "none" | "shorter" | "friendlier" | "more_formal" | "hook";

export function EditorialRewriteControl({
  scope,
  getSourceText,
  onApply,
  disabled,
  buttonLabel = "Reformuler",
  buttonSize = "sm",
  buttonVariant = "outline",
  dialogTitle = "Assistant rédaction (Mistral)",
}: {
  scope: EditorialRewriteScope;
  getSourceText: () => string;
  onApply: (text: string) => void;
  disabled?: boolean;
  buttonLabel?: string;
  buttonSize?: ComponentProps<typeof Button>["size"];
  buttonVariant?: ComponentProps<typeof Button>["variant"];
  dialogTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [instruction, setInstruction] = useState("");
  const [preset, setPreset] = useState<Preset>("none");
  const [variantCount, setVariantCount] = useState<"2" | "3">("3");
  const [variants, setVariants] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const syncDraftFromSource = useCallback(() => {
    setDraft(getSourceText());
    setVariants(null);
  }, [getSourceText]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        syncDraftFromSource();
        setInstruction("");
        setPreset("none");
        setVariantCount("3");
      }
    },
    [syncDraftFromSource]
  );

  const runRewrite = async () => {
    const text = draft.trim();
    if (text.length < 1) {
      toast.error("Collez ou saisissez un texte à reformuler.");
      return;
    }
    setLoading(true);
    setVariants(null);
    try {
      const res = await editorialRewriteAction({
        text: draft,
        instruction: instruction.trim() || undefined,
        preset: preset === "none" ? undefined : preset,
        variantCount: variantCount === "2" ? 2 : 3,
        scope,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setVariants(res.variants);
      toast.success("Variantes générées. Choisissez-en une ou copiez le texte.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inattendue.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={buttonVariant}
          size={buttonSize}
          disabled={disabled}
          className="gap-1.5"
        >
          <Sparkles className="size-3.5 shrink-0" aria-hidden />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Texte généré par IA : vérifiez les faits et le ton avant publication. Le contenu peut
            perdre la mise en forme riche (gras, liens) si vous remplacez tout le bloc.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="editorial-rewrite-source">Texte source</Label>
            <Textarea
              id="editorial-rewrite-source"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              disabled={loading}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Préréglage</Label>
              <Select
                value={preset}
                onValueChange={(v) => setPreset(v as Preset)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">(aucun)</SelectItem>
                  <SelectItem value="shorter">Plus court</SelectItem>
                  <SelectItem value="friendlier">Plus chaleureux</SelectItem>
                  <SelectItem value="more_formal">Plus formel</SelectItem>
                  <SelectItem value="hook">Plus accrocheur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre de variantes</Label>
              <Select
                value={variantCount}
                onValueChange={(v) => setVariantCount(v as "2" | "3")}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editorial-rewrite-extra">Consigne libre (optionnel)</Label>
            <Textarea
              id="editorial-rewrite-extra"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={2}
              placeholder="Ex. : tutoyer le joueur, éviter le jargon…"
              disabled={loading}
            />
          </div>
          <Button type="button" onClick={() => void runRewrite()} disabled={loading}>
            {loading ? "Génération…" : "Générer des variantes"}
          </Button>
          {variants && variants.length > 0 ? (
            <div className="space-y-2 border-t pt-3">
              <p className="text-sm font-medium">Variantes</p>
              <ul className="space-y-2">
                {variants.map((v, i) => (
                  <li
                    key={i}
                    className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap"
                  >
                    <p className="mb-2 font-medium text-muted-foreground">Variante {i + 1}</p>
                    <p>{v}</p>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        onApply(v);
                        setOpen(false);
                        toast.success("Texte appliqué au champ.");
                      }}
                    >
                      Utiliser celle-ci
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
