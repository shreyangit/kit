import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { PdfToImageTool } from "./PdfToImageTool";

export const metadata: Metadata = {
  title: "PDF to Image",
  description: "Export PDF pages as PNG or JPG at 72, 150, or 300 DPI. Each page is shown as a thumbnail with individual download.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/pdf-to-image" },
};

export default function PdfToImagePage() {
  return (
    <ToolShell toolId="pdf-to-image">
      <PdfToImageTool />
    </ToolShell>
  );
}
