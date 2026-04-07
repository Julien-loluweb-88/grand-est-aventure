import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactForm } from "./contact.action";
import {
  LegalFooterNote,
  LegalList,
  LegalPageShell,
  legalLinkClass,
} from "../_components/legal-document-shell";

export default function ContactPage() {
  return (
    <LegalPageShell
      title="Contacte Nous"
      lead={<p>Remplie le formulaire et envoie-nous un message</p>}
    >
      <form action={contactForm}>
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
                  className="resize-none"
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button type="submit" className="bg-[#68a618] hover:bg-[#5a9014]">Envoyer</Button>
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </LegalPageShell>
  );
}
