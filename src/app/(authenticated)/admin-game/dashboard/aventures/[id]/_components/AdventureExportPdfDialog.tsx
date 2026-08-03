"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAdventureExportPayload } from "../_lib/adventure-export.action";
import { buildAdventureExportHtml } from "../_lib/adventure-export-html";
import {
  ADVENTURE_EXPORT_OPTIONAL_SECTIONS,
  type AdventureExportAvailability,
  type AdventureExportOptionalSection,
} from "../_lib/adventure-export.types";

const SECTION_LABELS: Record<
  AdventureExportOptionalSection,
  { label: string; hint: string }
> = {
  enigmas: {
    label: "Énigmes",
    hint: "Questions, contexte, réponses et coordonnées",
  },
  treasure: {
    label: "Trésor",
    hint: "Description, message de fin et codes coffre",
  },
  reviews: {
    label: "Avis",
    hint: "Avis validés uniquement",
  },
  discoveryPoints: {
    label: "Points de découverte",
    hint: "Titres, teasers et positions",
  },
  partnerLots: {
    label: "Lots partenaires",
    hint: "Offres de la roue partenaires",
  },
};

function openExportWindow(html: string) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
  if (!win) {
    throw new Error(
      "Impossible d’ouvrir la fenêtre d’export. Autorisez les pop-ups pour ce site."
    );
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export function AdventureExportPdfDialog({
  adventureId,
  adventureName,
  availability,
}: {
  adventureId: string;
  adventureName: string;
  availability: AdventureExportAvailability;
}) {
  const availableSections = useMemo(
    () => ADVENTURE_EXPORT_OPTIONAL_SECTIONS.filter((key) => availability[key]),
    [availability]
  );

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<AdventureExportOptionalSection>>(
    () => new Set(availableSections)
  );
  const [pending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setSelected(new Set(availableSections));
    }
  };

  const toggleSection = (section: AdventureExportOptionalSection, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(section);
      else next.delete(section);
      return next;
    });
  };

  const runExport = () => {
    const sections = Array.from(selected);

    startTransition(async () => {
      const result = await getAdventureExportPayload(adventureId, sections);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      try {
        openExportWindow(buildAdventureExportHtml(result.payload));
        setOpen(false);
        toast.success("Fenêtre d’export ouverte — enregistrez en PDF.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Échec de l’ouverture de l’export."
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <FileDown data-icon="inline-start" />
          Exporter en PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter « {adventureName} »</DialogTitle>
          <DialogDescription>
            Génère une fiche à transmettre (client, partenaire…). Les infos
            générales sont toujours incluses.
            {availableSections.length > 0
              ? " Cochez les blocs à ajouter au PDF."
              : " Aucun bloc optionnel disponible pour cette aventure."}
          </DialogDescription>
        </DialogHeader>

        {availableSections.length > 0 ? (
          <div className="flex flex-col gap-3 py-1">
            {availableSections.map((section) => {
              const meta = SECTION_LABELS[section];
              const id = `export-section-${section}`;
              const checked = selected.has(section);
              return (
                <div key={section} className="flex items-start gap-3">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(value) =>
                      toggleSection(section, value === true)
                    }
                  />
                  <div className="grid gap-0.5">
                    <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
                      Inclure {meta.label.toLowerCase()}
                    </Label>
                    <p className="text-xs text-muted-foreground">{meta.hint}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Document professionnel : peut contenir réponses d’énigmes et codes
          coffre. Utilisez « Enregistrer au format PDF » dans l’impression.
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Annuler
          </Button>
          <Button type="button" onClick={runExport} disabled={pending}>
            {pending ? "Préparation…" : "Générer le PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
