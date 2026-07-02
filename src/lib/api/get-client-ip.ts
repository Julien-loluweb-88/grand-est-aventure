import type { NextRequest } from "next/server";

function ipFromForwardedHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return headers.get("cf-connecting-ip")?.trim() ?? "unknown";
}

/** IP du client (proxy / équilibreur : premières entrées de X-Forwarded-For). */
export function getClientIp(request: NextRequest): string {
  return ipFromForwardedHeaders(request.headers);
}

/** Même logique que `getClientIp`, pour server actions (`headers()`). */
export function getClientIpFromHeaders(headers: Headers): string {
  return ipFromForwardedHeaders(headers);
}
