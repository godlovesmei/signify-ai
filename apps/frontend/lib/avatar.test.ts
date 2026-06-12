import { describe, expect, it } from "vitest";
import { getAvatarAppearance, getAvatarInitial } from "@/lib/avatar";

describe("avatar helpers", () => {
  it("uses a single readable initial from the user name or email", () => {
    expect(
      getAvatarInitial("Meiske Priskilla Sahertian", "meiske@example.test")
    ).toBe("M");
    expect(getAvatarInitial("", "qa@signify.local")).toBe("Q");
  });

  it("keeps automatic avatar colors deterministic per identity", () => {
    expect(getAvatarAppearance("Meiske", "meiske@example.test")).toEqual(
      getAvatarAppearance("Meiske", "meiske@example.test")
    );
    expect(getAvatarAppearance("Meiske", "meiske@example.test")).not.toEqual(
      getAvatarAppearance("QA Signify", "qa@signify.local")
    );
  });
});
