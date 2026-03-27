import React from "react";
import { CreateAdventureForm } from "./AdventureCreateForm";
import { Card, CardTitle } from "@/components/ui/card";
import { listAdminUsersForNewAdventureScope } from "../[id]/adventure-admin-scope-queries";

export default async function Page() {
  const assignableAdmins = await listAdminUsersForNewAdventureScope();

  return (
    <>
      <div className="m-8">
        <Card className="h-fit p-5">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Créer une aventure
          </CardTitle>

          <CreateAdventureForm assignableAdmins={assignableAdmins} />
        </Card>
      </div>
    </>
  );
}
