"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { getResetPasswordRedirectUrl } from "@/lib/public-app-url"
import { toast } from "sonner"

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/"
  }
  return raw
}

/** Connexion unique pour `/login` : utilise `?callbackUrl=` après redirection depuis l’admin. */
export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = useMemo(
    () => safeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams]
  )

  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSignIn = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setLoading(true)
      const { error } = await authClient.signIn.email({
        email: signInForm.email,
        password: signInForm.password,
        callbackURL: callbackUrl,
      })
      setLoading(false)
      if (error) {
        toast.error(error.message)
        return
      }
      router.push(callbackUrl)
    },
    [callbackUrl, router, signInForm.email, signInForm.password]
  )

  return (
    <LoginFormComponent
      signInForm={signInForm}
      setSignInForm={setSignInForm}
      handleSignIn={handleSignIn}
      loading={loading}
    />
  )
}

type LoginFormProps = {
  className?: string
  signInForm: {
    email: string
    password: string
  }
  setSignInForm: React.Dispatch<
    React.SetStateAction<{
      email: string
      password: string
    }>
  >
  handleSignIn: (e: React.FormEvent<HTMLFormElement>) => void
  loading: boolean
}

export function LoginFormComponent({
  className,
  signInForm,
  setSignInForm,
  handleSignIn,
  loading,
}: LoginFormProps) {

const handleForgotPassword = async () => {
  if(!signInForm.email){
    toast.error("Veuillez saisir votre adresse e-mail.");
    return;
  }
  const { error } = await authClient.requestPasswordReset({
    email: signInForm.email,
    redirectTo: getResetPasswordRedirectUrl(),
  })
  if (error) {
    toast.error(error.message ?? "Impossible d’envoyer l’e-mail.")
  } else {
    toast.success("E-mail de réinitialisation envoyé.")
  }
}
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Saisissez votre adresse e-mail et votre mot de passe pour accéder à votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={signInForm.email}
                  onChange={(e) =>
                    setSignInForm({ ...signInForm, email: e.target.value })
                  }
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                  <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="ml-auto text-sm underline hover:underline">
                    Mot de passe oublié ?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={signInForm.password}
                  onChange={(e) =>
                    setSignInForm({ ...signInForm, password: e.target.value })
                  }
                  required
                />
              </Field>

              <Field className="flex flex-col gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Connexion…" : "Se connecter"}
                </Button>

                <Button variant="outline" type="button">
                  Se connecter avec Google
                </Button>

                <FieldDescription className="text-center">
                  Pas encore de compte ? Utilisez l’onglet « Inscription ».
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

type SignUpFormProps = {
  className?: string
  signUpForm: {
    name: string
    email: string
    password: string
    confirmPassword: string
  }
  setSignUpForm: React.Dispatch<
    React.SetStateAction<{
      name: string
      email: string
      password: string
      confirmPassword: string
    }>
  >
  handleSignUp: (e: React.FormEvent<HTMLFormElement>) => void
  loading: boolean
}

export function SignUpFormComponent({
  signUpForm,
  setSignUpForm,
  handleSignUp,
  loading,
}: SignUpFormProps) {
  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader>
          <CardTitle>Inscription</CardTitle>
          <CardDescription>
            Créez un compte avec votre nom, votre adresse e-mail et un mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fieldgroup-name">Votre nom</FieldLabel>
                <Input
                  id="fieldgroup-name"
                  placeholder="Jordan Lee"
                    value={signUpForm.name}
                  onChange={(e) =>
                    setSignUpForm({ ...signUpForm, name: e.target.value })
                  }
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="signup-email">E-mail</FieldLabel>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="vous@exemple.fr"
                  value={signUpForm.email}
                  onChange={(e) =>
                    setSignUpForm({ ...signUpForm, email: e.target.value })
                  }
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                </div>
                <Input
                  id="password"
                  placeholder="Votre mot de passe"
                  type="password"
                  value={signUpForm.password}
                  onChange={(e) =>
                    setSignUpForm({ ...signUpForm, password: e.target.value })
                  }
                  required
                />
              </Field>
              <Field>
              <FieldLabel htmlFor="confirmPassword">
                Confirmez le mot de passe
              </FieldLabel>
              <Input
                id="confirmPassword"
                placeholder="Confirmez votre mot de passe"
                type="password"
                value={signUpForm.confirmPassword} onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })} />
            </Field>

              <Field className="flex flex-col gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Inscription en cours…" : "S&apos;inscrire"}
                </Button>

                <Button variant="outline" type="button">
                  Continuer avec Google
                </Button>

                <FieldDescription className="text-center">
                  Déjà un compte ? Utilisez l’onglet « Connexion ».
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}