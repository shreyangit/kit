"use client";

import * as React from "react";
import { SearchBar } from "@/components/dashboard/SearchBar";
import { ToolCard } from "@/components/dashboard/ToolCard";
import { tools, categoryMeta, searchTools, type ToolCategory } from "@/lib/tools-registry";
import { getRecentToolIds } from "@/lib/utils/recently-used";
import { cn } from "@/lib/utils";

const allCategories = Object.entries(categoryMeta) as [
  ToolCategory,
  { label: string; icon: string }
][];

export default function HomePage() {
  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<ToolCategory | "all">("all");
  const [recentIds, setRecentIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setRecentIds(getRecentToolIds());
  }, []);

  const filtered = React.useMemo(() => {
    let result = query ? searchTools(query) : tools;
    if (activeCategory !== "all") {
      result = result.filter((t) => t.category === activeCategory);
    }
    return result;
  }, [query, activeCategory]);

  const recentTools = React.useMemo(
    () =>
      recentIds
        .map((id) => tools.find((t) => t.id === id))
        .filter(Boolean) as typeof tools,
    [recentIds]
  );

  const categoryCounts = React.useMemo(() => {
    const counts: Partial<Record<ToolCategory, number>> = {};
    tools.forEach((t) => {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">

      {/* Hero — generous vertical breathing room */}
      <div className="text-center mb-14">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Browser tools. No uploads.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {tools.filter(t => t.isImplemented).length} utilities that run entirely in your browser.
          Nothing leaves your device.
        </p>
        <div className="mt-8 max-w-lg mx-auto">
          <SearchBar value={query} onChange={setQuery} />
        </div>
      </div>

      {/* Recently used */}
      {recentTools.length > 0 && !query && (
        <section className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Recently used
          </p>
          <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {recentTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Category filter */}
      {!query && (
        <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide">
          <button
            id="filter-all"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
              activeCategory === "all"
                ? "bg-foreground text-background"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
            )}
          >
            All
            <span className="ml-1.5 opacity-50">{tools.filter(t => t.isImplemented).length}</span>
          </button>
          {allCategories.map(([id, meta]) => {
            const count = categoryCounts[id] ?? 0;
            if (!count) return null;
            return (
              <button
                key={id}
                id={`filter-${id}`}
                onClick={() => setActiveCategory(id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
                  activeCategory === id
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                )}
              >
                {meta.label}
                <span className="ml-1.5 opacity-50">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tools grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          No tools found for &ldquo;{query}&rdquo;
        </div>
      ) : (
        <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
