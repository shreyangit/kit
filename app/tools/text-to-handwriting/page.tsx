import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { TextToHandwritingTool } from "./TextToHandwritingTool";
export const metadata: Metadata = {
  title: "Text to Handwriting",
  description: "Convert typed text to handwritten-style images using Google Fonts handwriting fonts. Choose page style, ink colour, and download as PNG.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/text-to-handwriting" },
};
export default function Page() {
  return <ToolShell toolId="text-to-handwriting"><TextToHandwritingTool /></ToolShell>;
}
