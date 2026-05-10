import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { MorseCodeTool } from "./MorseCodeTool";
export const metadata: Metadata = {
  title: "Morse Code Translator",
  description: "Translate text to Morse code and back. Hear it played via Web Audio API with adjustable WPM and frequency.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/morse-code" },
};
export default function Page() {
  return <ToolShell toolId="morse-code"><MorseCodeTool /></ToolShell>;
}
