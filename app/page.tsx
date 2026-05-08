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

  // Count per category (for badges)
  const categoryCounts = React.useMemo(() => {
    const counts: Partial<Record<ToolCategory, number>> = {};
    tools.forEach((t) => {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Browser tools. No uploads.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          20+ utilities that run entirely in your browser. Nothing leaves your device.
        </p>
        <div className="mt-6">
          <SearchBar value={query} onChange={setQuery} />
        </div>
      </div>

      {/* Recently used */}
      {recentTools.length > 0 && !query && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Recently used
          </h2>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {recentTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Category filter */}
      {!query && (
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide">
          <button
            id="filter-all"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0",
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            All
            <span className="ml-1.5 opacity-60">{tools.length}</span>
          </button>
          {allCategories.map(([id, meta]) => (
            <button
              key={id}
              id={`filter-${id}`}
              onClick={() => setActiveCategory(id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0",
                activeCategory === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {meta.label}
              <span className="ml-1.5 opacity-60">{categoryCounts[id] ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tools grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No tools found for &ldquo;{query}&rdquo;
        </div>
      ) : (
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
