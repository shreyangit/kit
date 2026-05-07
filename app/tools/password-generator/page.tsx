import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { PasswordGeneratorTool } from "./PasswordGeneratorTool";

export const metadata: Metadata = {
  title: "Password Generator — kit.shreyannarula.com",
  description:
    "Generate cryptographically secure passwords with a strength meter. Customise length, character sets, and entropy.",
  alternates: {
    canonical: "https://kit.shreyannarula.com/tools/password-generator",
  },
};

export default function PasswordGeneratorPage() {
  return (
    <ToolShell toolId="password-generator">
      <PasswordGeneratorTool />
    </ToolShell>
  );
}
