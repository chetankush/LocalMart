import type { MetadataRoute } from "next";

// Lets people "Add to Home screen" — and on iPhone, home-screen apps are the
// only way to get order notifications
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LocalMart",
    short_name: "LocalMart",
    description: "Shop from local shops near you",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#D61F45",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
