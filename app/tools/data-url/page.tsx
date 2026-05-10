import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { DataUrlTool } from "./DataUrlTool";
export const metadata: Metadata = {
  title: "Data URL Encoder / Decoder",
  description: "Encode files to data URLs (base64) or decode data URLs back to files. Preview images, text, and audio inline.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/data-url" },
};
export default function Page() {
  return <ToolShell toolId="data-url"><DataUrlTool /></ToolShell>;
}
