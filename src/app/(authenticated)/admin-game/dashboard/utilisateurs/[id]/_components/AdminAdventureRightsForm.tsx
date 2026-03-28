"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import { setAdminAdventureRights } from "../_lib/user.action";

type AdventureItem = {
  id: string;
  name: string;
  city: string;
};

export function AdminAdventureRightsForm(props: {
  userId: string;
  adventures: AdventureItem[];
  initialAssignedIds: string[];
}) {
  const caps = useAdminCapabilities();
  const [selected, setSelected] = useState<Set<string>>(new Set(props.initialAssignedIds));
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (adventureId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(adventureId);
      } else {
        next.delete(adventureId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await setAdminAdventureRights(props.userId, Array.from(selected));
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
  };

  return (
    <div className="space-y-3">
      <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
        {props.adventures.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune aventure disponible.</p>
        ) : (
          props.adventures.map((adventure) => (
            <label key={adventure.id} className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={selected.has(adventure.id)}
                disabled={!caps.canAssignRolesAndScopes}
                onCheckedChange={(checked) => toggle(adventure.id, checked === true)}
              />
              <span>
                {adventure.name} - {adventure.city}
              </span>
            </label>
          ))
        )}
      </div>
      <GuardedButton
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        allowed={caps.canAssignRolesAndScopes}
        denyReason="Seul un super administrateur peut attribuer des droits sur les aventures."
      >
        {isSaving ? "Enregistrement..." : "Enregistrer les droits"}
      </GuardedButton>
    </div>
  );
}
