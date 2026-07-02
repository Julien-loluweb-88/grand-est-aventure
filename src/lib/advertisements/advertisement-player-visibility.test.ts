import { describe, expect, it } from "vitest";
import {
  hasAdvertisementLiveDisplayContent,
  isAdvertisementVisibleToPlayer,
} from "@/lib/advertisements/advertisement-player-visibility";
import { AdvertisementMerchantContentStatus } from "@/lib/advertisements/merchant-advertisement-status";

const base = {
  title: "Promo",
  body: null,
  imageUrl: null,
  targetUrl: null,
  active: true,
  ownerMerchantUserId: "merchant_1",
};

describe("hasAdvertisementLiveDisplayContent", () => {
  it("accepte titre, texte, image ou lien", () => {
    expect(hasAdvertisementLiveDisplayContent({ ...base, title: "x" })).toBe(true);
    expect(
      hasAdvertisementLiveDisplayContent({ ...base, title: null, body: "y" })
    ).toBe(true);
    expect(
      hasAdvertisementLiveDisplayContent({
        ...base,
        title: null,
        imageUrl: "/uploads/a.jpg",
      })
    ).toBe(true);
    expect(
      hasAdvertisementLiveDisplayContent({
        ...base,
        title: null,
        targetUrl: "https://exemple.fr",
      })
    ).toBe(true);
    expect(
      hasAdvertisementLiveDisplayContent({
        title: null,
        body: null,
        imageUrl: null,
        targetUrl: null,
      })
    ).toBe(false);
  });
});

describe("isAdvertisementVisibleToPlayer", () => {
  it("masque emplacement commerçant vide ou brouillon", () => {
    expect(
      isAdvertisementVisibleToPlayer({
        ...base,
        merchantContentStatus: AdvertisementMerchantContentStatus.SLOT_EMPTY,
      })
    ).toBe(false);
    expect(
      isAdvertisementVisibleToPlayer({
        ...base,
        merchantContentStatus: AdvertisementMerchantContentStatus.DRAFT,
      })
    ).toBe(false);
  });

  it("affiche contenu validé commerçant", () => {
    expect(
      isAdvertisementVisibleToPlayer({
        ...base,
        merchantContentStatus: AdvertisementMerchantContentStatus.APPROVED,
      })
    ).toBe(true);
  });

  it("garde la version live en re-modération", () => {
    expect(
      isAdvertisementVisibleToPlayer({
        ...base,
        merchantContentStatus: AdvertisementMerchantContentStatus.PENDING_REVIEW,
      })
    ).toBe(true);
  });

  it("affiche les pubs superadmin sans owner commerçant", () => {
    expect(
      isAdvertisementVisibleToPlayer({
        ...base,
        ownerMerchantUserId: null,
        merchantContentStatus: AdvertisementMerchantContentStatus.APPROVED,
      })
    ).toBe(true);
  });
});
