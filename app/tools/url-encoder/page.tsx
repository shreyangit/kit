import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { UrlEncoderTool } from "./UrlEncoderTool";

export const metadata: Metadata = {
  title: "URL Encoder / Decoder",
  description: "Encode or decode URLs in 4 modes: URI Component, Full URI, Base64, Form Encoded. Also parses URLs into protocol, host, path, and query params.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/url-encoder" },
};

export default function UrlEncoderPage() {
  return (
    <ToolShell toolId="url-encoder">
      <UrlEncoderTool />
    </ToolShell>
  );
}
