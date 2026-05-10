import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { ColorBlindnessTool } from "./ColorBlindnessTool";
export const metadata: Metadata = {
  title: "Color Blindness Simulator",
  description: "Simulate how images look to people with protanopia, deuteranopia, tritanopia, and achromatopsia. Upload any image for side-by-side comparison.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/color-blindness" },
};
export default function Page() {
  return <ToolShell toolId="color-blindness"><ColorBlindnessTool /></ToolShell>;
}
