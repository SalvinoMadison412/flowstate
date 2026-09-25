import type { MetadataRoute } from "next";

const SITE = "https://www.flowsstateagents.com";
const PAGES = ["", "/voice-agent", "/services", "/about", "/contact", "/apps/wealthflow", "/apps/wealthflow/privacy", "/apps/wealthflow/delete-account"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: `${SITE}${p}`, lastModified: new Date() }));
}
