import type { NextRequest } from "next/server";

/** IP du client (proxy / équilibreur : premières entrées de X-Forwarded-For). */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return request.headers.get("cf-connecting-ip")?.trim() ?? "unknown";
}
