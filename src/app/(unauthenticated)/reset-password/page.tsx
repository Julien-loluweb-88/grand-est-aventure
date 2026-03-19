"use client"
import { useState } from "react"
import { ResetPasswordFormComponent } from "@/components/reset-password-form"

export default function ResetPasswordPage() {
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  return (
    <><div className="w-screen p-10 flex justify-center items-center">
    <ResetPasswordFormComponent
      passwordForm={passwordForm}
      setPasswordForm={setPasswordForm}
    />
    </div>
    </>
  )
}