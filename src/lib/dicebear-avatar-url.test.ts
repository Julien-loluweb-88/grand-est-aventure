import { describe, expect, it } from "vitest";
import { isDicebearAvatarUrl, userImagePatchSchema } from "./dicebear-avatar-url";

const SAMPLE_DICEBEAR_URL =
  "https://api.dicebear.com/10.x/lorelei/svg?seed=user-42&backgroundColor=b6e3f4";

describe("isDicebearAvatarUrl", () => {
  it("accepte une URL DiceBear HTTPS", () => {
    expect(isDicebearAvatarUrl(SAMPLE_DICEBEAR_URL)).toBe(true);
  });

  it("rejette HTTP ou autre domaine", () => {
    expect(isDicebearAvatarUrl("http://api.dicebear.com/10.x/lorelei/svg")).toBe(false);
    expect(isDicebearAvatarUrl("https://example.com/avatar.svg")).toBe(false);
  });
});

describe("userImagePatchSchema", () => {
  it("accepte une URL DiceBear ou null", () => {
    expect(userImagePatchSchema.safeParse(SAMPLE_DICEBEAR_URL).success).toBe(true);
    expect(userImagePatchSchema.safeParse(null).success).toBe(true);
    expect(userImagePatchSchema.safeParse("https://evil.com/x.svg").success).toBe(false);
  });
});
