import "server-only";

/** Adresse affichée et utilisée en « Répondre à » dans les e-mails de prospection. */
export function getProspectContactEmail(fallback?: string | null): string {
  const configured = process.env.CONTACT_MAIL_TO?.trim();
  if (configured) return configured;
  const owner = fallback?.trim();
  if (owner) return owner;
  return process.env.NODEMAILER_USER?.trim() ?? "";
}

export function getProspectContactMailtoUrl(email?: string): string {
  const address = email ?? getProspectContactEmail();
  return address ? `mailto:${address}` : "";
}
