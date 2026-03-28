import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUserById, getAdminAdventureRights } from "./_lib/user-queries";
import { AddressEditForm } from "./_components/AddressEditForm";
import { BanEditForm } from "./_components/BanUser";
import { UnBanEditForm } from "./_components/UnBanUser";
import { RoleEditForm } from "./_components/RoleUser";
import { RemoveUserForm } from "./_components/RemoveUser";
import { AdminAdventureRightsForm } from "./_components/AdminAdventureRightsForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { User } from "../../../../../../../generated/prisma/browser";
import { getUser } from "@/lib/auth/auth-user";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, currentUser] = await Promise.all([getUserById(id), getUser()]);

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Utilisateur non trouvé</p>
      </div>
    );
  }

  const displayName = user.name ?? user.email ?? "cet utilisateur";
  const canManageAdminScopes = currentUser?.role === "superadmin" && user.role === "admin";
  const rightsData = canManageAdminScopes ? await getAdminAdventureRights(user.id) : null;

  return (
    <div className="space-y-8 p-4 md:p-6">
      <Link
        href="/admin-game/dashboard/utilisateurs"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour à la liste
      </Link>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Informations de {displayName}
          </CardTitle>
          <CardDescription>ID: {user.id}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:gap-8">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Adresse & contact</CardTitle>
            <CardDescription>Adresse postale et numéro de téléphone</CardDescription>
          </CardHeader>
          <CardContent>
            <AddressEditForm user={user as User} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Rôle & modération</CardTitle>
              <CardDescription>Rôle, bannissement et suppression du compte</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <RoleEditForm user={user as User} />
              {user.banned === false && <BanEditForm user={user as User} />}
              {user.banned && <UnBanEditForm user={user as User} />}
              <RemoveUserForm user={user as User} />
            </CardContent>
          </Card>
          {canManageAdminScopes && rightsData && (
            <Card>
              <CardHeader>
                <CardTitle>Droits admin par aventure</CardTitle>
                <CardDescription>
                  Le super admin choisit quelles aventures cet admin peut gérer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminAdventureRightsForm
                  userId={user.id}
                  adventures={rightsData.adventures}
                  initialAssignedIds={rightsData.assignedAdventureIds}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
