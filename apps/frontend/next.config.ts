import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Menonaktifkan tombol 'N' dan indikator development di pojok layar

  images: {
    qualities: [75, 90],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy",   value: "same-origin"  },
        ],
      },
    ];
  },
};

export default nextConfig;
