"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listAdventuresForCityAdmin, type CityAdventureListItem } from "../city.action";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  cityId: string;
  cityName: string;
  count: number;
};

export function CityAdventuresCountModal({ cityId, cityName, count }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adventures, setAdventures] = useState<CityAdventureListItem[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listAdventuresForCityAdmin(cityId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        setAdventures([]);
        return;
      }
      setAdventures(res.adventures);
    });
    return () => {
      cancelled = true;
    };
  }, [open, cityId]);

  if (count === 0) {
    return <span className="text-muted-foreground">0</span>;
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "tabular-nums text-primary underline-offset-2 hover:underline",
          "cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {count}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[min(90vh,32rem)] w-[min(calc(100vw-2rem),28rem)] flex-col gap-0 p-0 sm:max-w-lg"
          showCloseButton
        >
          <DialogHeader className="border-b border-border p-4 pr-12">
            <DialogTitle className="text-base leading-snug">
              Aventures — {cityName}
            </DialogTitle>
            <DialogDescription>
              Choisissez une aventure pour ouvrir sa fiche.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" aria-hidden />
                <span className="sr-only">Chargement…</span>
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : adventures.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune aventure dans votre périmètre pour cette ville.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {adventures.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/admin-game/dashboard/aventures/${a.id}`}
                      onClick={() => setOpen(false)}
                      className="flex flex-col gap-0.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <span className="font-medium text-foreground">{a.name}</span>
                      {!a.status ? (
                        <span className="text-xs text-destructive">Pause</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
