"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogCloseRef,
} from "@/components/ui/dialog";
import {
  cancelMeetingAction,
  completeMeetingAction,
  deleteProspectAction,
  logCallAction,
  logClosedAction,
  logEmailReplyAction,
  logNotInterestedAction,
  logNoteAction,
  logQualifiedAction,
  reopenProspectAction,
  scheduleMeetingAction,
  sendFollowupAction,
  setProspectStatusAction,
  updateProspectContactNameAction,
} from "../_lib/prospect-actions";
import {
  COMMERCIAL_STATUS_LABELS,
  getProspectEventLabel,
} from "@/lib/prospect-events-constants";
import { ProspectEmailSequence } from "./ProspectEmailSequence";
import type { ProspectCommercialStatus } from "../../../../../../../generated/prisma/client";

type ProspectEmailSendLite = {
  id: string;
  sequenceStep: number | null;
  sentAt: Date | null;
  openedAt: Date | null;
  openCount: number;
  status: "PENDING" | "SENT" | "FAILED";
  error: string | null;
  subject: string;
};

type ProspectNoteLite = {
  id: string;
  details: string | null;
  createdAt: Date;
  authorName: string | null;
};

type ProspectEventLite = {
  id: string;
  type: string;
  details: string | null;
  createdAt: Date;
};

type ProspectMeetingLite = {
  id: string;
  scheduledAt: Date;
};

