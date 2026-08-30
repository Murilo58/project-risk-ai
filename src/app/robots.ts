import type { MetadataRoute } from "next";

// Served at `/robots.txt` (excluded from the auth proxy in `src/proxy.ts`).
// Crawlers read this before scraping; a valid response keeps LinkedInBot and
// friends from bailing on the site.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    host: "https://project-risk-ai.vercel.app",
  };
}
