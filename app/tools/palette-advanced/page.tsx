import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { PaletteAdvancedTool } from "./PaletteAdvancedTool";
export const metadata: Metadata = {
  title: "Image Palette Extractor",
  description: "Extract the dominant colour palette from any image. Upload a photo and get up to 24 colours as hex codes.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/palette-advanced" },
};
export default function Page() {
  return <ToolShell toolId="palette-advanced"><PaletteAdvancedTool /></ToolShell>;
}
