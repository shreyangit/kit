import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { ClipPathTool } from "./ClipPathTool";
export const metadata: Metadata = {
  title: "CSS Clip-Path Generator",
  description: "Create CSS clip-path polygon shapes with draggable handles. Includes presets for triangles, hexagons, stars, and more.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/clip-path" },
};
export default function Page() {
  return <ToolShell toolId="clip-path"><ClipPathTool /></ToolShell>;
}
