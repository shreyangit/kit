import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { BreakpointTesterTool } from "./BreakpointTesterTool";
export const metadata: Metadata = {
  title: "Responsive Breakpoint Tester",
  description: "Preview any URL at standard device breakpoints: mobile, tablet, laptop, desktop. Portrait and landscape toggle. Custom dimensions.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/breakpoint-tester" },
};
export default function Page() {
  return <ToolShell toolId="breakpoint-tester"><BreakpointTesterTool /></ToolShell>;
}
