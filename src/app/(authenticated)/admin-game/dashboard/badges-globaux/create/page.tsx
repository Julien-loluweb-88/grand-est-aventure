import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MilestoneBadgeForm } from "../_components/MilestoneBadgeForm";

export default function CreateMilestoneBadgePage() {
  return (
    <div className="m-8 space-y-6">
      <Link
        href="/admin-game/dashboard/badges-globaux"
        className="inline-flex text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        ← Badges globaux (paliers)
      </Link>
      <Card className="h-fit p-5">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-bold tracking-tight">Nouveau badge palier</CardTitle>
          <CardDescription>
            Le slug sera créé automatiquement à partir du libellé (avec suffixe numérique si besoin pour
            éviter les doublons).
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <MilestoneBadgeForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
