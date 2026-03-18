import React from "react";
import { getUserById } from "./user.action";
import { AddressEditForm } from "./AdressEditForm";
import { BanEditForm } from "./BanUser";
import { UnBanEditForm } from "./UnBanUser";
import { RoleEditForm } from "./RoleUser";
import { RemoveUserForm } from "./RemoveUser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { User } from "../../../../../../../generated/prisma/browser";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Utilisateur non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* En-tête utilisateur */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Modifiez les informations de {user.name}
          </CardTitle>
          <CardDescription>
            ID: {user.id}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Grille : adresse à gauche, actions à droite */}
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:gap-8">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Adresse & contact</CardTitle>
            <CardDescription>
              Adresse postale et numéro de téléphone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddressEditForm user={user as User} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Rôle & modération</CardTitle>
              <CardDescription>
                Rôle, bannissement et suppression du compte
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <RoleEditForm user={user as User} />
              {user.banned === false && <BanEditForm user={user as User} />}
              {user.banned && <UnBanEditForm user={user as User} />}
              <RemoveUserForm user={user as User} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}