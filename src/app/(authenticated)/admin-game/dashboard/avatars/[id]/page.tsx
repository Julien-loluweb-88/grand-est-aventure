import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAvatarForAdminEdit, listAvatarsForAdmin } from "../_lib/avatar-admin-queries";
import { AvatarEditForm } from "../_components/AvatarEditForm";

export default async function AvatarEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [canList, avatar] = await Promise.all([listAvatarsForAdmin(), getAvatarForAdminEdit(id)]);
  if (!canList) {
    redirect("/admin-game/dashboard/acces-refuse");
  }
  if (!avatar) {
    notFound();
  }

  return (
    <div className="m-8 max-w-2xl space-y-6">
      <Link
        href="/admin-game/dashboard/avatars"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour à la liste
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Modifier l’avatar</CardTitle>
          <CardDescription>
            Identifiant : <code className="rounded bg-muted px-1 text-xs">{avatar.id}</code> — slug{" "}
            <code className="rounded bg-muted px-1 text-xs">{avatar.slug}</code> (ne pas le changer
            sans aligner l’app mobile).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <AvatarEditForm avatar={avatar} />
        </CardContent>
      </Card>
    </div>
  );
}
