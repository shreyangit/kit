import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { ImageCompressorTool } from "./ImageCompressorTool";

export const metadata: Metadata = {
  title: "Image Compressor",
  description:
    "Compress JPG, PNG, and WebP images with a quality slider. See exact file size reduction before downloading. 100% in-browser.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/image-compressor" },
};

export default function ImageCompressorPage() {
  return (
    <ToolShell toolId="image-compressor">
      <ImageCompressorTool />
    </ToolShell>
  );
}
