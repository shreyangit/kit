import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback — kit",
  description:
    "Report a bug, request a feature, or suggest a missing tool. We read everything.",
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
