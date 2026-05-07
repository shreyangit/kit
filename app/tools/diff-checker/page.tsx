import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { DiffCheckerTool } from "./DiffCheckerTool";

export const metadata: Metadata = {
  title: "Diff Checker — kit.shreyannarula.com",
  description: "Compare two texts with line, word, or character diffs. Split and unified views, inline word highlights, patch download.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/diff-checker" },
};

export default function DiffCheckerPage() {
  return (
    <ToolShell toolId="diff-checker">
      <DiffCheckerTool />
    </ToolShell>
  );
}
