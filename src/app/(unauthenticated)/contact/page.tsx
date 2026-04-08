"use client"
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactForm } from "./contact.action";
import {
  LegalPageShell,
} from "../_components/legal-document-shell";
import {useRef, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function ContactPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success?: boolean; error?: string }>({})
    const formRef = useRef<HTMLFormElement>(null)

    const handleSubmit = async (FormData: FormData) => {
        setLoading(true)
        const res = await contactForm(FormData)
        setLoading(false)
        setResult(res)

         if (res.success){
            toast.success("Message envoyé")
            formRef.current?.reset()
            setTimeout(() => router.push('/contact'), 3000)
        }
        if (res.error){
            toast.error(res.error)
        }
        }


  return (
    <LegalPageShell
      title="Contacte Nous"
      lead={<p>Remplie le formulaire et envoie-nous un message</p>}
    >
      <form ref={formRef} action={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel className="text-lg text-[#68a618]">Ton nom</FieldLabel>
                <Input id="name" placeholder="Balad'indice" required />
              </Field>
              <Field>
                <FieldLabel className="text-lg text-[#68a618]">Adresse e-mail</FieldLabel>
                <Input
                  id="email"
                  placeholder="balad-indice@balade.com"
                  required
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel className="text-lg text-[#68a618]">Message</FieldLabel>
                <Textarea
                  id="message"
                  placeholder="Écrire un message"
                  className="resize-none h-32"
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal" className="flex justify-end gap-2">
            <Button type="submit" className="bg-[#68a618] hover:bg-[#5a9014] font-bold p-2">Envoyer</Button>
            <Button variant="outline" type="reset" className="font-bold">
              Annuler
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </LegalPageShell>
  );
}
