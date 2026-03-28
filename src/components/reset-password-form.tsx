"use client"
import { authClient } from "@/lib/auth-client";
import {
  Field,
  FieldGroup,
} from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"
import { toast } from "sonner";
import { useRouter } from "next/navigation"


type ResetPasswordFormProps = {
  className?: string;
  passwordForm: {
    newPassword: string;
    confirmPassword: string;
  };
  setPasswordForm: React.Dispatch<
    React.SetStateAction<{
      newPassword: string;
      confirmPassword: string;
    }>
  >;
};

export function ResetPasswordFormComponent({
  passwordForm,
  setPasswordForm,
}: ResetPasswordFormProps) {
  const router = useRouter()

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.")
      return
    }

    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) {
      toast.error("Lien de réinitialisation introuvable ou expiré.")
      return
    }

    const { error } = await authClient.resetPassword({
      newPassword: passwordForm.newPassword,
      token,
    })

    if (error) {
      toast.error("Erreur lors de la réinitialisation du mot de passe")
    } else {
      toast.success("Mot de passe mis à jour !")
      setTimeout(() => router.push("/admin-game"), 1500)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Changer votre mot de passe</CardTitle>
        <CardDescription>
          Saisissez un nouveau mot de passe pour votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent>
  <div>
 
        <form onSubmit={handleReset}>
          <FieldGroup>
            <Field>
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                placeholder="Votre mot de passe"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                required
              />
            </Field>

            <Field>
              <Label htmlFor="confirmPassword">Confirmez le mot de passe</Label>
              <Input
                id="confirmPassword"
                placeholder="Confirmez votre mot de passe"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                required
              />
            </Field>

            <Field className="flex flex-col gap-3">
              <Button type="submit">
                Réinitialiser le mot de passe
              </Button>
            </Field>
          </FieldGroup>
        </form>
         </div>
      </CardContent>
    </Card>
  )
}