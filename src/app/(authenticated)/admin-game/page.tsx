"use client"

import Link from "next/link"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginFormComponent, SignUpFormComponent } from "@/components/login-form"

const ADMIN_ROLES = ["admin", "superadmin"] as const

export default function AdminGamePage() {
  const { data: session } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user?.role && ADMIN_ROLES.includes(session.user.role as (typeof ADMIN_ROLES)[number])) {
      router.replace("/admin-game/dashboard")
    }
  }, [session, router])

  const [signUpForm, setSignUpForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  })

  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await authClient.signIn.email({
      email: signInForm.email,
      password: signInForm.password,
      callbackURL: "/admin-game/dashboard",
    })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }
    router.push("/admin-game/dashboard")
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.")
      return
    }
    setLoading(true)
    const { error } = await authClient.signUp.email({
      name: signUpForm.name,
      email: signUpForm.email,
      password: signUpForm.password,
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    router.push("/admin-game/dashboard")
  }

  return (
    <div className="flex min-h-svh w-full flex-col items-center p-6 md:p-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Admin Game</h1>
      <div className="w-full max-w-[400px]">
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="mt-6">
            <LoginFormComponent
              signInForm={signInForm}
              setSignInForm={setSignInForm}
              handleSignIn={handleSignIn}
              loading={loading}
            />
          </TabsContent>
          <TabsContent value="signup" className="mt-6">
            <SignUpFormComponent
              signUpForm={signUpForm}
              setSignUpForm={setSignUpForm}
              handleSignUp={handleSignUp}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
      <p className="mt-8 max-w-md text-center text-sm text-muted-foreground">
        Connexion grand public (sans accès admin) :{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4 hover:no-underline">
          /login
        </Link>
      </p>
    </div>
  )
}
