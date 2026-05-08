import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { BackgroundRemoverTool } from "./BackgroundRemoverTool";

export const metadata: Metadata = {
  title: "Background Remover",
  description: "Remove image backgrounds instantly with an AI model running entirely in your browser. No uploads. Download as transparent PNG.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/background-remover" },
};

export default function BackgroundRemoverPage() {
  return (
    <ToolShell toolId="background-remover">
      <BackgroundRemoverTool />
    </ToolShell>
  );
}
