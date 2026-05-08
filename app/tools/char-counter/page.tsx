import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { CharCounterTool } from "./CharCounterTool";

export const metadata: Metadata = {
  title: "Character & Byte Counter",
  description: "Count characters, words, sentences, UTF-8 and UTF-16 bytes. Word frequency analysis, reading time, platform limits (Twitter, SMS, meta). Fully offline.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/char-counter" },
};

export default function CharCounterPage() {
  return (
    <ToolShell toolId="char-counter">
      <CharCounterTool />
    </ToolShell>
  );
}
