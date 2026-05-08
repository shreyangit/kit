import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { PdfMergerTool } from "./PdfMergerTool";

export const metadata: Metadata = {
  title: "PDF Merger & Splitter — kit.shreyannarula.com",
  description: "Merge multiple PDFs or extract specific page ranges. Reorder files before merging. 100% in-browser, no uploads.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/pdf-merger" },
};

export default function PdfMergerPage() {
  return (
    <ToolShell toolId="pdf-merger">
      <PdfMergerTool />
    </ToolShell>
  );
}
