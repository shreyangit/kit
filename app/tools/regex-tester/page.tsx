import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { RegexTesterTool } from "./RegexTesterTool";

export const metadata: Metadata = {
  title: "Regex Tester",
  description: "Test regular expressions with live match highlighting, flag toggles, group extraction, and replace mode.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/regex-tester" },
};

export default function RegexTesterPage() {
  return (
    <ToolShell toolId="regex-tester">
      <RegexTesterTool />
    </ToolShell>
  );
}
