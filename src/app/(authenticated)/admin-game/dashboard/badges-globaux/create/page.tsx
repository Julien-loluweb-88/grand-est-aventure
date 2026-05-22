import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GlobalBadgeForm } from "../_components/GlobalBadgeForm";

export default async function CreateGlobalBadgePage() {
  return (
    <div className="m-8 space-y-6">
      <Link
        href="/admin-game/dashboard/badges-globaux"
        className="inline-flex text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        ← Badges globaux
      </Link>
      <Card className="h-fit p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-bold tracking-tight">Nouveau badge global</CardTitle>
          <CardDescription>
            Choisissez le type de règle : le formulaire s’adapte. Le slug technique est généré
            automatiquement à partir du libellé.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <GlobalBadgeForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
