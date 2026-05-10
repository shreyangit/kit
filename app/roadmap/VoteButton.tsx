"use client";

export function VoteButton({ id }: { id: string }) {
  return (
    <button
      data-vote-id={id}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
      onClick={(e) => {
        const el = e.currentTarget;
        const key = `roadmap-votes:${id}`;
        if (localStorage.getItem(key)) {
          el.textContent = "Voted";
          el.disabled = true;
          return;
        }
        localStorage.setItem(key, "1");
        el.textContent = "Voted!";
        el.disabled = true;
      }}
    >
      Vote
    </button>
  );
}
