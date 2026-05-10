import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { SlugGeneratorTool } from "./SlugGeneratorTool";
export const metadata: Metadata = {
  title: "URL Slug Generator",
  description: "Generate URL-safe slugs from any text. Multiple separators, max length, camelCase, PascalCase, and bulk CSV export.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/slug-generator" },
};
export default function Page() {
  return <ToolShell toolId="slug-generator"><SlugGeneratorTool /></ToolShell>;
}
