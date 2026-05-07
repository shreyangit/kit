export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-auto">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Shreyan Narula. All tools run in your browser — nothing is uploaded.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <a
            href="https://shreyannarula.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Portfolio
          </a>
          <a
            href="https://github.com/shreyangit"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
