/** Limite Discord pour la valeur d’un champ d’embed. */
const DISCORD_FIELD_VALUE_MAX = 1024;

function discordFieldValue(value: string): string {
  const trimmed = value.trim();
  const base = trimmed.length > 0 ? trimmed : "—";
  if (base.length <= DISCORD_FIELD_VALUE_MAX) return base;
  return `${base.slice(0, DISCORD_FIELD_VALUE_MAX - 1)}…`;
}

/** Canal d’envoi (fixé côté serveur, jamais depuis le client). */
export type ContactSource = "web" | "mobile";

const CONTACT_SOURCE_LABEL: Record<ContactSource, string> = {
  web: "Site web",
  mobile: "Application mobile",
};

export type ContactDiscordPayload = {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source: ContactSource;
};

/**
 * Notification Discord (formulaire contact). URL webhook côté serveur uniquement
 * (`DISCORD_CONTACT_WEBHOOK_URL`).
 */
export async function sendContactDiscordWebhook(
  data: ContactDiscordPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const webhookUrl = process.env.DISCORD_CONTACT_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return { ok: false, error: "Service de notification indisponible." };
  }

  const payload = {
    embeds: [
      {
        title: "Nouveau contact client",
        color: 5814783,
        fields: [
          {
            name: "Origine",
            value: CONTACT_SOURCE_LABEL[data.source],
            inline: true,
          },
          {
            name: "Nom / Entreprise",
            value: discordFieldValue(data.name),
            inline: true,
          },
          {
            name: "Adresse Email",
            value: discordFieldValue(data.email),
            inline: true,
          },
          ...(data.phone
            ? [
                {
                  name: "Téléphone",
                  value: discordFieldValue(data.phone),
                  inline: true,
                },
              ]
            : []),
          {
            name: "Message",
            value: discordFieldValue(data.message),
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return { ok: false, error: "Erreur lors de l'envoi du message." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Erreur lors de l'envoi du message." };
  }
}
