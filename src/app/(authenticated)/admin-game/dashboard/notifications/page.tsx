"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { sendPushCampaign } from "@/lib/admin/send-push-campaign";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !isSending;

  async function handleSubmit() {
    setIsSending(true);
    try {
      const result = await sendPushCampaign({ title: title.trim(), body: body.trim() });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(`Notification envoyée à ${result.sent} appareil(s).`);
      setTitle("");
      setBody("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'envoi.";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-medium">Envoyer une notification</h1>
        <p className="text-sm text-muted-foreground">
          Envoie un message personnalisé à tous les joueurs ayant activé les notifications.
        </p>
      </div>

      <div className="max-w-md space-y-4 rounded-lg border p-4">
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium">
            Titre
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nouvelle aventure spéciale !"
            maxLength={80}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="body" className="text-sm font-medium">
            Message
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Viens découvrir notre nouvel événement ce week-end..."
            maxLength={200}
            rows={4}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
          {isSending ? "Envoi en cours..." : "Envoyer la notification"}
        </Button>
      </div>
    </div>
  );
}