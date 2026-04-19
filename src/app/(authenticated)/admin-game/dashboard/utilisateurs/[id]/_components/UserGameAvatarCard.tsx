import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { UserSelectedAvatarSummary } from "../_lib/user-queries";

export function UserGameAvatarCard({ data }: { data: UserSelectedAvatarSummary }) {
  const a = data.avatar;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar compagnon (jeu)</CardTitle>
        <CardDescription>Choix enregistré pour la carte / AR dans l’app mobile.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!data.selectedAvatarId || !a ? (
          <p className="text-sm text-muted-foreground">Aucun avatar sélectionné côté joueur.</p>
        ) : (
          <div className="flex flex-wrap items-start gap-4">
            {a.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.thumbnailUrl}
                alt=""
                className="size-16 shrink-0 rounded-md border object-cover"
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                —
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <p className="font-medium leading-tight">{a.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{a.slug}</p>
              <p className="break-all font-mono text-[11px] text-muted-foreground">id : {a.id}</p>
              {a.modelUrl ? (
                <p className="text-xs text-muted-foreground">
                  Modèle hébergé : <span className="break-all">{a.modelUrl}</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Modèle : bundle app (slug) ou non défini.</p>
              )}
            </div>
          </div>
        )}
        {a && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin-game/dashboard/avatars/${a.id}`}>Fiche avatar</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
