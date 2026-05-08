import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { BaseConverterTool } from "./BaseConverterTool";

export const metadata: Metadata = {
  title: "Number Base Converter — kit",
  description: "Convert numbers between Binary, Octal, Decimal, Hex, Base32, and Base36. Uses BigInt for arbitrarily large numbers. Live conversion as you type.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/base-converter" },
};

export default function BaseConverterPage() {
  return (
    <ToolShell toolId="base-converter">
      <BaseConverterTool />
    </ToolShell>
  );
}
