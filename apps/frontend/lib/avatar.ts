export type AvatarAppearance = {
  backgroundColor: string;
  color: string;
  borderColor: string;
};

function normalizeIdentityPart(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function hashIdentity(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function getAvatarInitial(
  name: string | null | undefined,
  email?: string | null
) {
  const nameSeed = name?.trim();
  const emailSeed = email?.split("@")[0]?.trim();
  const source = nameSeed || emailSeed || "User";
  const match = source.match(/[a-zA-Z0-9]/);
  const initial = match?.[0] ?? source[0] ?? "U";

  return initial.toLocaleUpperCase("id-ID");
}

export function getAvatarAppearance(
  name: string | null | undefined,
  email?: string | null
): AvatarAppearance {
  const seed =
    [normalizeIdentityPart(name), normalizeIdentityPart(email)]
      .filter(Boolean)
      .join("|") || "user-account";
  const hash = hashIdentity(seed);
  const hue = hash % 360;
  const saturation = 48 + (hash % 15);
  const lightness = 27 + ((hash >> 4) % 5);
  const borderSaturation = Math.max(38, saturation - 8);
  const borderLightness = Math.max(18, lightness - 8);

  return {
    backgroundColor: `hsl(${hue} ${saturation}% ${lightness}%)`,
    color: "#ffffff",
    borderColor: `hsl(${hue} ${borderSaturation}% ${borderLightness}%)`,
  };
}
