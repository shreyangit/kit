import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { ColorBulkTool } from "./ColorBulkTool";
export const metadata: Metadata = {
  title: "Bulk Colour Converter",
  description: "Convert multiple colour values at once. Accepts hex, rgb(), and hsl(). Convert to any format in bulk.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/color-bulk" },
};
export default function Page() {
  return <ToolShell toolId="color-bulk"><ColorBulkTool /></ToolShell>;
}
