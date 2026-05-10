import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { CssSpecificityTool } from "./CssSpecificityTool";
export const metadata: Metadata = {
  title: "CSS Specificity Calculator",
  description: "Calculate CSS selector specificity with a visual A/B/C/D breakdown. Compare two selectors to see which wins.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/css-specificity" },
};
export default function Page() {
  return <ToolShell toolId="css-specificity"><CssSpecificityTool /></ToolShell>;
}
