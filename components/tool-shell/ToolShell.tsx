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
    <div className="min-h-[calc(100vh-8.5rem)] mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 sm:mb-6 min-w-0 overflow-hidden">
        <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0">
          <Home className="h-3 w-3" />
          <span className="hidden xs:inline">Home</span>
        </Link>
        {categoryLabel && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline truncate">{categoryLabel}</span>
          </>
        )}
        {tool && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium truncate">{tool.name}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground leading-tight">
            {tool?.name ?? toolId}
          </h1>
          {tool?.description && (
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-lg">
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
              className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
            >
              <Share2 className="h-3.5 w-3.5 sm:h-4 sm:h-4" />
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
