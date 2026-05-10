import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { BackgroundRemoverTool } from "./BackgroundRemoverTool";

export const metadata: Metadata = {
  title: "Background Remover",
  description: "Remove image backgrounds instantly with private in-browser AI or our high-quality cloud API. Edit, refine edges, and replace backgrounds directly.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/background-remover" },
};

export default function BackgroundRemoverPage() {
  return (
    <ToolShell toolId="background-remover">
      <BackgroundRemoverTool />
    </ToolShell>
  );
}
