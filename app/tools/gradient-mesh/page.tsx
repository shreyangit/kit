import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { GradientMeshTool } from "./GradientMeshTool";
export const metadata: Metadata = {
  title: "Gradient Mesh Generator",
  description: "Generate gradient mesh backgrounds using colour harmony schemes. Analogous, triadic, complementary and more. Get CSS output.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/gradient-mesh" },
};
export default function Page() {
  return <ToolShell toolId="gradient-mesh"><GradientMeshTool /></ToolShell>;
}
