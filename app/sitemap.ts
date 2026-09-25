import type { MetadataRoute } from "next";

const SITE = "https://www.flowsstateagents.com";
const PAGES = ["", "/voice-agent", "/services", "/about", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: `${SITE}${p}`, lastModified: new Date() }));
}
