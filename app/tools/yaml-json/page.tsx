import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { YamlJsonTool } from "./YamlJsonTool";
export const metadata: Metadata = {
  title: "YAML ↔ JSON Converter",
  description: "Convert YAML to JSON and JSON to YAML instantly. Real-time conversion with error highlighting.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/yaml-json" },
};
export default function Page() {
  return <ToolShell toolId="yaml-json"><YamlJsonTool /></ToolShell>;
}
