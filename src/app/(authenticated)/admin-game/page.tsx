"use client"
import { authClient, signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  const router = useRouter()
// State Inscription 
  const [dataForm, setDataForm] = useState({
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

  // Inscription 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if(dataForm.password !== dataForm.confirmPassword){
      alert("Les mots de passe ne correspondent pas")
      return
    }
  setLoading(true)
  console.log("je suis la data", dataForm)
  const { data, error } = await authClient.signUp.email({
  name: dataForm.name,
  email: dataForm.email,
  password: dataForm.password,
  });

  setLoading(false)

  if (error) {
    console.log(error)
    alert(error.message)
    return
  }

  console.log(data)
  router.push("/dashboard")
  }

  // Connexion
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await authClient.signIn.email({
      email: signInForm.email,
      password: signInForm.password,
      callbackURL: "/dashboard",
    })
    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }
    console.log(data)
    router.push("/dashboard")
  }

  return (
    
      <><h1>Admin Game</h1>
      <div className="flex gap-10 justify-center items-start">

      <Tabs defaultValue="signin" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="signin">Connexion</TabsTrigger>
    <TabsTrigger value="signup">Inscription</TabsTrigger>
  </TabsList>
  <TabsContent value="signin"> 
      {/*Connexion */}
      <div className="gap-10 w-[400px]">
        <form onSubmit={handleSignIn}>
          <FieldGroup>
            <FieldDescription>
              Connextion d&apos;admin
            </FieldDescription>
            <Field>
              <FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>
              <Input
                className="input-admin"
                id="fieldgroup-email"
                type="email"
                placeholder="name@example.com"
                value={signInForm.email}
                onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="fieldgroup-name">Mots de pass</FieldLabel>
              <Input
                className="input-admin"
                id="fieldgroup-password"
                placeholder="votre mot de passe"
                type="password"
                value={signInForm.password} onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })} />
            </Field>

            <Field orientation="horizontal">
              <Button type="submit" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
      </TabsContent>
  <TabsContent value="signup">
  <div className="w-[400px]">
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <FieldDescription>
              Inscription d&apos;admin
            </FieldDescription>
            <Field>
              <FieldLabel htmlFor="fieldgroup-name">Name</FieldLabel>
              <Input className="input-admin"
                id="fieldgroup-name"
                placeholder="Jordan Lee"
                value={dataForm.name} onChange={(e) => setDataForm({ ...dataForm, name: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>
              <Input
                className="input-admin"
                id="fieldgroup-email"
                type="email"
                placeholder="name@example.com"
                value={dataForm.email}
                onChange={(e) => setDataForm({ ...dataForm, email: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="fieldgroup-name">Mots de pass</FieldLabel>
              <Input
                className="input-admin"
                id="fieldgroup-password"
                placeholder="votre mot de passe"
                type="password"
                value={dataForm.password} onChange={(e) => setDataForm({ ...dataForm, password: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="fieldgroup-name">Confirmez le mots de pass</FieldLabel>
              <Input
                className="input-admin"
                id="fieldgroup-password"
                placeholder="Confirmez votre mot de passe"
                type="password"
                value={dataForm.confirmPassword} onChange={(e) => setDataForm({ ...dataForm, confirmPassword: e.target.value })} />
            </Field>

            <Field orientation="horizontal">
              <Button type="reset" variant="outline">
                Reset
              </Button>

              <Button type="submit">Submit</Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
  </TabsContent>
 
</Tabs>

     
     
      
  

   

    </div></>
  );
}