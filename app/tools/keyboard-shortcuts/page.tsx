import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { KeyboardShortcutsTool } from "./KeyboardShortcutsTool";
export const metadata: Metadata = {
  title: "Keyboard Shortcut Cheatsheet",
  description: "Searchable keyboard shortcut reference for Chrome, VS Code, macOS, and Windows. Over 60 shortcuts across 5 categories.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/keyboard-shortcuts" },
};
export default function Page() {
  return <ToolShell toolId="keyboard-shortcuts"><KeyboardShortcutsTool /></ToolShell>;
}
