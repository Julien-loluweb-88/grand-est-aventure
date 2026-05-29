"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MerchantPartnerClaimListItem } from "@/lib/merchant/list-partner-claims-for-merchant";
import {
  fetchMerchantPartnerClaims,
  resolveMerchantPartnerClaimAction,
} from "../_lib/merchant-partner-claims.action";

const STATUS_TABS = [
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Approuvées" },
  { value: "REJECTED", label: "Refusées" },
  { value: "EXPIRED", label: "Expirées" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["value"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function playerLabel(player: MerchantPartnerClaimListItem["player"]) {
  return player.name?.trim() || player.email;
}

function ClaimRow({
  claim,
  showActions,
  disabled,
  onApprove,
  onReject,
}: {
  claim: MerchantPartnerClaimListItem;
  showActions: boolean;
  disabled: boolean;
  onApprove: (claimId: string) => void;
  onReject: (claim: MerchantPartnerClaimListItem) => void;
}) {
  const adLabel =
    claim.advertisement.title?.trim() ||
    claim.advertisement.name ||
    claim.advertisement.advertiserName;

  return (
    <li className="flex flex-col gap-3 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-1 gap-3">
        {claim.advertisement.badgeImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={claim.advertisement.badgeImageUrl}
            alt=""
            className="size-12 shrink-0 rounded-md border border-border object-cover"
          />
        ) : null}
        <div className="min-w-0 space-y-1 text-sm">
          <p className="font-medium text-foreground">{adLabel}</p>
          {claim.advertisement.badgeTitle ? (
            <p className="text-xs text-muted-foreground">{claim.advertisement.badgeTitle}</p>
          ) : null}
          <p className="text-muted-foreground">
            Joueur : <span className="text-foreground">{playerLabel(claim.player)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Demandé le <time dateTime={claim.createdAt}>{formatDate(claim.createdAt)}</time>
            {claim.resolvedAt ? (
              <>
                {" "}
                · Traité le{" "}
                <time dateTime={claim.resolvedAt}>{formatDate(claim.resolvedAt)}</time>
              </>
            ) : null}
          </p>
          {claim.rejectionReason ? (
            <p className="text-xs text-muted-foreground">
              Motif : <span className="text-foreground">{claim.rejectionReason}</span>
            </p>
          ) : null}
        </div>
      </div>

      {showActions ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            onClick={() => onApprove(claim.id)}
          >
            {disabled ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Check className="size-4" aria-hidden />
            )}
            Approuver
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onReject(claim)}
          >
            <X className="size-4" aria-hidden />
            Refuser
          </Button>
        </div>
      ) : null}
    </li>
  );
}

export function MerchantPartnerClaimsPanel({
  initialClaims,
}: {
  initialClaims: MerchantPartnerClaimListItem[];
}) {
  const [status, setStatus] = useState<StatusTab>("PENDING");
  const [claimsByStatus, setClaimsByStatus] = useState<
    Partial<Record<StatusTab, MerchantPartnerClaimListItem[]>>
  >({ PENDING: initialClaims });
  const [loadedTabs, setLoadedTabs] = useState<Set<StatusTab>>(new Set(["PENDING"]));
  const [loadingTab, setLoadingTab] = useState<StatusTab | null>(null);
  const [pending, startTransition] = useTransition();
  const [rejectTarget, setRejectTarget] = useState<MerchantPartnerClaimListItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const claims = claimsByStatus[status] ?? [];

  const loadTab = (nextStatus: StatusTab) => {
    if (loadedTabs.has(nextStatus)) {
      return;
    }
    setLoadingTab(nextStatus);
    startTransition(async () => {
      const res = await fetchMerchantPartnerClaims(nextStatus);
      setLoadingTab(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setClaimsByStatus((prev) => ({ ...prev, [nextStatus]: res.claims }));
      setLoadedTabs((prev) => new Set(prev).add(nextStatus));
    });
  };

  const handleTabChange = (value: string) => {
    const nextStatus = value as StatusTab;
    setStatus(nextStatus);
    loadTab(nextStatus);
  };

  const refreshPending = () => {
    setLoadingTab("PENDING");
    startTransition(async () => {
      const res = await fetchMerchantPartnerClaims("PENDING");
      setLoadingTab(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setClaimsByStatus((prev) => ({ ...prev, PENDING: res.claims }));
      setLoadedTabs((prev) => new Set(prev).add("PENDING"));
    });
  };

  const handleApprove = (claimId: string) => {
    startTransition(async () => {
      const res = await resolveMerchantPartnerClaimAction({
        claimId,
        action: "approve",
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.awardedUserBadge
          ? "Demande approuvée — badge attribué au joueur."
          : "Demande approuvée."
      );
      setClaimsByStatus((prev) => ({
        ...prev,
        PENDING: (prev.PENDING ?? []).filter((c) => c.id !== claimId),
      }));
      setLoadedTabs((prev) => {
        const next = new Set(prev);
        next.delete("APPROVED");
        return next;
      });
    });
  };

  const handleRejectConfirm = () => {
    if (!rejectTarget) {
      return;
    }
    const claimId = rejectTarget.id;
    startTransition(async () => {
      const res = await resolveMerchantPartnerClaimAction({
        claimId,
        action: "reject",
        rejectionReason: rejectionReason.trim() || null,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Demande refusée.");
      setRejectTarget(null);
      setRejectionReason("");
      setClaimsByStatus((prev) => ({
        ...prev,
        PENDING: (prev.PENDING ?? []).filter((c) => c.id !== claimId),
      }));
      setLoadedTabs((prev) => {
        const next = new Set(prev);
        next.delete("REJECTED");
        return next;
      });
    });
  };

  return (
    <>
      <Tabs value={status} onValueChange={handleTabChange}>
        <TabsList variant="line" className="mb-4 w-full justify-start">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            {loadingTab === tab.value ? (
              <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Chargement…
              </p>
            ) : claims.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {tab.value === "PENDING"
                  ? "Aucune demande en attente."
                  : `Aucune demande ${tab.label.toLowerCase()}.`}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {claims.map((claim) => (
                  <ClaimRow
                    key={claim.id}
                    claim={claim}
                    showActions={tab.value === "PENDING"}
                    disabled={pending}
                    onApprove={handleApprove}
                    onReject={(c) => {
                      setRejectTarget(c);
                      setRejectionReason("");
                    }}
                  />
                ))}
              </ul>
            )}

            {tab.value === "PENDING" && loadedTabs.has("PENDING") ? (
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={refreshPending}
                >
                  Actualiser
                </Button>
              </div>
            ) : null}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog
        open={rejectTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
            <DialogDescription>
              {rejectTarget
                ? `Joueur : ${playerLabel(rejectTarget.player)} — ${rejectTarget.advertisement.advertiserName}`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Motif (optionnel)</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex. justificatif manquant, offre déjà utilisée…"
              rows={3}
              disabled={pending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setRejectTarget(null);
                setRejectionReason("");
              }}
            >
              Annuler
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleRejectConfirm}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
