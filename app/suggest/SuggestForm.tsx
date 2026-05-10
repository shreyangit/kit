"use client";
import * as React from "react";

export function SuggestForm() {
  const [submitted, setSubmitted] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: "suggestion", toolId: "suggest-page" }),
      });
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center space-y-2">
        <div className="text-lg font-medium">Thank you</div>
        <p className="text-sm text-muted-foreground">Your suggestion has been submitted. Every one is read.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5" htmlFor="tool-name">Tool name or short description</label>
        <input id="tool-name" name="toolName" required placeholder="e.g. CSS Flexbox Generator"
          className="w-full rounded-md border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5" htmlFor="tool-desc">What should it do?</label>
        <textarea id="tool-desc" name="comment" rows={4} placeholder="Describe the inputs, outputs, and why it would be useful…"
          className="w-full rounded-md border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring resize-none" />
      </div>
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5" htmlFor="contact">Your email (optional)</label>
        <input id="contact" name="contact" type="email" placeholder="you@example.com"
          className="w-full rounded-md border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <button type="submit"
        className="w-full px-4 py-2.5 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity">
        Submit Suggestion
      </button>
    </form>
  );
}
