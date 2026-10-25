import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/api"] },
    ],
    sitemap: "https://www.flowsstateagents.com/sitemap.xml",
  };
}
