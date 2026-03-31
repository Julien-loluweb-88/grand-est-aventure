"use client";

import Script from "next/script";
import {
  swaggerOperationsSorter,
  swaggerTagsSorter,
} from "./swagger-openapi-order";

const SWAGGER_UI_VERSION = "5.11.0";
const BUNDLE = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`;

declare global {
  interface Window {
    SwaggerUIBundle?: (opts: Record<string, unknown>) => unknown;
  }
}

/**
 * Swagger UI avec « Try it out » : les requêtes partent depuis le navigateur (même origine),
 * avec cookies de session admin. Accès réservé au dashboard comme pour `/api/openapi`.
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
            tryItOutEnabled: true,
            supportedSubmitMethods: ["get", "post", "put", "patch", "delete", "options"],
            docExpansion: "list",
            filter: true,
            persistAuthorization: true,
            tagsSorter: swaggerTagsSorter,
            operationsSorter: swaggerOperationsSorter,
            requestInterceptor: (req: Record<string, unknown>) => ({
              ...req,
              credentials: "same-origin",
            }),
          });
        }}
      />
      <div id="swagger-ui-root" className="min-h-[75vh]" />
    </>
  );
}
