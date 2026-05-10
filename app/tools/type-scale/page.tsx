import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { TypeScaleTool } from "./TypeScaleTool";
export const metadata: Metadata = {
  title: "Typography Scale Generator",
  description: "Generate a type scale using musical interval ratios. Live preview, CSS variables, Tailwind config, and JSON output.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/type-scale" },
};
export default function Page() {
  return <ToolShell toolId="type-scale"><TypeScaleTool /></ToolShell>;
}
