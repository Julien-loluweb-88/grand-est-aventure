"use client"
import { authClient } from "@/lib/auth-client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginFormComponent, SignUpFormComponent  } from "@/components/login-form"
export default function Home() {
  const router = useRouter()
// State Inscription 
  const [signUpForm, setSignUpForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // State Connexion
  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  })

  const [loading, setLoading] = useState(false)

  // Connexion
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await authClient.signIn.email({
      email: signInForm.email,
      password: signInForm.password,
      callbackURL: "/admin-game/dashboard",
    })
    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }
    console.log(data)
    router.push("/admin-game/dashboard")
  }

  // Inscription 
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if(signUpForm.password !== signUpForm.confirmPassword){
      alert("Les mots de passe ne correspondent pas")
      return
    }
  setLoading(true)
  console.log("je suis la data", signUpForm)
  const { data, error } = await authClient.signUp.email({
  name: signUpForm.name,
  email: signUpForm.email,
  password: signUpForm.password
  });

  setLoading(false)

  if (error) {
    console.log(error)
    alert(error.message)
    return
  }

  console.log(data)
  router.push("/admin-game/dashboard")
  }

  return (
      <><h1>Admin Game</h1>
      <div className="w-screen p-10 flex justify-center items-center">
        <Tabs defaultValue="signin" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="signin">Connexion</TabsTrigger>
    <TabsTrigger value="signup">Inscription</TabsTrigger>
  </TabsList>
  <TabsContent value="signin"> 
      <LoginFormComponent
  signInForm={signInForm}
  setSignInForm={setSignInForm}
  handleSignIn={handleSignIn}
  loading={loading}
/> 
</TabsContent>
<TabsContent value="signup">
 <SignUpFormComponent
  signUpForm={signUpForm}
  setSignUpForm={setSignUpForm}
  handleSignUp={handleSignUp}
  loading={loading}
/>   
</TabsContent>
</Tabs> 
    </div>
    </>
  );
}