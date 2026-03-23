import React from "react";
import { CreateAdventureForm } from "./AdventureCreateForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <>
      <div className="m-8">
        <Card className="h-fit p-5">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Créer une aventure
          </CardTitle>

          <CreateAdventureForm />
        </Card>
      </div>
    </>
  );
}
