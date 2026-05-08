import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { CsvJsonTool } from "./CsvJsonTool";

export const metadata: Metadata = {
  title: "CSV ↔ JSON",
  description: "Convert CSV to JSON (array of objects or arrays) and JSON back to CSV. Custom delimiters, preview table, file upload.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/csv-json" },
};

export default function CsvJsonPage() {
  return (
    <ToolShell toolId="csv-json">
      <CsvJsonTool />
    </ToolShell>
  );
}
