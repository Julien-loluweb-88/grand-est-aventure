"use client";

import { useTransition, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../../AdminCapabilitiesProvider";
import type { MyBadgeRestockRequestRow } from "../_lib/badge-restock-request-queries";
import { submitBadgeRestockRequest } from "../_lib/badge-restock-request.action";

function statusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "CLOSED":
      return "Traitée";
    default:
      return status;
  }
}

export function AdventureAdminBadgeRestockRequestForm({
  adventureId,
  initialMyRequests,
}: {
  adventureId: string;
  initialMyRequests: MyBadgeRestockRequestRow[];
}) {
  const router = useRouter();
  const caps = useAdminCapabilities();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await submitBadgeRestockRequest(
        adventureId,
        message,
        quantity.trim() === "" ? undefined : quantity
      );
      if (r.success) {
        toast.success("Demande envoyée aux super administrateurs.");
        setMessage("");
        setQuantity("");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demande de réassort (badges physiques)</CardTitle>
        <CardDescription>
          La gestion du stock est réservée aux super administrateurs. Vous pouvez
          envoyer une demande de réapprovisionnement ; elle sera notifiée par e-mail.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="restock-msg">Message (obligatoire)</FieldLabel>
            <Textarea
              id="restock-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Contexte, urgence, lieu de livraison souhaité…"
              disabled={pending}
              required
              minLength={10}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="restock-qty">
              Quantité souhaitée (optionnel, indicative)
            </FieldLabel>
            <Input
              id="restock-qty"
              type="number"
              min={1}
              max={100_000}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="ex. 50"
              disabled={pending}
            />
          </Field>
          <GuardedButton
            type="submit"
            allowed={caps.adventure.update}
            disabled={pending}
          >
            {pending ? "Envoi…" : "Envoyer la demande"}
          </GuardedButton>
        </form>

        {initialMyRequests.length > 0 ? (
          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-medium">Vos demandes récentes</p>
            <ul className="space-y-3 text-sm">
              {initialMyRequests.map((row) => (
                <li
                  key={row.id}
                  className="rounded-md border bg-muted/30 p-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span
                      className={
                        row.status === "PENDING"
                          ? "font-medium text-amber-700 dark:text-amber-400"
                          : "text-muted-foreground"
                      }
                    >
                      {statusLabel(row.status)}
                    </span>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={row.createdAt}
                    >
                      {new Date(row.createdAt).toLocaleString("fr-FR")}
                    </time>
                  </div>
                  {row.quantityRequested != null ? (
                    <p className="mt-1 text-muted-foreground">
                      Quantité : {row.quantityRequested}
                    </p>
                  ) : null}
                  <p className="mt-2 whitespace-pre-wrap">{row.message}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
