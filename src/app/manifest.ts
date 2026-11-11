import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Desafio KM",
    short_name: "Desafio KM",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f1",
    theme_color: "#c2410c",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
