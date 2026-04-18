"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { FieldCharacterCount } from "@/components/ui/field-character-count";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_EMAIL_MAX_CHARS,
  CONTACT_MESSAGE_MAX_CHARS,
  CONTACT_NAME_MAX_CHARS,
} from "@/lib/contact-text-limits";
import { LegalPageShell } from "../_components/legal-document-shell";
import { contactForm } from "./contact.action";

export default function ContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [nameLen, setNameLen] = useState(0);
  const [emailLen, setEmailLen] = useState(0);
  const [messageLen, setMessageLen] = useState(0);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    const res = await contactForm(formData);
    setLoading(false);

    if (res.success) {
      toast.success("Message envoyé");
      formRef.current?.reset();
      setNameLen(0);
      setEmailLen(0);
      setMessageLen(0);
      setTimeout(() => router.push("/contact"), 3000);
    }
    if (res.error) {
      toast.error(res.error);
    }
  };

  return (
    <LegalPageShell
      title="Contacte Nous"
      lead={<p>Remplie le formulaire et envoie-nous un message</p>}
    >
      <form
        ref={formRef}
        action={handleSubmit}
        onReset={() => {
          setNameLen(0);
          setEmailLen(0);
          setMessageLen(0);
        }}
      >
        <FieldGroup>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel className="text-lg text-[#68a618]" htmlFor="name">
                  Ton nom
                </FieldLabel>
                <Input
                  id="name"
                  name="name"
                  placeholder="Balad'indice"
                  required
                  minLength={2}
                  maxLength={CONTACT_NAME_MAX_CHARS}
                  disabled={loading}
                  onChange={(e) => setNameLen(e.target.value.length)}
                />
                <div className="flex justify-end pt-0.5">
                  <FieldCharacterCount length={nameLen} max={CONTACT_NAME_MAX_CHARS} />
                </div>
              </Field>
              <Field>
                <FieldLabel className="text-lg text-[#68a618]" htmlFor="email">
                  Adresse e-mail
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="balad-indice@balade.com"
                  required
                  maxLength={CONTACT_EMAIL_MAX_CHARS}
                  disabled={loading}
                  autoComplete="email"
                  onChange={(e) => setEmailLen(e.target.value.length)}
                />
                <div className="flex justify-end pt-0.5">
                  <FieldCharacterCount length={emailLen} max={CONTACT_EMAIL_MAX_CHARS} />
                </div>
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel className="text-lg text-[#68a618]" htmlFor="message">
                  Message
                </FieldLabel>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Écrire un message"
                  className="h-32 resize-none"
                  required
                  minLength={10}
                  maxLength={CONTACT_MESSAGE_MAX_CHARS}
                  disabled={loading}
                  onChange={(e) => setMessageLen(e.target.value.length)}
                />
                <div className="flex justify-end pt-0.5">
                  <FieldCharacterCount length={messageLen} max={CONTACT_MESSAGE_MAX_CHARS} />
                </div>
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal" className="flex justify-end gap-2">
            <Button
              type="submit"
              className="bg-[#68a618] p-2 font-bold hover:bg-[#5a9014]"
              disabled={loading}
            >
              {loading ? "Envoi…" : "Envoyer"}
            </Button>
            <Button variant="outline" type="reset" className="font-bold" disabled={loading}>
              Annuler
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </LegalPageShell>
  );
}
