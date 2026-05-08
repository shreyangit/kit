import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { TextCaseTool } from "./TextCaseTool";

export const metadata: Metadata = {
  title: "Text Case Converter",
  description:
    "Convert text between camelCase, PascalCase, snake_case, kebab-case, UPPER, Title Case, and more. Instant, no upload.",
  alternates: {
    canonical: "https://kit.shreyannarula.com/tools/text-case",
  },
};

export default function TextCasePage() {
  return (
    <ToolShell toolId="text-case">
      <TextCaseTool />
    </ToolShell>
  );
}
