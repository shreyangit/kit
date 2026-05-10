import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { IconFinderTool } from "./IconFinderTool";
export const metadata: Metadata = {
  title: "Icon Finder & Downloader",
  description: "Search 200,000+ open-source icons from Iconify (Material, Heroicons, Tabler, Lucide, and more). Download as SVG or copy for React/Vue/HTML.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/icon-finder" },
};
export default function Page() {
  return <ToolShell toolId="icon-finder"><IconFinderTool /></ToolShell>;
}
