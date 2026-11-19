import type { MetadataRoute } from "next";

/** Lets phones "Add to Home Screen" and open CodeQuest as a standalone app. There is no service worker, so it is not offline-capable. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CodeQuest",
    short_name: "CodeQuest",
    description: "Learn C++ and competitive programming step by step.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#58cc02",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
