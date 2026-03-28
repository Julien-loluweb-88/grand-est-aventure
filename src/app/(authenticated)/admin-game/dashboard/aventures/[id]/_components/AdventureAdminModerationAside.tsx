import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusAdventure } from "./StatusAdventure";
import { RemoveAdventureForm } from "./RemoveAdventure";
import { AdventureAdminAssigneesForm } from "./AdventureAdminAssigneesForm";
import type { AdventureAdminScopeEditorResult } from "../_lib/adventure-admin-scope-queries";

export function AdventureAdminModerationAside({
  adventureId,
  adventureName,
  adminScopeSection,
}: {
  adventureId: string;
  adventureName: string;
  adminScopeSection: AdventureAdminScopeEditorResult | null;
}) {
  return (
    <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4">
      <Card>
        <CardHeader>
          <CardTitle>Modération</CardTitle>
          <CardDescription>Changement statut, suppression</CardDescription>
        </CardHeader>
        <CardContent className="mx-auto flex w-full max-w-xs flex-col gap-3">
          <StatusAdventure adventure={{ id: adventureId }} />
          <RemoveAdventureForm adventure={{ id: adventureId, name: adventureName }} />
        </CardContent>
      </Card>

      {adminScopeSection?.ok ? (
        <Card>
          <CardHeader>
            <CardTitle>Admins sur cette aventure</CardTitle>
            <CardDescription>
              Comptes admin client autorisés à gérer le contenu (équivalent à la fiche utilisateur).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdventureAdminAssigneesForm
              adventureId={adventureId}
              admins={adminScopeSection.admins}
              initialAssignedIds={adminScopeSection.assignedAdminIds}
            />
          </CardContent>
        </Card>
      ) : adminScopeSection && !adminScopeSection.ok ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{adminScopeSection.error}</p>
          </CardContent>
        </Card>
      ) : null}
    </aside>
  );
}
