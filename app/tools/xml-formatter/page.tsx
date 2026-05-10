import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { XmlFormatterTool } from "./XmlFormatterTool";
export const metadata: Metadata = {
  title: "XML Formatter & Validator",
  description: "Format, validate, and minify XML in your browser using DOMParser. Instant syntax error detection.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/xml-formatter" },
};
export default function Page() {
  return <ToolShell toolId="xml-formatter"><XmlFormatterTool /></ToolShell>;
}
