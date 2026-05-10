import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { ReadabilityTool } from "./ReadabilityTool";
export const metadata: Metadata = {
  title: "Readability Scorer",
  description: "Score text with Flesch Reading Ease, Flesch-Kincaid, Gunning Fog, SMOG, Coleman-Liau, and ARI. All computed in-browser.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/readability" },
};
export default function Page() {
  return <ToolShell toolId="readability"><ReadabilityTool /></ToolShell>;
}
