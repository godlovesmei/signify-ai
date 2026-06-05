import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SignifyAI",
    short_name: "SignifyAI",
    description: "Penerjemah dan ruang latihan alfabet BISINDO berbasis AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#17171c",
    icons: [
      {
        src: "/signify-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
