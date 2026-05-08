"use client";

import Link from "next/link";
import * as React from "react";
import {
  Scissors, PackageMinus, FilePlus, RefreshCw, Crop, FileImage,
  Braces, Binary, KeyRound, Pipette, AlignLeft, CaseSensitive,
  QrCode, ArrowLeftRight, Search, FileCode, Table, Palette, Hash,
  GitCompare, Image, FileText, Play, Code2, Zap, ShieldCheck,
  Database, Globe, PenLine, Lock, MonitorSmartphone, Mic,
  Timer, Calculator, BarChart3, Music, Video, Radio, FileOutput,
  Barcode, User, Cpu, Clock, Wifi, Paintbrush, Wand2, Layers,
  Tag, Map, SquareCode, ScanBarcode,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/tools-registry";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Scissors, PackageMinus, FilePlus, RefreshCw, Crop, FileImage,
  Braces, Binary, KeyRound, Pipette, AlignLeft, CaseSensitive,
  QrCode, ArrowLeftRight, Search, FileCode, Table, Palette, Hash,
  GitCompare, Image, FileText, Play, Code2, Zap, ShieldCheck,
  Database, Globe, PenLine, Lock, MonitorSmartphone, Mic,
  Timer, Calculator, BarChart3, Music, Video, Radio, FileOutput,
  Barcode, User, Cpu, Clock, Wifi, Paintbrush, Wand2, Layers,
  Tag, Map, SquareCode, ScanBarcode,
};

// Shorten description to ≤ 7 words for card; full desc shown in tooltip
function shortDesc(desc: string): string {
  const words = desc.split(" ");
  if (words.length <= 7) return desc;
  return words.slice(0, 7).join(" ") + "…";
}

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const Icon = iconMap[tool.icon] ?? Braces;
  const brief = shortDesc(tool.description);

  if (!tool.isImplemented) {
    return (
      <div
        className="group relative flex flex-col justify-between h-[84px] rounded-lg border border-border/40 bg-card/40 px-4 py-3.5 opacity-40 cursor-not-allowed select-none"
        title="Coming soon"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground truncate">{tool.name}</span>
          <Lock className="h-3 w-3 text-muted-foreground shrink-0 ml-auto" />
        </div>
        <p className="text-xs text-muted-foreground truncate mt-1.5 pl-6.5">{brief}</p>
      </div>
    );
  }

  return (
    <Link
      href={`/tools/${tool.id}`}
      id={`tool-card-${tool.id}`}
      tabIndex={0}
      className="group relative flex flex-col justify-between h-[84px] rounded-lg border border-border/50 bg-card px-4 py-3.5
        hover:border-foreground/20 hover:bg-card/90 hover:shadow-sm
        focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2
        transition-all duration-150 cursor-pointer animate-fade-in"
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="text-sm font-medium text-foreground truncate group-hover:text-foreground transition-colors flex-1 min-w-0">
          {tool.name}
        </span>
        {tool.isNew && (
          <Badge variant="new" className="shrink-0">New</Badge>
        )}
      </div>

      {/* Short description — single line, muted */}
      <p className="text-xs text-muted-foreground truncate mt-1.5 pl-[26px]">
        {brief}
      </p>

      {/* Hover tooltip — full description, appears above the card */}
      <div
        role="tooltip"
        className="
          pointer-events-none absolute bottom-full left-0 mb-2 z-50
          w-72 max-w-xs rounded-md border border-border bg-popover px-3 py-2.5 shadow-md
          text-xs text-popover-foreground leading-relaxed
          opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0
          transition-all duration-150
        "
      >
        <span className="font-semibold text-foreground">{tool.name}</span>
        <span className="mx-1.5 text-border">·</span>
        {tool.description}
        {tool.tags && tool.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tool.tags.slice(0, 5).map(tag => (
              <span key={tag} className="rounded px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-mono">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
