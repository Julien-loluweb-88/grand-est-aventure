import { Suspense } from "react";
import { PwaInstallPanel } from "@/components/pwa/pwa-install-panel";
import { ChangePasswordForm } from "@/components/change-password-form";
import { ChangeEmailForm } from "@/components/change-email-form";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { EmailVerificationQueryToasts } from "@/components/email-verification-prompt";
import { getUser } from "@/lib/auth/auth-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ParametresPage() {
  const user = await getUser();
  const userEmail = user?.email?.trim() ?? "";

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <Suspense fallback={null}>
        <EmailVerificationQueryToasts />
      </Suspense>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Options de l’interface d’administration.
        </p>
      </div>

      <Card id="email">
        <CardHeader>
          <CardTitle>Adresse e-mail</CardTitle>
          <CardDescription>
            Demander une nouvelle adresse : un message de confirmation est envoyé à l’e-mail actuel du
            compte (compte vérifié requis côté Better Auth).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangeEmailForm />
        </CardContent>
      </Card>

      <Card id="mot-de-passe">
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
          <CardDescription>
            Modifiez le mot de passe du compte avec lequel vous êtes connecté (e-mail / mot de passe).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card id="supprimer-compte" className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Supprimer mon compte</CardTitle>
          <CardDescription>
            Suppression définitive depuis le site. Les comptes sans mot de passe (Google, Facebook,
            Discord) reçoivent un e-mail avec un lien web et un lien pour l’application mobile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userEmail ? (
            <DeleteAccountForm userEmail={userEmail} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Impossible d’afficher le formulaire : adresse e-mail du compte introuvable.
            </p>
          )}
        </CardContent>
      </Card>

      <PwaInstallPanel />
    </div>
  );
}
