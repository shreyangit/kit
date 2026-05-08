import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { JwtDecoderTool } from "./JwtDecoderTool";

export const metadata: Metadata = {
  title: "JWT Decoder — kit",
  description: "Decode and inspect JSON Web Tokens (JWTs) entirely in your browser. View header, payload, expiry status, and standard claims without any server contact.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/jwt-decoder" },
};

export default function JwtDecoderPage() {
  return (
    <ToolShell toolId="jwt-decoder">
      <JwtDecoderTool />
    </ToolShell>
  );
}
