"use client"
import { updateUser } from "./user.action"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { User } from "../../../../../../../generated/prisma/browser"
  
export function AddressEditForm({ user }: { user: User }) {

  const [form, setForm] = useState({
    id: user.id,
    //name: user.name ?? "",
    address: user.address ?? "",
    postalCode: user.postalCode ?? "",
    city: user.city ?? "",
    country: user.country ?? "",
    phone: user.phone ?? ""
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      // Appel de la server action avec les données du formulaire
      await updateUser({
        id: form.id,
        //name: form.name,
        address: form.address,
        postalCode: form.postalCode,
        city: form.city,
        country: form.country,
        phone: form.phone,
      })
      // Ici tu peux ajouter une notif / un refresh / un redirect
      // ex: toast("Adresse mise à jour")
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur :", error)
      // gérer l'erreur (toast, message, etc.)
    }
  }
  

  return (
    <form onSubmit={handleSubmit}>
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="fieldgroup-adress">Adresse</FieldLabel>
        <Input className="!w-100"
          id="fieldgroup-address"
          type="text"
          placeholder="1 rue des champs"
          defaultValue={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      <FieldLabel htmlFor="fieldgroup-postalCode">Code Postal</FieldLabel>
        <Input className="!w-40"
          id="fieldgroup-postalCode"
          type="text"
          placeholder="12345"
          defaultValue={form.postalCode} 
          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}

        />
        <FieldLabel htmlFor="fieldgroup-city">Ville</FieldLabel>
        <Input className="!w-50"
          id="fieldgroup-city"
          type="text"
          placeholder="Paris"
          defaultValue={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}

        />
        <FieldLabel htmlFor="fieldgroup-country">Pays</FieldLabel>
        <Input className="!w-50"
          id="fieldgroup-country"
          type="text"
          placeholder="France"
          defaultValue={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}

        />
        <FieldLabel htmlFor="fieldgroup-phone">Numéro de téléphone</FieldLabel>
        <Input className="!w-50"
          id="fieldgroup-phone"
          type="text"
          placeholder="00 00 00 00 00 "
          defaultValue={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}

        />
      </Field>
      <Field orientation="horizontal">
        <Button type="submit" >Modifier</Button>
      </Field>
    </FieldGroup>
    </form>
  )
}
