import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { HttpStatusTool } from "./HttpStatusTool";
export const metadata: Metadata = {
  title: "HTTP Status Code Reference",
  description: "Complete HTTP status code reference with descriptions and real-world usage guidance. Searchable, filterable by 1xx–5xx.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/http-status" },
};
export default function Page() {
  return <ToolShell toolId="http-status"><HttpStatusTool /></ToolShell>;
}
