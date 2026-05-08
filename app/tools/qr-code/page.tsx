import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { QrCodeTool } from "./QrCodeTool";

export const metadata: Metadata = {
  title: "QR Code Generator",
  description: "Generate QR codes for URLs, text, email, phone, WiFi, vCard, and SMS. Custom colors, sizes, and error correction. Download PNG or SVG.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/qr-code" },
};

export default function QrCodePage() {
  return (
    <ToolShell toolId="qr-code">
      <QrCodeTool />
    </ToolShell>
  );
}
