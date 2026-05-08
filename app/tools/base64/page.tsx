import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { Base64Tool } from "./Base64Tool";

export const metadata: Metadata = {
  title: "Base64 Encoder / Decoder",
  description:
    "Encode and decode Base64 for text and files. Supports data URLs, image previews, and auto-mode detection.",
  alternates: {
    canonical: "https://kit.shreyannarula.com/tools/base64",
  },
};

export default function Base64Page() {
  return (
    <ToolShell toolId="base64">
      <Base64Tool />
    </ToolShell>
  );
}
