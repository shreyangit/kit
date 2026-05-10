import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { CssGridTool } from "./CssGridTool";
export const metadata: Metadata = {
  title: "CSS Grid Generator",
  description: "Visually build CSS Grid layouts. Set columns, rows, gap, and custom templates. Get the CSS instantly.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/css-grid" },
};
export default function Page() {
  return <ToolShell toolId="css-grid"><CssGridTool /></ToolShell>;
}
