import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { NewsletterForm } from "./NewsletterForm";

export const metadata: Metadata = {
  title: "Changelog — kit by Shreyan Narula",
  description: "See what's new in kit. Release notes written for humans, not commits.",
  alternates: { canonical: "https://kit.shreyannarula.com/changelog" },
};

const ENTRIES = [
  {
    version: "v2.0",
    date: "May 2026",
    title: "90 tools, browser-native",
    highlights: [
      "Launched 30 new tools including Binary Visualiser, Morse Code, Readability Scorer, and CSS Specificity Calculator.",
      "Added JSON Schema Validator (AJV-powered) — validate any JSON against a schema with detailed error paths.",
      "Typography Scale Generator with 9 musical ratios, live preview, CSS vars, Tailwind config, and JSON output.",
      "Gradient Mesh Generator — create mesh-gradient backgrounds using colour harmony theory.",
      "Icon Finder that searches 200,000+ icons from Iconify directly in the browser.",
      "Breakpoint Tester — preview any URL at standard device viewports.",
      "Feedback widget on every tool page — share your rating in 10 seconds.",
    ],
  },
  {
    version: "v1.5",
    date: "April 2026",
    title: "Chrome Extension + Design Tools",
    highlights: [
      "Chrome Extension published — access all tools via popup, mini inline runners for 20 common tools.",
      "Context menus added — right-click selected text to instantly run tools.",
      "CSS Animation Generator with preset library and live play button.",
      "SVG Path Editor — paste path data, visualise commands, convert between relative and absolute.",
      "CSS Clip-Path Generator with draggable polygon handles.",
      "Colour Blindness Simulator — 5 vision profiles with side-by-side comparison.",
    ],
  },
  {
    version: "v1.0",
    date: "March 2026",
    title: "60 tools. Fast. Private.",
    highlights: [
      "Launched with 60 browser-native tools. Nothing uploaded. Everything processed locally.",
      "Dark and light themes with instant switching and no flash.",
      "PDF merger, image converter, audio trimmer, video to GIF — all via WebAssembly, no servers.",
      "OCR tool using Tesseract.js — extract text from photos of documents.",
      "JWT decoder, hash generator, password generator — all using Web Crypto API.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-[calc(100vh-8.5rem)] mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0">
          <Home className="h-3 w-3" />
          <span className="hidden xs:inline">Home</span>
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-foreground font-medium">Changelog</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Changelog</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Written for people, not bots. Each entry explains <em>why</em> something was built, not just what changed.
        </p>
      </div>

      <div className="space-y-12">
        {ENTRIES.map((entry) => (
          <div key={entry.version} className="relative pl-6 border-l border-border">
            <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-border bg-background" />
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-foreground/8 border border-border">{entry.version}</span>
              <span className="text-xs text-muted-foreground">{entry.date}</span>
            </div>
            <h2 className="text-lg font-semibold mb-3">{entry.title}</h2>
            <ul className="space-y-2">
              {entry.highlights.map((h, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="shrink-0 text-foreground/40 mt-0.5">→</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">New tools ship every week. Subscribe to get notified:</p>
        <NewsletterForm />
        <p className="mt-2 text-xs text-muted-foreground">No spam. Unsubscribe any time.</p>
      </div>
    </div>
  );
}
