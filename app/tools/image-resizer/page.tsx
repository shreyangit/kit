import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { ImageResizerTool } from "./ImageResizerTool";

export const metadata: Metadata = {
  title: "Image Resizer — kit.shreyannarula.com",
  description:
    "Resize images by exact pixels, percentage, or social media presets. Aspect ratio lock. 100% in-browser.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/image-resizer" },
};

export default function ImageResizerPage() {
  return (
    <ToolShell toolId="image-resizer">
      <ImageResizerTool />
    </ToolShell>
  );
}
