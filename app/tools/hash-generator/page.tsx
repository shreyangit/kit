import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { HashGeneratorTool } from "./HashGeneratorTool";

export const metadata: Metadata = {
  title: "Hash Generator — kit.shreyannarula.com",
  description: "Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes for text and files. Compare hashes to verify file integrity.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/hash-generator" },
};

export default function HashGeneratorPage() {
  return (
    <ToolShell toolId="hash-generator">
      <HashGeneratorTool />
    </ToolShell>
  );
}
