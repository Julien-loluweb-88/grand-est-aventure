import { NextResponse } from "next/server";
import { getAdminSessionCapabilities } from "@/lib/admin-session-capabilities";
import {
  apiDocsDisabled,
  buildGrandEstOpenApiDocument,
} from "@/lib/openapi/grand-est-openapi-document";

/**
 * OpenAPI 3.1 (JSON). Même périmètre que le dashboard : session + capacités admin
 * (`getAdminSessionCapabilities`). Désactivation : API_DOCS_ENABLED=false.
 */
export async function GET() {
  if (apiDocsDisabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const caps = await getAdminSessionCapabilities();
  if (!caps) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const doc = buildGrandEstOpenApiDocument();
  return NextResponse.json(doc, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
