import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hope Of Life — Bar Lounge & Restaurant de luxe",
    short_name: "Hope Of Life",
    description:
      "Hope Of Life, bar lounge et restaurant de luxe à Antraco, Angondjé. Réservez votre table, découvrez notre carte et nos soirées d'exception.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0a08",
    theme_color: "#0b0a08",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
