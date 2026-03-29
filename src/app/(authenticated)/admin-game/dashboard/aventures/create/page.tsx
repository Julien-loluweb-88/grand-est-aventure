import React from "react";
import { CreateAdventureForm } from "./AdventureCreateForm";
import { Card, CardTitle } from "@/components/ui/card";
import { listAdminUsersForNewAdventureScope } from "../[id]/_lib/adventure-admin-scope-queries";
import { listCitiesForAdventureSelect } from "@/lib/city-admin-queries";
export default async function Page() {
  const assignableAdmins = await listAdminUsersForNewAdventureScope();
  const cities = await listCitiesForAdventureSelect();

  return (
    <>
      <div className="m-8">
        <Card className="h-fit p-5">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Créer une aventure
          </CardTitle>

          <CreateAdventureForm assignableAdmins={assignableAdmins} cities={cities} />
        </Card>
      </div>
    </>
  );
}
