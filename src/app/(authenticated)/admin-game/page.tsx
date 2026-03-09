import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function Home() {
  return (
    <div>
      <h1>Admin Game</h1>
      <div>
     <FieldGroup>
      <FieldDescription>
          Bonjour!
        </FieldDescription>
      <Field>
        <FieldLabel htmlFor="fieldgroup-name">Name</FieldLabel>
        <Input className="input-admin" id="fieldgroup-name" placeholder="Jordan Lee" />
      </Field>
      <Field>
        <FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>
        <Input
        className="input-admin"
          id="fieldgroup-email"
          type="email"
          placeholder="name@example.com"
        />
         <Field>
        <FieldLabel htmlFor="fieldgroup-name">Mots de pass</FieldLabel>
        <Input className="input-admin" id="fieldgroup-password" placeholder="votre mots de pass" />
      </Field>
      
      </Field>
      <Field orientation="horizontal">
        <Button type="reset" variant="outline">
          Reset
        </Button>
        <Button type="submit">Submit</Button>
      </Field>
    </FieldGroup>
</div>
    </div>
  );
}


