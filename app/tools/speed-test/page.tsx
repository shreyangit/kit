import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { SpeedTestTool } from "./SpeedTestTool";
export const metadata: Metadata = {
  title: "Network Speed Test",
  description: "Test your connection speed to kit.shreyannarula.com. Measures download speed and ping with historical tracking.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/speed-test" },
};
export default function Page() {
  return <ToolShell toolId="speed-test"><SpeedTestTool /></ToolShell>;
}
