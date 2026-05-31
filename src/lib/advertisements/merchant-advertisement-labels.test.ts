import { describe, expect, it } from "vitest";
import { merchantContentStatusAfterSuperadminLivePublish } from "@/lib/advertisements/merchant-advertisement-labels";
import { AdvertisementMerchantContentStatus } from "@/lib/advertisements/merchant-advertisement-status";

describe("merchantContentStatusAfterSuperadminLivePublish", () => {
  const live = { title: "Promo", body: null, imageUrl: null, targetUrl: null };

  it("passe SLOT_EMPTY → APPROVED si contenu live", () => {
    expect(
      merchantContentStatusAfterSuperadminLivePublish(
        AdvertisementMerchantContentStatus.SLOT_EMPTY,
        live
      )
    ).toBe(AdvertisementMerchantContentStatus.APPROVED);
  });

  it("ne change pas PENDING_REVIEW", () => {
    expect(
      merchantContentStatusAfterSuperadminLivePublish(
        AdvertisementMerchantContentStatus.PENDING_REVIEW,
        live
      )
    ).toBeUndefined();
  });

  it("ne change pas si contenu vide", () => {
    expect(
      merchantContentStatusAfterSuperadminLivePublish(
        AdvertisementMerchantContentStatus.SLOT_EMPTY,
        { title: null, body: null, imageUrl: null, targetUrl: null }
      )
    ).toBeUndefined();
  });
});
