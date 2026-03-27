"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../AdminCapabilitiesProvider";
import { setAdventureAdminScopes } from "./adventure-admin-scope.action";

type AdminItem = {
  id: string;
  name: string | null;
  email: string;
};

export function AdventureAdminAssigneesForm(props: {
  adventureId: string;
  admins: AdminItem[];
  initialAssignedIds: string[];
}) {
  const caps = useAdminCapabilities();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(props.initialAssignedIds)
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (userId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await setAdventureAdminScopes(
      props.adventureId,
      Array.from(selected)
    );
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Cochez les comptes avec le rôle administrateur (hors super admin) qui peuvent
        gérer cette aventure
        (contenu, énigmes, etc.).{" "}
        <Link
          href="/admin-game/dashboard/utilisateurs"
          className="text-foreground underline underline-offset-2 hover:text-primary"
        >
          Liste des utilisateurs
        </Link>
      </p>
      <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
        {props.admins.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun administrateur « admin » en base. Créez ou promouvez un compte
            depuis la liste des utilisateurs.
          </p>
        ) : (
          props.admins.map((admin) => (
            <label key={admin.id} className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={selected.has(admin.id)}
                disabled={!caps.canAssignRolesAndScopes}
                onCheckedChange={(checked) => toggle(admin.id, checked === true)}
              />
              <span>
                <span className="font-medium">{admin.name ?? admin.email}</span>
                {admin.name ? (
                  <span className="text-muted-foreground"> — {admin.email}</span>
                ) : null}
              </span>
            </label>
          ))
        )}
      </div>
      <GuardedButton
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving}
        allowed={caps.canAssignRolesAndScopes}
        denyReason="Seul un super administrateur peut attribuer des admins à une aventure."
      >
        {isSaving ? "Enregistrement…" : "Enregistrer les assignations"}
      </GuardedButton>
    </div>
  );
}
