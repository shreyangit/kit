"use client";
import * as React from "react";

export function NewsletterForm() {
  const [submitted, setSubmitted] = React.useState(false);
  const [email, setEmail] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: "newsletter", type: "newsletter", contact: email }),
      });
    } catch { /* silently fail */ }
    setSubmitted(true);
  }

  if (submitted) {
    return <p className="text-sm text-foreground">You&apos;re subscribed. New tools drop every week.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2 max-w-sm">
      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
        className="flex-1 rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring" />
      <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity">
        Subscribe
      </button>
    </form>
  );
}
