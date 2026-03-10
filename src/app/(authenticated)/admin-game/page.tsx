"use client"
import { authClient } from "@/lib/auth-client"
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
import { error } from "console"

export default function Home() {
  const router = useRouter()

  const [dataForm, setDataForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [error, setEroor] = useState("")
  
  const [loading, setLoading] = useState(false)

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
  
  return (
    <div>
      <h1>Admin Game</h1>
      <div>
      <form onSubmit={handleSubmit}>
     <FieldGroup>
      <FieldDescription>
          Inscription d'admin
        </FieldDescription>
      <Field>
        <FieldLabel htmlFor="fieldgroup-name">Name</FieldLabel>
        <Input className="input-admin"
        id="fieldgroup-name" 
        placeholder="Jordan Lee" 
        value={dataForm.name} onChange={(e) => setDataForm({...dataForm, name: e.target.value})}   />
      </Field>
      <Field>
        <FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>
        <Input
        className="input-admin"
          id="fieldgroup-email"
          type="email"
          placeholder="name@example.com"
          value={dataForm.email}
          onChange={(e) => setDataForm({...dataForm, email: e.target.value})}
        />
        </Field>
        <Field>
        <FieldLabel htmlFor="fieldgroup-name">Mots de pass</FieldLabel>
        <Input 
        className="input-admin" 
          id="fieldgroup-password" 
          placeholder="votre mot de passe" 
          type="password"
          value={dataForm.password} onChange={(e) => setDataForm({...dataForm, password: e.target.value})} />
      </Field>
      <Field>
        <FieldLabel htmlFor="fieldgroup-name">Confirmez le mots de pass</FieldLabel>
        <Input 
        className="input-admin" 
          id="fieldgroup-password" 
          placeholder="Confirmez votre mot de passe"
          type="password"
          value={dataForm.confirmPassword} onChange={(e) => setDataForm({...dataForm, confirmPassword: e.target.value})} />
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
    </div>
  );
}


