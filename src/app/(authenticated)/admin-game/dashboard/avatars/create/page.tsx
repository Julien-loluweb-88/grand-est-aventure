import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { listAvatarsForAdmin } from "../_lib/avatar-admin-queries";
import { AvatarCreateForm } from "../_components/AvatarCreateForm";

export default async function AvatarCreatePage() {
  const can = await listAvatarsForAdmin();
  if (!can) {
    redirect("/admin-game/dashboard/acces-refuse");
  }

  return (
    <div className="m-8 max-w-xl space-y-6">
      <Link
        href="/admin-game/dashboard/avatars"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour à la liste
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Nouvel avatar</CardTitle>
          <CardDescription>
            Le <strong>slug</strong> est immuable côté produit : l’app mobile l’utilise comme clé
            (fichier local ou repli). Après création, ajoutez vignette et modèle depuis la fiche
            « Modifier ».
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
