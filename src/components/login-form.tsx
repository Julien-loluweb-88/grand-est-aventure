"use client"

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
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Formulaire de connexion</CardTitle>
          <CardDescription>
            Entrez votre adresse e-mail ci-dessous pour vous connecter à votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
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
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Mot de passe oublié ?
                  </a>
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
                  {loading ? "Connexion..." : "Login"}
                </Button>

                <Button variant="outline" type="button">
                  Se connecter avec Google
                </Button>

                <FieldDescription className="text-center">
                  Vous n&apos;avez pas encore de compte ? <a href="#">Inscrivez-vous</a>
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
          <CardTitle>Formulaire de inscription</CardTitle>
          <CardDescription>
            Entrez votre nom, votre adresse e-mail et votre mots de pass ci-dessous pour créer votre compte.
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
                <FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
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
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Mot de passe oublié ?
                  </a>
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
              <FieldLabel htmlFor="fieldgroup-name">Confirmez le mots de pass</FieldLabel>
              <Input
                id="confirmPassword"
                placeholder="Confirmez votre mot de passe"
                type="password"
                value={signUpForm.confirmPassword} onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })} />
            </Field>

              <Field className="flex flex-col gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Connexion..." : "Inscription"}
                </Button>

                <Button variant="outline" type="button">
                  S&apos;inscrir avec Google
                </Button>

                <FieldDescription className="text-center">
                  Vous n&apos;avez pas encore de compte ? <a href="#">Inscrivez-vous</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}