import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { LoremIpsumTool } from "./LoremIpsumTool";

export const metadata: Metadata = {
  title: "Lorem Ipsum Generator — kit",
  description: "Generate placeholder text by paragraphs, sentences, or words. Output as plain text, HTML, or Markdown. Uses cryptographic randomness for varied output.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/lorem-ipsum" },
};

export default function LoremIpsumPage() {
  return (
    <ToolShell toolId="lorem-ipsum">
      <LoremIpsumTool />
    </ToolShell>
  );
}
