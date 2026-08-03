import type { AdventureExportPayload } from "./adventure-export.types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function multiline(value: string | null | undefined): string {
  if (!value?.trim()) return "<p class=\"muted\">—</p>";
  return escapeHtml(value)
    .split(/\n+/)
    .map((line) => `<p>${line}</p>`)
    .join("");
}

function formatDateFr(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function audienceLabel(audience: string): string {
  switch (audience) {
    case "PUBLIC":
      return "Public";
    case "DEMO":
      return "Démo";
    case "DEVELOPMENT":
      return "Développement";
    default:
      return audience;
  }
}

function section(title: string, body: string): string {
  return `
    <section class="section">
      <h2>${escapeHtml(title)}</h2>
      ${body}
    </section>
  `;
}

export function buildAdventureExportHtml(payload: AdventureExportPayload): string {
  const a = payload.adventure;
  const title = `Fiche aventure — ${a.name}`;

  const generalBody = `
    <dl class="meta">
      <div><dt>Ville</dt><dd>${escapeHtml(a.cityName)}</dd></div>
      <div><dt>Statut</dt><dd>${a.status ? "Active" : "Inactive"}</dd></div>
      <div><dt>Audience</dt><dd>${escapeHtml(audienceLabel(a.audience))}</dd></div>
      <div><dt>Distance</dt><dd>${
        a.distanceKm != null ? `${a.distanceKm.toFixed(1)} km` : "—"
      }</dd></div>
      <div><dt>Durée estimée</dt><dd>${escapeHtml(a.estimatedDurationLabel)}</dd></div>
      <div><dt>Durée moyenne</dt><dd>${escapeHtml(a.averageDurationLabel)}</dd></div>
      <div><dt>Énigmes</dt><dd>${a.enigmaCount}</dd></div>
      <div><dt>Trésor</dt><dd>${a.hasTreasure ? "Oui" : "Non"}</dd></div>
      <div><dt>Départ</dt><dd>${a.latitude.toFixed(5)}, ${a.longitude.toFixed(5)}</dd></div>
    </dl>
    <h3>Description</h3>
    ${multiline(a.description)}
  `;

  const parts: string[] = [section("Informations générales", generalBody)];

  if (payload.enigmas) {
    const body =
      payload.enigmas.length === 0
        ? `<p class="muted">Aucune énigme.</p>`
        : payload.enigmas
            .map(
              (e) => `
          <article class="card">
            <h3>Énigme ${e.number} — ${escapeHtml(e.name)}</h3>
            <p><strong>Question :</strong> ${escapeHtml(e.question)}</p>
            ${e.description.trim() ? `<div class="block"><strong>Contexte</strong>${multiline(e.description)}</div>` : ""}
            <p><strong>Réponse :</strong> ${escapeHtml(e.answer)}</p>
            <p class="coords">${e.latitude.toFixed(5)}, ${e.longitude.toFixed(5)}</p>
          </article>
        `
            )
            .join("");
    parts.push(section("Énigmes", body));
  }

  if (payload.treasure !== undefined) {
    const t = payload.treasure;
    const body = !t
      ? `<p class="muted">Pas de trésor configuré.</p>`
      : `
        <article class="card">
          <h3>${escapeHtml(t.name)}</h3>
          <div class="block"><strong>Description</strong>${multiline(t.description)}</div>
          <div class="block"><strong>Message de fin</strong>${multiline(t.finishMessage)}</div>
          <p><strong>Code coffre :</strong> ${escapeHtml(t.chestCode)}</p>
          ${
            t.chestCodeAlt
              ? `<p><strong>Code alternatif :</strong> ${escapeHtml(t.chestCodeAlt)}</p>`
              : ""
          }
          <p class="coords">${t.latitude.toFixed(5)}, ${t.longitude.toFixed(5)}</p>
        </article>
      `;
    parts.push(section("Trésor", body));
  }

  if (payload.reviews) {
    const body =
      payload.reviews.length === 0
        ? `<p class="muted">Aucun avis validé.</p>`
        : payload.reviews
            .map(
              (r) => `
          <article class="card">
            <p><strong>${escapeHtml(r.authorName)}</strong>
              ${r.rating != null ? ` — ${r.rating}/5` : ""}
              <span class="muted"> · ${escapeHtml(formatDateFr(r.createdAt))}</span>
            </p>
            ${multiline(r.content)}
            ${
              r.consentCommunicationNetworks
                ? `<p class="tag">Consentement com’ réseaux</p>`
                : ""
            }
          </article>
        `
            )
            .join("");
    parts.push(section("Avis validés", body));
  }

  if (payload.discoveryPoints) {
    const body =
      payload.discoveryPoints.length === 0
        ? `<p class="muted">Aucun point de découverte.</p>`
        : `<ul class="list">${payload.discoveryPoints
            .map(
              (p) => `
            <li>
              <strong>${escapeHtml(p.title)}</strong>
              ${p.teaser ? `<div>${multiline(p.teaser)}</div>` : ""}
              <p class="coords">${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}</p>
            </li>
          `
            )
            .join("")}</ul>`;
    parts.push(section("Points de découverte", body));
  }

  if (payload.partnerLots) {
    const body =
      payload.partnerLots.length === 0
        ? `<p class="muted">Aucun lot partenaire.</p>`
        : payload.partnerLots
            .map(
              (lot) => `
          <article class="card">
            <h3>${escapeHtml(lot.partnerName)} — ${escapeHtml(lot.title)}</h3>
            ${lot.description ? multiline(lot.description) : ""}
            ${
              lot.redemptionHint
                ? `<p><strong>Retrait :</strong> ${escapeHtml(lot.redemptionHint)}</p>`
                : ""
            }
            <p class="muted">${lot.active ? "Actif" : "Inactif"}
              ${
                lot.quantityRemaining == null
                  ? " · stock illimité"
                  : ` · reste ${lot.quantityRemaining}`
              }
            </p>
          </article>
        `
            )
            .join("");
    parts.push(section("Lots partenaires", body));
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #1a1a1a;
      font: 11pt/1.45 "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      background: #fff;
    }
    .toolbar {
      position: sticky;
      top: 0;
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid #ddd;
      background: #f7f7f5;
    }
    .toolbar button {
      border: 1px solid #222;
      background: #222;
      color: #fff;
      padding: 8px 14px;
      font: inherit;
      cursor: pointer;
    }
    .toolbar .hint { color: #555; font-size: 0.9rem; }
    header.doc-header {
      margin: 0 0 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #1a1a1a;
    }
    header.doc-header h1 {
      margin: 0 0 0.35rem;
      font-size: 1.55rem;
      line-height: 1.2;
    }
    header.doc-header p { margin: 0; color: #555; font-size: 0.92rem; }
    .section { margin: 0 0 1.35rem; page-break-inside: avoid; }
    .section h2 {
      margin: 0 0 0.6rem;
      font-size: 1.15rem;
      border-bottom: 1px solid #ccc;
      padding-bottom: 0.25rem;
    }
    h3 { margin: 0.6rem 0 0.35rem; font-size: 1rem; }
    p { margin: 0.25rem 0; }
    .muted { color: #666; }
    .meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.35rem 1rem;
      margin: 0 0 0.75rem;
    }
    .meta dt { font-size: 0.78rem; color: #666; }
    .meta dd { margin: 0; font-weight: 600; }
    .card {
      margin: 0 0 0.75rem;
      padding: 0.65rem 0.75rem;
      border: 1px solid #ddd;
      page-break-inside: avoid;
    }
    .list { margin: 0; padding-left: 1.1rem; }
    .list li { margin: 0 0 0.65rem; }
    .coords { font-size: 0.85rem; color: #666; }
    .tag {
      display: inline-block;
      margin-top: 0.35rem;
      padding: 0.1rem 0.4rem;
      border: 1px solid #bbb;
      font-size: 0.78rem;
    }
    .block { margin: 0.35rem 0; }
    .content { padding: 18px 20px 28px; }
    @media print {
      .toolbar { display: none !important; }
      .content { padding: 0; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span class="hint">Choisissez « Enregistrer au format PDF » dans la boîte d’impression.</span>
    <button type="button" onclick="window.print()">Imprimer / PDF</button>
  </div>
  <div class="content">
    <header class="doc-header">
      <h1>${escapeHtml(a.name)}</h1>
      <p>Balad’indice · ${escapeHtml(a.cityName)} · Exporté le ${escapeHtml(
        formatDateFr(payload.exportedAt)
      )}</p>
    </header>
    ${parts.join("\n")}
  </div>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.print(); }, 250);
    });
  </script>
</body>
</html>`;
}
