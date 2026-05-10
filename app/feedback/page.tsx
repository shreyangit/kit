"use client";

import * as React from "react";
import type { Metadata } from "next";

// Note: metadata export can't be used in "use client" components
// We export it from a separate layout or use generateMetadata — handled via layout below.

type FeedbackType = "bug" | "feature" | "tool" | "other";

const TYPES: { id: FeedbackType; label: string; desc: string }[] = [
  { id: "bug",     label: "Bug report",      desc: "Something is broken or not working as expected." },
  { id: "feature", label: "Feature request", desc: "A new tool or improvement you'd like to see." },
  { id: "tool",    label: "Missing tool",    desc: "A specific tool you wish kit had." },
  { id: "other",   label: "Other",           desc: "Anything else — question, praise, complaint." },
];

export default function FeedbackPage() {
  const [type, setType] = React.useState<FeedbackType>("feature");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setStatus("sending");
    try {
      // Opens mailto as fallback — replace with your preferred form backend
      const mailtoBody = encodeURIComponent(
        `Type: ${type}\n\n${body}${email ? `\n\nReply-to: ${email}` : ""}`
      );
      const mailto = `mailto:hi@shreyannarula.com?subject=${encodeURIComponent(
        `[kit feedback] ${subject || type}`
      )}&body=${mailtoBody}`;
      window.open(mailto, "_blank");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  const sent = status === "sent";

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-16 sm:py-24">

      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Feedback
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
          Tell us what to build next.
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bug, idea, missing tool, or just something that annoyed you — we read
          everything. No account needed.
        </p>
      </div>

      {sent ? (
        <div className="rounded-lg border border-border bg-secondary p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-foreground/8 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Your mail app is opening…</p>
          <p className="text-xs text-muted-foreground">
            We opened your default mail client with the message pre-filled. If it
            didn&apos;t open,{" "}
            <a href="mailto:hi@shreyannarula.com" className="text-foreground underline underline-offset-2">
              email us directly
            </a>
            .
          </p>
          <button
            onClick={() => { setStatus("idle"); setSubject(""); setBody(""); setEmail(""); }}
            className="mt-5 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={[
                    "text-left p-3 rounded-md border text-xs transition-colors",
                    type === t.id
                      ? "border-foreground bg-secondary text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-muted-foreground",
                  ].join(" ")}
                >
                  <div className="font-medium mb-0.5">{t.label}</div>
                  <div className="text-[11px] leading-tight opacity-70">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="fb-subject" className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Subject <span className="normal-case text-muted-foreground/60">(optional)</span>
            </label>
            <input
              id="fb-subject"
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Add a CSV splitter tool"
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-foreground/40 transition-colors"
            />
          </div>

          {/* Body */}
          <div>
            <label htmlFor="fb-body" className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Message <span className="text-destructive">*</span>
            </label>
            <textarea
              id="fb-body"
              value={body}
              onChange={e => setBody(e.target.value)}
              required
              rows={6}
              placeholder={
                type === "bug"
                  ? "Describe what happened, what you expected, and which tool it was on…"
                  : type === "feature"
                  ? "What would you like to see? The more specific, the better…"
                  : type === "tool"
                  ? "Which tool? What would it do? What format/library would it use?…"
                  : "Anything on your mind…"
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-foreground/40 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="fb-email" className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Your email <span className="normal-case text-muted-foreground/60">(optional — if you want a reply)</span>
            </label>
            <input
              id="fb-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-foreground/40 transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!body.trim() || status === "sending"}
            className="w-full rounded-md bg-foreground text-background py-2.5 text-sm font-semibold tracking-tight hover:opacity-85 active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {status === "sending" ? "Opening mail…" : "Send feedback"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Or email directly:{" "}
            <a href="mailto:hi@shreyannarula.com" className="text-foreground underline underline-offset-2">
              hi@shreyannarula.com
            </a>
          </p>

        </form>
      )}
    </div>
  );
}
