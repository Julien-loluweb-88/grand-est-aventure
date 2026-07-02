import { describe, expect, it } from "vitest";
import {
  DEFAULT_ACCENT_HUE,
  DEFAULT_USER_APP_PREFERENCES,
  mergeUserAppPreferences,
  resolveUserAppPreferences,
  userAppPreferencesPatchSchema,
} from "./user-app-preferences";

describe("resolveUserAppPreferences", () => {
  it("retourne les défauts si null", () => {
    expect(resolveUserAppPreferences(null)).toEqual(DEFAULT_USER_APP_PREFERENCES);
  });

  it("fusionne une valeur partielle valide", () => {
    expect(resolveUserAppPreferences({ theme: "dark" })).toEqual({
      ...DEFAULT_USER_APP_PREFERENCES,
      theme: "dark",
    });
  });

  it("lit accentHue entier 0–360", () => {
    expect(resolveUserAppPreferences({ accentHue: 60 })).toEqual({
      ...DEFAULT_USER_APP_PREFERENCES,
      accentHue: 60,
    });
  });

  it("ignore accentHue hors plage", () => {
    expect(resolveUserAppPreferences({ accentHue: 400 })).toEqual({
      ...DEFAULT_USER_APP_PREFERENCES,
      accentHue: DEFAULT_ACCENT_HUE,
    });
  });
});

describe("mergeUserAppPreferences", () => {
  it("écrase uniquement les clés du patch", () => {
    const current = resolveUserAppPreferences({ theme: "dark", haptics: false });
    expect(mergeUserAppPreferences(current, { soundEffects: false })).toEqual({
      ...current,
      soundEffects: false,
    });
  });
});

describe("userAppPreferencesPatchSchema", () => {
  it("accepte un patch partiel", () => {
    expect(userAppPreferencesPatchSchema.safeParse({ locale: "en" }).success).toBe(true);
  });

  it("accepte accentHue", () => {
    expect(userAppPreferencesPatchSchema.safeParse({ accentHue: 0 }).success).toBe(true);
    expect(userAppPreferencesPatchSchema.safeParse({ accentHue: 60 }).success).toBe(true);
  });

  it("rejette accentHue non entier", () => {
    expect(userAppPreferencesPatchSchema.safeParse({ accentHue: 30.5 }).success).toBe(false);
  });

  it("rejette un corps vide", () => {
    expect(userAppPreferencesPatchSchema.safeParse({}).success).toBe(false);
  });

  it("rejette une clé inconnue", () => {
    expect(userAppPreferencesPatchSchema.safeParse({ theme: "dark", foo: 1 }).success).toBe(false);
  });
});
