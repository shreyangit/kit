import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { QrCodeTool } from "./QrCodeTool";

export const metadata: Metadata = {
  title: "QR Code Generator",
  description: "Generate styled QR codes for URLs, text, email, phone, WiFi, vCard, and SMS. Center logos, color gradients, rounded/dot module styles, transparent background, scannability checks, and PNG/SVG export.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/qr-code" },
};

export default function QrCodePage() {
  return (
    <ToolShell toolId="qr-code">
      <QrCodeTool />
    </ToolShell>
  );
}
