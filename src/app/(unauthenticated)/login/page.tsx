import { Suspense } from "react"
import Link from "next/link"
import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Chargement…</div>}>
          <LoginForm />
        </Suspense>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Accès réservé à l’équipe (création d’aventures, modération) :{" "}
          <Link
            href="/admin-game"
            className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
          >
            /admin-game
          </Link>
        </p>
      </div>
    </div>
  )
}
