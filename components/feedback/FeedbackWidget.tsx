"use client";

import * as React from "react";

interface Props {
  toolId: string;
}

export function FeedbackWidget({ toolId }: Props) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<"rate" | "comment" | "done">("rate");
  const [rating, setRating] = React.useState<number | null>(null);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Don't show if already submitted for this tool this session
  const storageKey = `feedback-sent:${toolId}`;
  const [alreadySent, setAlreadySent] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(storageKey)) {
      setAlreadySent(true);
    }
  }, [storageKey]);

  if (alreadySent) return null;

  async function submit() {
    if (!rating) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, rating, comment: comment.trim(), type: "rating" }),
      });
      sessionStorage.setItem(storageKey, "1");
      setStep("done");
    } catch {
      // silently fail — never block user
    }
    setSubmitting(false);
  }

  if (!open) {
    return (
      <div className="fixed bottom-5 right-5 z-40">
        <button
          id="feedback-widget-trigger"
          onClick={() => setOpen(true)}
          aria-label="Give feedback on this tool"
          className="h-9 px-3 rounded-full border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 shadow-sm transition-all hover:shadow-md"
        >
          Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-72 rounded-xl border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium">How useful was this tool?</span>
        <button onClick={() => setOpen(false)} aria-label="Close feedback" className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">×</button>
      </div>

      {step === "rate" && (
        <div className="p-4 space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} stars`}
                className={`text-2xl transition-transform hover:scale-110 ${rating !== null && star <= rating ? "opacity-100" : "opacity-30"}`}
              >
                ★
              </button>
            ))}
          </div>
          {rating !== null && (
            <button
              onClick={() => setStep("comment")}
              className="w-full px-3 py-1.5 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              Next
            </button>
          )}
        </div>
      )}

      {step === "comment" && (
        <div className="p-4 space-y-3">
          <textarea
            className="w-full h-24 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring resize-none"
            placeholder="Any suggestions? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 px-3 py-1.5 rounded-md text-sm font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? "Sending…" : "Submit"}
            </button>
            <button onClick={() => { setStep("rate"); setRating(null); }} className="px-3 py-1.5 rounded-md text-sm border border-border hover:border-foreground/30 transition-colors">
              Back
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="p-4 text-center space-y-2">
          <div className="text-lg">Thank you</div>
          <p className="text-xs text-muted-foreground">Your feedback helps improve this tool.</p>
          <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">Close</button>
        </div>
      )}
    </div>
  );
}