export function ProspectActionsDialog(props: {
  prospect: {
    id: string;
    email: string;
    status: "ACTIVE" | "UNSUBSCRIBED";
    commercialStatus: ProspectCommercialStatus;
    commune: string | null;
    intercommunalite: string | null;
    telephone: string | null;
    adresse: string | null;
    siteInternet: string | null;
    contactName: string;
    ownerName: string | null;
    ownerEmail: string | null;
    followUpStep: number;
    nextFollowUpAt: Date | null;
    sequenceCompletedAt: Date | null;
    emailBouncedAt: Date | null;
    events: ProspectEventLite[];
    meetings: ProspectMeetingLite[];
    notes: ProspectNoteLite[];
    emailSends: ProspectEmailSendLite[];
  };
  followupBlocked: boolean;
  followupBlockReason: string | null;
}) {
  const dialogRef = useRef<DialogCloseRef>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const lastEvent = props.prospect.events[0] ?? null;
  const scheduledMeeting = props.prospect.meetings[0] ?? null;
  const commercialStatus = COMMERCIAL_STATUS_LABELS[props.prospect.commercialStatus];
  const canReopen =
    !props.prospect.sequenceCompletedAt &&
    (props.prospect.commercialStatus !== "OPEN" || props.prospect.emailBouncedAt != null);
  const deleteConfirmed =
    deleteConfirmEmail.trim().toLowerCase() === props.prospect.email.trim().toLowerCase();

  return (
    <Dialog ref={dialogRef}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" type="button">
          Gérer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-base">{props.prospect.email}</DialogTitle>
          <DialogDescription>
            Statut : {props.prospect.status === "ACTIVE" ? "Actif" : "Désinscrit"} — Commercial :{" "}
            {commercialStatus.label}
            {props.prospect.ownerName || props.prospect.ownerEmail ? (
              <>
                {" "}
                — Responsable :{" "}
                <strong>
                  {props.prospect.ownerName?.trim() || props.prospect.ownerEmail}
                </strong>
              </>
            ) : null}
            {lastEvent ? (
              <>
                {" "}
                — Dernier évènement :{" "}
                <strong>{getProspectEventLabel(lastEvent.type)}</strong>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {canReopen ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
              <p className="text-sm">
                {props.prospect.emailBouncedAt ? (
                  <>
                    Email en <strong>échec</strong> — réouvrir pour relancer les envois ?
                  </>
                ) : (
                  <>
                    Statut <strong>{commercialStatus.label}</strong> enregistré par erreur ?
                  </>
                )}
              </p>
              <form action={reopenProspectAction}>
                <input type="hidden" name="prospectId" value={props.prospect.id} />
                <Button size="sm" variant="default" type="submit">
                  Annuler et réouvrir
                </Button>
              </form>
            </div>
          ) : null}

          {(props.prospect.telephone ||
            props.prospect.adresse ||
            props.prospect.siteInternet ||
            props.prospect.intercommunalite) && (
            <div className="rounded-md border p-4">
              <p className="text-sm font-medium">Coordonnées</p>
              <dl className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                {props.prospect.intercommunalite ? (
                  <div>
                    <dt className="text-muted-foreground">Intercommunalité</dt>
                    <dd>{props.prospect.intercommunalite}</dd>
                  </div>
                ) : null}
                {props.prospect.telephone ? (
                  <div>
                    <dt className="text-muted-foreground">Téléphone</dt>
                    <dd>
                      <a href={`tel:${props.prospect.telephone}`} className="hover:underline">
                        {props.prospect.telephone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {props.prospect.adresse ? (
                  <div className="md:col-span-2">
                    <dt className="text-muted-foreground">Adresse</dt>
                    <dd>{props.prospect.adresse}</dd>
                  </div>
                ) : null}
                {props.prospect.siteInternet ? (
                  <div className="md:col-span-2">
                    <dt className="text-muted-foreground">Site internet</dt>
                    <dd>
                      <a
                        href={props.prospect.siteInternet}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {props.prospect.siteInternet}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          )}

          <div className="rounded-md border p-4">
            <p className="text-sm font-medium">Formule de salutation (emails)</p>
            <form action={updateProspectContactNameAction} className="mt-2 flex flex-wrap items-end gap-2">
              <input type="hidden" name="prospectId" value={props.prospect.id} />
              <div className="min-w-[16rem] flex-1">
                <Input
                  name="contactName"
                  type="text"
                  defaultValue={props.prospect.contactName}
                  placeholder="Madame / Monsieur le Maire"
                  className="h-9 text-sm"
                />
              </div>
              <Button size="sm" type="submit" variant="secondary">
                Enregistrer
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              Utilisé dans « Bonjour … » des mails de prospection.
            </p>
          </div>

          {props.prospect.emailBouncedAt ? (
            <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-900">
              Email en échec (bounce) — les relances automatiques sont bloquées.
            </div>
          ) : null}

          {props.followupBlockReason && props.followupBlocked ? (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-950">
              {props.followupBlockReason}
            </div>
          ) : null}

          <ProspectEmailSequence
            followUpStep={props.prospect.followUpStep}
            nextFollowUpAt={props.prospect.nextFollowUpAt}
            sequenceCompletedAt={props.prospect.sequenceCompletedAt}
            emailSends={props.prospect.emailSends}
          />

          <div className="flex flex-wrap gap-2">
            <form action={sendFollowupAction}>
              <input type="hidden" name="prospectId" value={props.prospect.id} />
              <Button
                size="sm"
                type="submit"
                disabled={props.followupBlocked}
                title={props.followupBlockReason ?? undefined}
              >
                Relancer
              </Button>
            </form>
            <form action={setProspectStatusAction}>
              <input type="hidden" name="prospectId" value={props.prospect.id} />
              <input
                type="hidden"
                name="status"
                value={props.prospect.status === "ACTIVE" ? "UNSUBSCRIBED" : "ACTIVE"}
              />
              <Button size="sm" variant="outline" type="submit">
                {props.prospect.status === "ACTIVE" ? "Désinscrire" : "Réactiver"}
              </Button>
            </form>
          </div>

          <div className="rounded-md border p-4">
            <p className="text-sm font-medium">Actions rapides</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={logCallAction}>
                <input type="hidden" name="prospectId" value={props.prospect.id} />
                <Button size="sm" variant="outline" type="submit">
                  Appel
                </Button>
              </form>
              <form action={logEmailReplyAction}>
                <input type="hidden" name="prospectId" value={props.prospect.id} />
                <Button
                  size="sm"
                  variant={props.prospect.commercialStatus === "EMAIL_REPLIED" ? "default" : "outline"}
                  type="submit"
                  disabled={canReopen}
                >
                  Réponse mail
                </Button>
              </form>
              <form action={logQualifiedAction}>
                <input type="hidden" name="prospectId" value={props.prospect.id} />
                <Button
                  size="sm"
                  variant={props.prospect.commercialStatus === "QUALIFIED" ? "default" : "outline"}
                  type="submit"
                  disabled={canReopen}
                >
                  Qualifié
                </Button>
              </form>
              <form action={logNotInterestedAction}>
                <input type="hidden" name="prospectId" value={props.prospect.id} />
                <Button
                  size="sm"
                  variant={props.prospect.commercialStatus === "NOT_INTERESTED" ? "default" : "outline"}
                  type="submit"
                  disabled={canReopen}
                >
                  Pas intéressé
                </Button>
              </form>
              <form action={logClosedAction}>
                <input type="hidden" name="prospectId" value={props.prospect.id} />
                <Button
                  size="sm"
                  variant={props.prospect.commercialStatus === "CLOSED" ? "default" : "outline"}
                  type="submit"
                  disabled={canReopen}
                >
                  Clôturer
                </Button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-md border p-4">
              <p className="text-sm font-medium">
                Notes enregistrées
                {props.prospect.notes.length > 0 ? ` (${props.prospect.notes.length})` : ""}
              </p>
              {props.prospect.notes.length > 0 ? (
                <ul className="mt-3 max-h-56 space-y-3 overflow-y-auto">
                  {props.prospect.notes.map((note) => (
                    <li key={note.id} className="rounded-md bg-violet-500/5 p-3 ring-1 ring-violet-500/20">
                      <p className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(note.createdAt))}
                        {note.authorName ? ` — ${note.authorName}` : ""}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{note.details}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Aucune note pour l&apos;instant.</p>
              )}
              <form action={logNoteAction} className="mt-4 space-y-2 border-t pt-4">
                <p className="text-sm font-medium">Ajouter une note</p>
                <input type="hidden" name="prospectId" value={props.prospect.id} />
                <textarea
                  name="details"
                  rows={4}
                  placeholder="Ajouter une note…"
                  required
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button size="sm" type="submit" variant="secondary">
                  Enregistrer la note
                </Button>
              </form>
            </div>

            <div className="rounded-md border p-4">
              <p className="text-sm font-medium">Rendez-vous</p>
              {scheduledMeeting ? (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    RDV prévu le{" "}
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(
                      new Date(scheduledMeeting.scheduledAt)
                    )}
                  </p>
                  <form action={completeMeetingAction} className="space-y-2">
                    <input type="hidden" name="prospectId" value={props.prospect.id} />
                    <input type="hidden" name="meetingId" value={scheduledMeeting.id} />
                    <select
                      name="outcome"
                      defaultValue="UNKNOWN"
                      className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    >
                      <option value="UNKNOWN">Résultat à définir</option>
                      <option value="INTERESTED">Intéressé</option>
                      <option value="NOT_INTERESTED">Pas intéressé</option>
                    </select>
                    <textarea
                      name="notes"
                      rows={3}
                      placeholder="Compte-rendu du RDV…"
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    />
                    <Button size="sm" type="submit">
                      RDV terminé
                    </Button>
                  </form>
                  <form action={cancelMeetingAction}>
                    <input type="hidden" name="prospectId" value={props.prospect.id} />
                    <input type="hidden" name="meetingId" value={scheduledMeeting.id} />
                    <Button size="sm" variant="outline" type="submit">
                      Annuler le RDV
                    </Button>
                  </form>
                </div>
              ) : (
                <form action={scheduleMeetingAction} className="mt-2 space-y-2">
                  <input type="hidden" name="prospectId" value={props.prospect.id} />
                  <Input name="scheduledAt" type="datetime-local" required className="h-9 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      name="durationMinutes"
                      type="number"
                      min={0}
                      defaultValue={30}
                      className="h-9 text-sm"
                      placeholder="Durée (min)"
                    />
                    <select
                      name="mode"
                      defaultValue="TELEPHONE"
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                    >
                      <option value="TELEPHONE">Téléphone</option>
                      <option value="VISIO">Visio</option>
                      <option value="PRESENTIEL">Présentiel</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>
                  <Input name="location" type="text" placeholder="Lieu" className="h-9 text-sm" />
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Notes…"
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  />
                  <Button size="sm" type="submit">
                    Enregistrer le RDV
                  </Button>
                </form>
              )}
            </div>
          </div>

          <div className="rounded-md border p-4">
            <p className="text-sm font-medium">Historique</p>
            {props.prospect.events.length > 0 ? (
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {props.prospect.events.map((event) => (
                  <li key={event.id}>
                    <span className="font-medium text-foreground">
                      {getProspectEventLabel(event.type)}
                    </span>{" "}
                    —{" "}
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(
                      new Date(event.createdAt)
                    )}
                    {event.type !== "NOTE" && event.details ? ` — ${event.details}` : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Aucun évènement.</p>
            )}
          </div>

          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">Suppression définitive</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Supprime le prospect, son historique, ses notes et ses rendez-vous. Cette action est
              irréversible. L&apos;email pourra être réimporté ensuite.
            </p>
            <form action={deleteProspectAction} className="mt-3 space-y-2">
              <input type="hidden" name="prospectId" value={props.prospect.id} />
              <Input
                name="confirmEmail"
                type="email"
                value={deleteConfirmEmail}
                onChange={(event) => setDeleteConfirmEmail(event.target.value)}
                placeholder={`Saisir « ${props.prospect.email} » pour confirmer`}
                className="h-9 text-sm"
                autoComplete="off"
              />
              <Button
                size="sm"
                type="submit"
                variant="destructive"
                disabled={!deleteConfirmed}
              >
                Supprimer le prospect
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
