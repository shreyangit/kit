"use client";

import * as React from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  accept: string[]; // MIME types: ['image/jpeg', 'image/png']
  maxSizeMB: number;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
  label?: string;
  sublabel?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DropZone({
  accept,
  maxSizeMB,
  multiple = false,
  onFiles,
  className,
  label,
  sublabel,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function validate(files: File[]): File[] | null {
    const valid: File[] = [];
    for (const file of files) {
      if (!accept.includes(file.type)) {
        setError(`Unsupported format: ${file.type || file.name.split(".").pop()}`);
        return null;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large. Max ${maxSizeMB} MB.`);
        return null;
      }
      valid.push(file);
    }
    setError(null);
    return valid;
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const validated = validate(multiple ? files : [files[0]]);
    if (validated) onFiles(validated);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  // Clipboard paste
  React.useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find((i) => i.type.startsWith("image/"));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          const validated = validate([file]);
          if (validated) onFiles(validated);
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const acceptAttr = accept.join(",");
  const formatList = accept
    .map((m) => m.split("/")[1].toUpperCase())
    .join(", ");

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label="File drop zone"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-14 cursor-pointer transition-all duration-150 select-none",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/60 bg-secondary/20 hover:border-primary/40 hover:bg-secondary/30"
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          {isDragging ? (
            <Upload className="h-5 w-5 text-primary" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">
            {label ?? (isDragging ? "Drop here" : "Drop file or click to select")}
          </p>
          <p className="text-xs text-muted-foreground">
            {sublabel ?? `${formatList} · max ${maxSizeMB} MB`}
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-[10px] text-muted-foreground/60">
                or paste from clipboard (⌘V)
              </p>
            </TooltipTrigger>
            <TooltipContent>Ctrl/Cmd+V to paste an image</TooltipContent>
          </Tooltip>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// Helper hook: preview URL for a file (auto-revokes)
export function useFilePreview(file: File | null): string | null {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!file) { setUrl(null); return; }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

export { formatSize };
