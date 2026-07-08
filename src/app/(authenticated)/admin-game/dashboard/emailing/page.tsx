"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { listUsersForAdmin, type ListUsersAdminRow } from "../utilisateurs/_lib/list-users.action";
import { seedProspectsFromText, sendEmailCampaign } from "./emailing.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const PAGE_SIZE = 20;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailingPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<ListUsersAdminRow[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Map<string, string>>(new Map()); // id -> email
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [manualEmails, setManualEmails] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [seedIntercommunalite, setSeedIntercommunalite] = useState("");
  const [seedFollowUpDays, setSeedFollowUpDays] = useState("7");

  useEffect(() => {
    setLoadingUsers(true);
    listUsersForAdmin({ page, pageSize: PAGE_SIZE, search })
      .then((res) => {
        if (res.ok) {
          setUsers(res.users);
          setTotal(res.total);
        } else {
          toast.error(res.error);
        }
      })
      .finally(() => setLoadingUsers(false));
  }, [page, search]);

  function toggleUser(u: ListUsersAdminRow) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(u.id)) {
        next.delete(u.id);
      } else {
        next.set(u.id, u.email);
      }
      return next;
    });
  }

  function selectAllOnPage() {
    setSelected((prev) => {
      const next = new Map(prev);
      users.forEach((u) => next.set(u.id, u.email));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Map());
  }

  function addManualEmails() {
    const raw = manualInput
      .split(/[,\n;]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    const valid = raw.filter((e) => EMAIL_REGEX.test(e));
    const invalid = raw.filter((e) => !EMAIL_REGEX.test(e));

    if (invalid.length > 0) {
      toast.error(`Adresse(s) invalide(s) ignorée(s) : ${invalid.join(", ")}`);
    }
    if (valid.length > 0) {
      setManualEmails((prev) => Array.from(new Set([...prev, ...valid])));
      setManualInput("");
    }
  }

  function removeManualEmail(email: string) {
    setManualEmails((prev) => prev.filter((e) => e !== email));
  }

  function handleSeedProspects() {
    if (!manualInput.trim()) {
      toast.error("Ajoutez des e-mails dans le champ de prospection.");
      return;
    }
    startTransition(async () => {
      const result = await seedProspectsFromText({
        raw: manualInput,
        intercommunalite: seedIntercommunalite,
        nextFollowUpDays: Number.parseInt(seedFollowUpDays, 10),
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleSend() {
    const totalRecipients = selected.size + manualEmails.length;

    if (totalRecipients === 0) {
      toast.error("Sélectionnez au moins un destinataire.");
      return;
    }
    if (!subject.trim() || !text.trim()) {
      toast.error("Objet et message requis.");
      return;
    }
    const confirmed = window.confirm(
      `Envoyer cet e-mail à ${totalRecipients} destinataire(s) ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const html = text
        .split("\n")
        .map((line) => `<p>${line}</p>`)
        .join("");

      const recipientEmails = Array.from(
        new Set([...selected.values(), ...manualEmails])
      );

      const result = await sendEmailCampaign({
        subject,
        text,
        html,
        recipientEmails,
      });

      if (result.success) {
        toast.success(result.message);
        setSubject("");
        setText("");
        clearSelection();
        setManualEmails([]);
      } else {
        toast.error(result.message);
      }
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalRecipients = selected.size + manualEmails.length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Emailing</h1>
        <p className="text-sm text-muted-foreground">
          Sélectionnez des destinataires et envoyez-leur un e-mail groupé.
        </p>
        <Button asChild variant="link" className="px-0">
          <Link href="/admin-game/dashboard/prospects">Voir les prospects</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Colonne gauche : destinataires */}
        <div className="flex flex-col gap-6">
          {/* Utilisateurs existants */}
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">
                Utilisateurs ({selected.size} sélectionné(s))
              </h2>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllOnPage}>
                  Sélectionner la page
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                  Vider
                </Button>
              </div>
            </div>

            <Input
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
              ) : (
                users.map((u) => (
                  <label
                    key={u.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <Checkbox
                      checked={selected.has(u.id)}
                      onCheckedChange={() => toggleUser(u)}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm">{u.name ?? "Sans nom"}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Précédent
              </Button>
              <span>
                Page {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>

          {/* Adresses manuelles (commercial / prospection) */}
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <h2 className="font-medium">
              Adresses manuelles ({manualEmails.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Pour du commercial : colle une ou plusieurs adresses (séparées par
              virgule, point-virgule ou saut de ligne).
            </p>
            <Textarea
              placeholder="contact@entreprise1.fr, contact@entreprise2.fr..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              rows={3}
            />
            <Button type="button" variant="outline" size="sm" onClick={addManualEmails}>
              Ajouter à la liste
            </Button>

            <div className="mt-2 rounded-md border border-dashed p-3">
              <p className="mb-2 text-sm font-medium">Seeder les prospects</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Input
                  placeholder="Intercommunalité (optionnel)"
                  value={seedIntercommunalite}
                  onChange={(e) => setSeedIntercommunalite(e.target.value)}
                />
                <Input
                  placeholder="Relance dans X jours"
                  value={seedFollowUpDays}
                  onChange={(e) => setSeedFollowUpDays(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={handleSeedProspects}
                disabled={isPending}
              >
                Enregistrer comme prospects
              </Button>
            </div>

            {manualEmails.length > 0 && (
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {manualEmails.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeManualEmail(email)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Composition du mail */}
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="font-medium">Message</h2>
          <Input
            placeholder="Objet"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Textarea
            placeholder="Votre message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
          />
          <Button type="button" onClick={handleSend} disabled={isPending}>
            {isPending
              ? "Envoi en cours..."
              : `Envoyer à ${totalRecipients} destinataire(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
}