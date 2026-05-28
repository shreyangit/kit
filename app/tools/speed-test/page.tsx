import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { SpeedTestTool } from "./SpeedTestTool";
export const metadata: Metadata = {
  title: "Network Speed Test",
  description:
    "Accurate browser speed test: download, upload, ping, jitter and bufferbloat measured against the nearest Cloudflare edge using multiple parallel connections. Live gauge, connection info, and test history.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/speed-test" },
};
export default function Page() {
  return <ToolShell toolId="speed-test"><SpeedTestTool /></ToolShell>;
}
