import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { MarkdownToHtmlTool } from "./MarkdownToHtmlTool";

export const metadata: Metadata = {
  title: "Markdown → HTML — kit.shreyannarula.com",
  description: "Convert Markdown to HTML with a live preview. Format toolbar, download as HTML fragment or full page. 100% in-browser.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/markdown-to-html" },
};

export default function MarkdownToHtmlPage() {
  return (
    <ToolShell toolId="markdown-to-html">
      <MarkdownToHtmlTool />
    </ToolShell>
  );
}
