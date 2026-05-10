import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { FileToolsTool } from "./FileToolsTool";
export const metadata: Metadata = {
  title: "File Size Analyser & Batch Renamer",
  description: "Analyse file sizes, types, and totals. Preview batch rename operations with multiple patterns.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/file-tools" },
};
export default function Page() {
  return <ToolShell toolId="file-tools"><FileToolsTool /></ToolShell>;
}
