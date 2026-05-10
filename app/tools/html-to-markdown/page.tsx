import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { HtmlToMarkdownTool } from "./HtmlToMarkdownTool";
export const metadata: Metadata = {
  title: "HTML to Markdown Converter",
  description: "Convert HTML to clean Markdown using Turndown. Handles headings, lists, links, code blocks, tables, and more.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/html-to-markdown" },
};
export default function Page() {
  return <ToolShell toolId="html-to-markdown"><HtmlToMarkdownTool /></ToolShell>;
}
