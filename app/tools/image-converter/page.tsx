import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { ImageConverterTool } from "./ImageConverterTool";

export const metadata: Metadata = {
  title: "Image Format Converter",
  description:
    "Convert between JPG, PNG, WebP, AVIF, GIF, and BMP. Batch convert multiple files. 100% in-browser, no uploads.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/image-converter" },
};

export default function ImageConverterPage() {
  return (
    <ToolShell toolId="image-converter">
      <ImageConverterTool />
    </ToolShell>
  );
}
