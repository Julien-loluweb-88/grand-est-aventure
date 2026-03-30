import { notFound } from "next/navigation";
import { apiDocsDisabled } from "@/lib/openapi/grand-est-openapi-document";
import { SwaggerUiDocs } from "./swagger-ui-docs";

export const metadata = {
  title: "Documentation API · OpenAPI",
  description:
    "Contrat HTTP (routes /api), réservé aux comptes avec accès au tableau de bord admin.",
};

export default function DashboardApiDocsPage() {
  if (apiDocsDisabled()) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <header className="mb-8 space-y-3 border-b border-border pb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Documentation API</h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed md:text-base">
          Spécification <strong>OpenAPI 3.1</strong>, visible uniquement après connexion avec un
          accès au dashboard (même garde-fou que le menu d&apos;administration). Les endpoints
          modifiant des données se comportent comme pour tout client HTTP ; cette page{" "}
          <strong>n&apos;active pas « Try it out »</strong> pour limiter les envois accidentels
          pendant la lecture.
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
          <li>
            JSON protégé (session admin requise) :{" "}
            <a className="text-primary underline-offset-4 hover:underline" href="/api/openapi">
              /api/openapi
            </a>
          </li>
          <li>
            Désactiver interface + JSON : variable{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">API_DOCS_ENABLED=false</code>
          </li>
          <li>
            Source à maintenir :{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              src/lib/openapi/grand-est-openapi-document.ts
            </code>
          </li>
        </ul>
      </header>

      <SwaggerUiDocs />

      <p className="text-muted-foreground mt-10 text-center text-xs">
        Swagger UI chargé depuis unpkg (swagger-ui-dist 5.11.0).
      </p>
    </div>
  );
}
