import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { TomlJsonTool } from "./TomlJsonTool";
export const metadata: Metadata = {
  title: "TOML ↔ JSON Converter",
  description: "Convert TOML to JSON and JSON to TOML. Handles arrays, inline tables, and complex nested structures.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/toml-json" },
};
export default function Page() {
  return <ToolShell toolId="toml-json"><TomlJsonTool /></ToolShell>;
}
