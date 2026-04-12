import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getMilestoneBadgeForAdminEdit } from "../_lib/milestone-badge-queries";
import { parseThresholdFromCriteria } from "@/lib/badges/milestone-badge-criteria";
import { MilestoneBadgeForm } from "../_components/MilestoneBadgeForm";

type MilestoneKind = "MILESTONE_ADVENTURES" | "MILESTONE_KM";

export default async function EditMilestoneBadgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getMilestoneBadgeForAdminEdit(id);

  if (!result.ok) {
    if (result.reason === "auth") {
      redirect("/admin-game/dashboard/acces-refuse");
    }
    notFound();
  }
  const row = result.row;
  const threshold = parseThresholdFromCriteria(row.kind, row.criteria);

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
          <CardTitle className="text-2xl font-bold tracking-tight">Modifier : {row.title}</CardTitle>
          <CardDescription className="font-mono text-xs">id {row.id}</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <MilestoneBadgeForm
            mode="edit"
            badgeId={row.id}
            slug={row.slug}
            defaultValues={{
              title: row.title,
              kind: row.kind as MilestoneKind,
              threshold,
              sortOrder: row.sortOrder,
              imageUrl: row.imageUrl ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
