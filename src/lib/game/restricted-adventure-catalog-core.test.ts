import { describe, expect, it } from "vitest";
import { AdventureAudience } from "../../../generated/prisma/client";
import {
  buildRestrictedAdventureWhereInput,
  sortRestrictedAdventureRows,
} from "./restricted-adventure-catalog-core";

describe("buildRestrictedAdventureWhereInput", () => {
  it("retourne null pour anonyme sans whitelist", () => {
    expect(
      buildRestrictedAdventureWhereInput({
        role: "user",
        demoWhitelistAdventureIds: [],
        assignedDevelopmentAdventureIds: [],
      })
    ).toBeNull();
  });

  it("joueur whitelist → uniquement ses démos", () => {
    const where = buildRestrictedAdventureWhereInput({
      role: "user",
      demoWhitelistAdventureIds: ["demo-1"],
      assignedDevelopmentAdventureIds: [],
    });
    expect(where).toMatchObject({
      OR: [
        {
          id: { in: ["demo-1"] },
          audience: AdventureAudience.DEMO,
        },
      ],
    });
  });

  it("admin non assigné → toutes les démos, pas de dev sans assignation", () => {
    const where = buildRestrictedAdventureWhereInput({
      role: "admin",
      demoWhitelistAdventureIds: [],
      assignedDevelopmentAdventureIds: [],
    });
    expect(where).toEqual({
      OR: [{ audience: AdventureAudience.DEMO, OR: [{ status: true }, { status: null }] }],
    });
  });

  it("admin assigné → démos + dev assignées", () => {
    const where = buildRestrictedAdventureWhereInput({
      role: "admin",
      demoWhitelistAdventureIds: [],
      assignedDevelopmentAdventureIds: ["dev-1"],
    });
    expect(where?.OR).toHaveLength(2);
  });

  it("superadmin → démos + toutes les dev", () => {
    const where = buildRestrictedAdventureWhereInput({
      role: "superadmin",
      demoWhitelistAdventureIds: [],
      assignedDevelopmentAdventureIds: [],
    });
    expect(where?.OR).toHaveLength(2);
    expect(where?.OR?.[1]).toMatchObject({
      audience: AdventureAudience.DEVELOPMENT,
    });
  });
});

describe("sortRestrictedAdventureRows", () => {
  it("classe DEVELOPMENT avant DEMO puis updatedAt desc", () => {
    const sorted = sortRestrictedAdventureRows([
      {
        id: "d1",
        audience: AdventureAudience.DEMO,
        updatedAt: new Date("2026-06-01"),
      },
      {
        id: "v2",
        audience: AdventureAudience.DEVELOPMENT,
        updatedAt: new Date("2026-01-01"),
      },
      {
        id: "v1",
        audience: AdventureAudience.DEVELOPMENT,
        updatedAt: new Date("2026-06-15"),
      },
    ] as { id: string; audience: AdventureAudience; updatedAt: Date }[]);

    expect(sorted.map((r) => r.id)).toEqual(["v1", "v2", "d1"]);
  });
});
