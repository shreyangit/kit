import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { JsonFormatterTool } from "./JsonFormatterTool";

export const metadata: Metadata = {
  title: "JSON Formatter & Validator",
  description:
    "Format, validate, and minify JSON with real-time syntax checking. 100% in-browser, nothing uploaded.",
  alternates: {
    canonical: "https://kit.shreyannarula.com/tools/json-formatter",
  },
};

export default function JsonFormatterPage() {
  return (
    <ToolShell toolId="json-formatter">
      <JsonFormatterTool />
    </ToolShell>
  );
}
