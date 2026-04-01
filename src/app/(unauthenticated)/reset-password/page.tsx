"use client"
import { useState } from "react"
import { ResetPasswordFormComponent } from "@/components/reset-password-form"

export default function ResetPasswordPage() {
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center p-6 md:p-10">
      <ResetPasswordFormComponent
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
      />
    </div>
  )
}