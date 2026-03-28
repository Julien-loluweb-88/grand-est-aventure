import { Suspense } from "react";
import { PwaInstallPanel } from "@/components/pwa/pwa-install-panel";
import { ChangePasswordForm } from "@/components/change-password-form";
import { ChangeEmailForm } from "@/components/change-email-form";
import { EmailVerificationQueryToasts } from "@/components/email-verification-prompt";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ParametresPage() {
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

      <PwaInstallPanel />
    </div>
  );
}
