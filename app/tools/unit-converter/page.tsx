import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { UnitConverterTool } from "./UnitConverterTool";

export const metadata: Metadata = {
  title: "Unit Converter — kit.shreyannarula.com",
  description: "Convert length, weight, temperature, area, volume, speed, data, and time units. All conversions shown simultaneously. Copy any value.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/unit-converter" },
};

export default function UnitConverterPage() {
  return (
    <ToolShell toolId="unit-converter">
      <UnitConverterTool />
    </ToolShell>
  );
}
