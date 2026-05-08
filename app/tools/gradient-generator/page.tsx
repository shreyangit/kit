import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { GradientGeneratorTool } from "./GradientGeneratorTool";
export const metadata: Metadata = { title: "CSS Gradient Generator — kit", description: "Create linear, radial, and conic CSS gradients visually. Live preview, 10 presets, random generator, copy CSS or download as PNG.", alternates: { canonical: "https://kit.shreyannarula.com/tools/gradient-generator" } };
export default function GradientGeneratorPage() { return <ToolShell toolId="gradient-generator"><GradientGeneratorTool /></ToolShell>; }
