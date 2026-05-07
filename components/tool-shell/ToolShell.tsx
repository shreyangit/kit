"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Share2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { categoryMeta, getToolById } from "@/lib/tools-registry";
import { trackToolUsage } from "@/lib/utils/recently-used";

interface ToolShellProps {
  toolId: string;
  children: React.ReactNode;
}

export function ToolShell({ toolId, children }: ToolShellProps) {
  const tool = getToolById(toolId);

  React.useEffect(() => {
    if (toolId) trackToolUsage(toolId);
  }, [toolId]);

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: tool?.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }

  const categoryLabel = tool
    ? categoryMeta[tool.category]?.label
    : undefined;

  return (
    <div className="min-h-[calc(100vh-8.5rem)] mx-auto max-w-5xl px-4 sm:px-6 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Home className="h-3 w-3" />
          <span>Home</span>
        </Link>
        {categoryLabel && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span>{categoryLabel}</span>
          </>
        )}
        {tool && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{tool.name}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {tool?.name ?? toolId}
          </h1>
          {tool?.description && (
            <p className="mt-1 text-sm text-muted-foreground max-w-lg">
              {tool.description}
            </p>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              id="tool-share-btn"
              aria-label="Share this tool"
              className="shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>
      </div>

      {/* Tool content */}
      {children}
    </div>
  );
}
