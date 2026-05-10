import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { JsonSchemaValidatorTool } from "./JsonSchemaValidatorTool";
export const metadata: Metadata = {
  title: "JSON Schema Validator",
  description: "Validate JSON data against a JSON Schema using AJV. Shows all errors with paths and suggestions. Can infer schema from data.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/json-schema" },
};
export default function Page() {
  return <ToolShell toolId="json-schema"><JsonSchemaValidatorTool /></ToolShell>;
}
