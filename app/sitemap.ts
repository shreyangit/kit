import { tools } from "@/lib/tools-registry";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolUrls = tools.map((tool) => ({
    url: `https://kit.shreyannarula.com/tools/${tool.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: tool.isImplemented ? 0.9 : 0.5,
  }));

  return [
    {
      url: "https://kit.shreyannarula.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...toolUrls,
  ];
}
