import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { SuggestForm } from "./SuggestForm";

export const metadata: Metadata = {
  title: "Suggest a Tool — kit by Shreyan Narula",
  description: "Request a tool you'd like to see built. Every suggestion is read.",
  alternates: { canonical: "https://kit.shreyannarula.com/suggest" },
};

export default function SuggestPage() {
  return (
    <div className="min-h-[calc(100vh-8.5rem)] mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0">
          <Home className="h-3 w-3" />
          <span className="hidden xs:inline">Home</span>
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-foreground font-medium">Suggest a Tool</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Suggest a Tool</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-md">
        Got a tool idea? Describe it below. Every suggestion is read — the ones that make sense get built.
      </p>

      <SuggestForm />
    </div>
  );
}
