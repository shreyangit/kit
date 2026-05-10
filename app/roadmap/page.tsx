import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { VoteButton } from "./VoteButton";

export const metadata: Metadata = {
  title: "Roadmap — kit by Shreyan Narula",
  description: "See what's planned for kit. Vote on features you want most.",
  alternates: { canonical: "https://kit.shreyannarula.com/roadmap" },
};

const ROADMAP = {
  planned: [
    { id: "workflow-builder", title: "Workflow Builder", desc: "Chain multiple tools together — e.g. Image → Compress → Convert → Watermark in one click.", tag: "Big feature" },
    { id: "desktop-app", title: "Desktop App (Electron)", desc: "Full offline access to all 110 tools with file system drag-and-drop.", tag: "Upcoming" },
    { id: "tool-api", title: "Public API", desc: "REST and CLI access to any tool. Process files programmatically without a browser.", tag: "Developer" },
    { id: "batch-processing", title: "Batch Processing", desc: "Apply any tool to hundreds of files at once with a queue and progress indicator.", tag: "Power feature" },
    { id: "plugin-sdk", title: "Plugin SDK", desc: "Build and publish your own tools to the platform. Share with the community.", tag: "Open source" },
  ],
  inProgress: [
    { id: "mobile-app", title: "Mobile-optimised Tools", desc: "Touch-friendly UI pass on all tools. Larger tap targets and better keyboard handling.", tag: "Active" },
    { id: "cws-submission", title: "Chrome Web Store Listing", desc: "Publishing the extension to the Chrome Web Store for easy install.", tag: "Active" },
  ],
  done: [
    { id: "extension", title: "Chrome Extension", desc: "Access all tools from any page. Context menus, inline mini-tools.", tag: "Shipped" },
    { id: "dark-mode", title: "Dark / Light Theme", desc: "System-respecting theme with instant switching and no flash.", tag: "Shipped" },
    { id: "90-tools", title: "90 Tools Milestone", desc: "Shipped 90 browser-native tools across design, code, audio/video, productivity, and more.", tag: "Shipped" },
  ],
};

function ItemCard({ item, showVote }: { item: { id: string; title: string; desc: string; tag: string }; showVote?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm">{item.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">{item.tag}</span>
          {showVote && <VoteButton id={item.id} />}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{item.desc}</p>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <div className="min-h-[calc(100vh-8.5rem)] mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0">
          <Home className="h-3 w-3" />
          <span className="hidden xs:inline">Home</span>
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-foreground font-medium">Roadmap</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Roadmap</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          What&apos;s being built, what&apos;s next, and what&apos;s shipped. Vote on the planned items to help prioritise.
        </p>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">In Progress</h2>
          <div className="space-y-2">
            {ROADMAP.inProgress.map(item => <ItemCard key={item.id} item={item} />)}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Planned — vote to prioritise</h2>
          <div className="space-y-2">
            {ROADMAP.planned.map(item => <ItemCard key={item.id} item={item} showVote />)}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Shipped</h2>
          <div className="space-y-2">
            {ROADMAP.done.map(item => <ItemCard key={item.id} item={item} />)}
          </div>
        </section>
      </div>

      <div className="mt-10 pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Missing something?{" "}
          <Link href="/suggest" className="text-foreground underline underline-offset-2 hover:opacity-80 transition-opacity">
            Suggest a tool
          </Link>
        </p>
      </div>
    </div>
  );
}
