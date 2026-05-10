import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { EnvParserTool } from "./EnvParserTool";
export const metadata: Metadata = {
  title: "Environment Variable Parser",
  description: "Parse .env files into a table, JSON, or cleaned export. Type inference, validation, and key extraction.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/env-parser" },
};
export default function Page() {
  return <ToolShell toolId="env-parser"><EnvParserTool /></ToolShell>;
}
