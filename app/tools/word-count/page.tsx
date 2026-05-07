import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { WordCountTool } from "./WordCountTool";

export const metadata: Metadata = {
  title: "Word Count & Readability Analyzer — kit.shreyannarula.com",
  description:
    "Live word count, character count, sentences, paragraphs, reading time, and Flesch readability score.",
  alternates: {
    canonical: "https://kit.shreyannarula.com/tools/word-count",
  },
};

export default function WordCountPage() {
  return (
    <ToolShell toolId="word-count">
      <WordCountTool />
    </ToolShell>
  );
}
