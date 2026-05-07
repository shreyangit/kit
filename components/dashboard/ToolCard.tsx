import Link from "next/link";
import {
  Scissors,
  PackageMinus,
  FilePlus,
  RefreshCw,
  Crop,
  FileImage,
  Braces,
  Binary,
  KeyRound,
  Pipette,
  AlignLeft,
  CaseSensitive,
  QrCode,
  ArrowLeftRight,
  Search,
  FileCode,
  Table,
  Palette,
  Hash,
  GitCompare,
  Image,
  FileText,
  Play,
  Code2,
  Zap,
  ShieldCheck,
  Database,
  Globe,
  PenLine,
  Lock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Tool } from "@/lib/tools-registry";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Scissors,
  PackageMinus,
  FilePlus,
  RefreshCw,
  Crop,
  FileImage,
  Braces,
  Binary,
  KeyRound,
  Pipette,
  AlignLeft,
  CaseSensitive,
  QrCode,
  ArrowLeftRight,
  Search,
  FileCode,
  Table,
  Palette,
  Hash,
  GitCompare,
  Image,
  FileText,
  Play,
  Code2,
  Zap,
  ShieldCheck,
  Database,
  Globe,
  PenLine,
};

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const Icon = iconMap[tool.icon] ?? Braces;

  if (!tool.isImplemented) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group rounded-lg border border-border/50 bg-card/50 p-4 opacity-50 cursor-not-allowed select-none">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{tool.name}</p>
                  <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {tool.description}
                </p>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>Coming soon</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href={`/tools/${tool.id}`} id={`tool-card-${tool.id}`} tabIndex={0}>
      <Card className="group border-border/60 hover:border-primary/40 hover:bg-card/80 transition-all duration-150 cursor-pointer animate-fade-in">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary group-hover:bg-primary/10 transition-colors">
              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {tool.name}
                </p>
                {tool.isNew && (
                  <Badge variant="new" className="shrink-0">New</Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {tool.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
