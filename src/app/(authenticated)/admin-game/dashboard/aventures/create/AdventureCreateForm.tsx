"use client"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { createAdventure } from "../adventure.action"
export function CreateAdventureFormComponent(){
const [form, setForm] = useState({
  name: "",
  description: "",
  city: "",
  latitude: "",
  longitude: "",
  distance: "", 
});

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const response = createAdventure(form);

};

  return (
    <form onSubmit={handleSubmit}>
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="fieldgroup-name">Nom d&apos;aventure</FieldLabel>
        <Input
        id="fieldgroup-name"
        type="text"
        defaultValue={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value})}
        placeholder="Nouvelle aventure" />
      </Field>
      <Field>
        <FieldLabel htmlFor="fieldgroup-city">Ville</FieldLabel>
        <Input
         id="fieldgroup-city" 
         placeholder="À quelle ville?" 
         defaultValue={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value})}
        />
      </Field>
       <Field>
        <FieldLabel htmlFor="fieldgroup-latitude">Latitude</FieldLabel>
        <Input id="fieldgroup-latitude" placeholder="12.34567" 
        defaultValue={form.latitude}
        onChange={(e) => setForm({ ...form, latitude: e.target.value})}
        />
      </Field>
       <Field>
        <FieldLabel htmlFor="fieldgroup-longitude">Longitude</FieldLabel>
        <Input id="fieldgroup-longitude" placeholder="12.34567"
        defaultValue={form.longitude}
        onChange={(e) => setForm({ ...form, longitude: e.target.value})}
         />
      </Field>
      <Field>
        <FieldLabel htmlFor="fieldgroup-distance">Distance</FieldLabel>
        <Input id="fieldgroup-distance" placeholder="5km"
        defaultValue={form.distance}
        onChange={(e) => setForm({ ...form, distance: e.target.value})}
         />
      </Field>
      <Field>
        <FieldLabel htmlFor="fieldgroup-description">Description</FieldLabel>
         <Textarea
                  id="checkout-7j9-optional-description"
                  placeholder="Explication d'aventure"
                  className="resize-none"
                  defaultValue={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value})}
                />
      </Field>
      <Field orientation="horizontal">
        <Button type="reset" variant="outline">
          Annuler
        </Button>
        <Button type="submit">Créer</Button>
      </Field>
    </FieldGroup>
    </form>
  );
}
