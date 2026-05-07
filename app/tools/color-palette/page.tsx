import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { ColorPaletteTool } from "./ColorPaletteTool";

export const metadata: Metadata = {
  title: "Color Palette Extractor — kit.shreyannarula.com",
  description:
    "Extract dominant colors from any image. Get HEX, RGB, HSL values and CSS variables. 100% in-browser.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/color-palette" },
};

export default function ColorPalettePage() {
  return (
    <ToolShell toolId="color-palette">
      <ColorPaletteTool />
    </ToolShell>
  );
}
