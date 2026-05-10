import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { SvgPathTool } from "./SvgPathTool";
export const metadata: Metadata = {
  title: "SVG Path Editor",
  description: "Paste SVG path data and see it rendered live. Analyse commands, simplify whitespace, convert to absolute, and copy.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/svg-path" },
};
export default function Page() {
  return <ToolShell toolId="svg-path"><SvgPathTool /></ToolShell>;
}
