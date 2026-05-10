import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { CssAnimationTool } from "./CssAnimationTool";
export const metadata: Metadata = {
  title: "CSS Animation Generator",
  description: "Build CSS @keyframes animations visually. 8 presets, control duration, delay, easing, and iterations. Live preview + copy CSS.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/css-animation" },
};
export default function Page() {
  return <ToolShell toolId="css-animation"><CssAnimationTool /></ToolShell>;
}
