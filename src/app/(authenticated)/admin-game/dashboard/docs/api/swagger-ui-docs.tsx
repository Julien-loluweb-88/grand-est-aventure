"use client";

import Script from "next/script";

const SWAGGER_UI_VERSION = "5.11.0";
const BUNDLE = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`;

declare global {
  interface Window {
    SwaggerUIBundle?: (opts: Record<string, unknown>) => unknown;
  }
}

/**
 * Swagger UI en lecture seule (pas d’exécution). Le fetch de /api/openapi envoie les cookies
 * de session : même contrôle d’accès que cette page (dashboard admin).
 */
export function SwaggerUiDocs() {
  return (
    <>
      <Script
        id="swagger-ui-bundle"
        src={BUNDLE}
        strategy="afterInteractive"
        onLoad={() => {
          const root = document.getElementById("swagger-ui-root");
          if (!root || root.dataset.initialized === "true" || !window.SwaggerUIBundle) {
            return;
          }
          root.dataset.initialized = "true";
          root.innerHTML = "";
          window.SwaggerUIBundle({
            dom_id: "#swagger-ui-root",
            url: "/api/openapi",
            tryItOutEnabled: false,
            supportedSubmitMethods: [],
            docExpansion: "list",
            filter: true,
            persistAuthorization: false,
          });
        }}
      />
      <div id="swagger-ui-root" className="min-h-[75vh]" />
    </>
  );
}
