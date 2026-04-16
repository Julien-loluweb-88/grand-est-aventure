"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import {
  addAdventureDemoAccess,
  removeAdventureDemoAccess,
} from "../_lib/demo-access.action";

export type DemoAccessRow = {
  id: string;
  createdAt: Date;
  user: { id: string; email: string; name: string | null };
};

export function AdventureDemoAccessCard({
  adventureId,
  initialRows,
}: {
  adventureId: string;
  initialRows: DemoAccessRow[];
}) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const [rows, setRows] = useState(initialRows);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const handleAdd = async () => {
    setBusy(true);
    try {
      const r = await addAdventureDemoAccess(adventureId, email);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Compte autorisé.");
      setEmail("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (accessId: string) => {
    setBusy(true);
    try {
      const r = await removeAdventureDemoAccess(adventureId, accessId);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setRows((prev) => prev.filter((x) => x.id !== accessId));
      toast.success("Accès retiré.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Comptes invités (démo)</CardTitle>
        <CardDescription>
          Les administrateurs voient toujours les aventures en « démo ». Ajoutez ici des comptes
          joueurs (e-mail du compte) pour qu’ils puissent ouvrir cette aventure dans l’app sans
          passer par le catalogue public.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field className="min-w-0 flex-1">
            <FieldLabel htmlFor="demo-email">E-mail du compte</FieldLabel>
            <Input
              id="demo-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@exemple.fr"
              disabled={busy || !caps.adventure.update}
            />
          </Field>
          <GuardedButton
            type="button"
            allowed={caps.adventure.update}
            denyReason="Vous ne pouvez pas modifier les accès démo."
            onClick={() => void handleAdd()}
            disabled={busy || email.trim().length < 3}
          >
            Ajouter
          </GuardedButton>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun compte invité pour le moment.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{row.user.email}</p>
                  {row.user.name ? (
                    <p className="truncate text-muted-foreground">{row.user.name}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-destructive hover:text-destructive"
                  disabled={busy || !caps.adventure.update}
                  onClick={() => void handleRemove(row.id)}
                >
                  Retirer
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
