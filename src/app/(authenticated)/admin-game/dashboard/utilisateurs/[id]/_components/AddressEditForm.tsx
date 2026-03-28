"use client";

import { updateUser } from "../_lib/user.action";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import type { User } from "../../../../../../../../generated/prisma/browser";

export function AddressEditForm({ user }: { user: User }) {
  const caps = useAdminCapabilities();

  const [form, setForm] = useState({
    id: user.id,
    address: user.address ?? "",
    postalCode: user.postalCode ?? "",
    city: user.city ?? "",
    country: user.country ?? "",
    phone: user.phone ?? "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await updateUser({
        id: form.id,
        address: form.address,
        postalCode: form.postalCode,
        city: form.city,
        country: form.country,
        phone: form.phone,
      });
      toast.success("Coordonnées enregistrées.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Impossible d’enregistrer les coordonnées."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fieldgroup-adress">Adresse</FieldLabel>
          <Input
            className="w-100!"
            id="fieldgroup-address"
            type="text"
            placeholder="1 rue des champs"
            defaultValue={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <FieldLabel htmlFor="fieldgroup-postalCode">Code Postal</FieldLabel>
          <Input
            className="w-40!"
            id="fieldgroup-postalCode"
            type="text"
            placeholder="12345"
            defaultValue={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
          />
          <FieldLabel htmlFor="fieldgroup-city">Ville</FieldLabel>
          <Input
            className="w-50!"
            id="fieldgroup-city"
            type="text"
            placeholder="Paris"
            defaultValue={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <FieldLabel htmlFor="fieldgroup-country">Pays</FieldLabel>
          <Input
            className="w-50!"
            id="fieldgroup-country"
            type="text"
            placeholder="France"
            defaultValue={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <FieldLabel htmlFor="fieldgroup-phone">Numéro de téléphone</FieldLabel>
          <Input
            className="w-50!"
            id="fieldgroup-phone"
            type="text"
            placeholder="00 00 00 00 00 "
            defaultValue={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field orientation="horizontal">
          <GuardedButton
            type="submit"
            allowed={caps.user.update}
            denyReason="Vous ne pouvez pas modifier les coordonnées de cet utilisateur."
          >
            Modifier
          </GuardedButton>
        </Field>
      </FieldGroup>
    </form>
  );
}
