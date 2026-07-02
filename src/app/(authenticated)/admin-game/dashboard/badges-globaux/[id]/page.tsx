import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GlobalBadgeForm } from "../_components/GlobalBadgeForm";
import { criteriaToFormDefaults } from "../_lib/criteria-form-defaults";
import { getGlobalBadgeForAdminEdit } from "../_lib/global-badge-queries";
import { isAdminGlobalBadgeKind } from "@/lib/badges/global-badge-metadata";

export default async function EditGlobalBadgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getGlobalBadgeForAdminEdit(id);

  if (!result.ok) {
    if (result.reason === "auth") {
      redirect("/admin-game/dashboard/acces-refuse");
    }
    notFound();
  }
  const row = result.row;
  if (!isAdminGlobalBadgeKind(row.kind)) {
    notFound();
  }

  const criteriaDefaults = criteriaToFormDefaults(row.kind, row.criteria);

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
          <CardTitle className="text-2xl font-bold tracking-tight">Modifier : {row.title}</CardTitle>
          <CardDescription className="font-mono text-xs">id {row.id}</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <GlobalBadgeForm
            mode="edit"
            badgeId={row.id}
            slug={row.slug}
            defaultValues={{
              title: row.title,
              kind: row.kind,
              sortOrder: row.sortOrder,
              imageUrl: row.imageUrl ?? "",
              ...criteriaDefaults,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
