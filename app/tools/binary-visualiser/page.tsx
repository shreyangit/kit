import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { BinaryVisualiserTool } from "./BinaryVisualiserTool";
export const metadata: Metadata = {
  title: "Binary / Hex / Octal Visualiser",
  description: "Visualise integers, floats (IEEE 754), text (UTF-8 bytes), and colours at the bit level. Interactive bit breakdown.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/binary-visualiser" },
};
export default function Page() {
  return <ToolShell toolId="binary-visualiser"><BinaryVisualiserTool /></ToolShell>;
}
