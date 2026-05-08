import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { ColorConverterTool } from "./ColorConverterTool";

export const metadata: Metadata = {
  title: "Color Picker & Converter",
  description: "Convert between HEX, RGB, HSL, HSV, and CMYK. See WCAG contrast ratios for accessibility. Color history saved locally.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/color-converter" },
};

export default function ColorConverterPage() {
  return (
    <ToolShell toolId="color-converter">
      <ColorConverterTool />
    </ToolShell>
  );
}
