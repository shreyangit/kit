import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to kit — Extension Installed",
  description:
    "You've installed the kit Chrome Extension. 110 instant browser tools now live in your toolbar.",
};

const features = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M8 13h.01M12 13h.01M16 13h.01M7 17h10"/>
      </svg>
    ),
    title: "Keyboard shortcut",
    desc: "Press Alt+Shift+T anywhere to open the popup instantly.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    ),
    title: "Right-click menus",
    desc: "Select text, right-click an image, or a link to get context-aware tools.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: "Inline tools",
    desc: "Password gen, Base64, JSON formatter, regex tester — no new tab needed.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
    ),
    title: "Universal search",
    desc: "Search all 110 tools from the popup with Alt+Shift+S.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    title: "100% private",
    desc: "Nothing ever leaves your browser. No accounts, no uploads, no tracking.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2"/>
        <path d="M12 18h.01"/>
      </svg>
    ),
    title: "Context-aware",
    desc: "On an image page? Image tools surface first. On GitHub? Code tools appear.",
  },
];

const quickTools = [
  { id: "password-generator", label: "Password Generator" },
  { id: "json-formatter",     label: "JSON Formatter" },
  { id: "base64",             label: "Base64 Encode/Decode" },
  { id: "regex-tester",       label: "Regex Tester" },
  { id: "qr-code",            label: "QR Code" },
  { id: "color-converter",    label: "Colour Converter" },
  { id: "background-remover", label: "Background Remover" },
  { id: "hash-generator",     label: "Hash Generator" },
];

export default function WelcomePage() {
  return (
    <>
      <style>{`
        .wp {
          max-width: 720px;
          margin: 0 auto;
          padding: 5rem 1.5rem 7rem;
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }

        /* ── Hero ── */
        .wp-hero {
          text-align: center;
          padding-bottom: 3.5rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 3.5rem;
        }
        .wp-badge {
          display: inline-block;
          padding: .25rem .75rem;
          border-radius: 99px;
          font-size: .7rem;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          background: var(--secondary);
          border: 1px solid var(--border);
          color: var(--muted-foreground);
          margin-bottom: 1.5rem;
        }
        .wp-h1 {
          font-size: clamp(1.9rem, 5vw, 3rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -.03em;
          color: var(--foreground);
          margin: 0 0 1rem;
        }
        .wp-h1 span {
          color: var(--primary);
          border-bottom: 2px solid var(--border);
          padding-bottom: 1px;
        }
        .wp-sub {
          font-size: 1rem;
          color: var(--muted-foreground);
          max-width: 480px;
          margin: 0 auto 2rem;
          line-height: 1.65;
        }
        .wp-sub kbd {
          display: inline-block;
          padding: .1em .4em;
          border-radius: 4px;
          font-size: .82em;
          font-family: var(--font-geist-mono), monospace;
          background: var(--secondary);
          border: 1px solid var(--border);
          color: var(--foreground);
        }
        .wp-cta {
          display: inline-block;
          padding: .65rem 1.6rem;
          border-radius: 6px;
          font-size: .88rem;
          font-weight: 600;
          background: var(--primary);
          color: var(--primary-foreground);
          text-decoration: none;
          transition: opacity .15s;
          letter-spacing: -.01em;
        }
        .wp-cta:hover { opacity: .85; }

        /* ── Section titles ── */
        .wp-section { margin-bottom: 3rem; }
        .wp-section-label {
          font-size: .7rem;
          font-weight: 600;
          color: var(--muted-foreground);
          letter-spacing: .1em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        /* ── Feature grid ── */
        .wp-feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .wp-feature-card {
          background: var(--background);
          padding: 1.2rem;
          transition: background .15s;
        }
        .wp-feature-card:hover { background: var(--secondary); }
        .wp-feature-icon {
          display: block;
          margin-bottom: .6rem;
          color: var(--muted-foreground);
        }
        .wp-feature-title {
          font-size: .85rem;
          font-weight: 600;
          color: var(--foreground);
          margin: 0 0 .3rem;
        }
        .wp-feature-desc {
          font-size: .78rem;
          color: var(--muted-foreground);
          line-height: 1.55;
          margin: 0;
        }

        /* ── Quick-start chips ── */
        .wp-chips { display: flex; flex-wrap: wrap; gap: .45rem; }
        .wp-chip {
          display: inline-flex;
          align-items: center;
          padding: .45rem .9rem;
          border-radius: 6px;
          font-size: .82rem;
          font-weight: 500;
          color: var(--secondary-foreground);
          background: var(--secondary);
          border: 1px solid var(--border);
          text-decoration: none;
          transition: background .12s, border-color .12s, color .12s;
          letter-spacing: -.01em;
        }
        .wp-chip:hover {
          background: var(--accent);
          color: var(--accent-foreground);
          border-color: var(--accent);
        }

        /* ── Tip ── */
        .wp-tip {
          display: flex;
          gap: .9rem;
          align-items: flex-start;
          padding: 1rem 1.2rem;
          border-radius: 8px;
          background: var(--secondary);
          border: 1px solid var(--border);
        }
        .wp-tip-icon { flex-shrink: 0; margin-top: .1rem; color: var(--muted-foreground); }
        .wp-tip strong {
          display: block;
          color: var(--foreground);
          font-size: .85rem;
          margin-bottom: .2rem;
        }
        .wp-tip p { margin: 0; font-size: .78rem; color: var(--muted-foreground); line-height: 1.55; }

        @media (max-width: 520px) {
          .wp { padding: 3rem 1rem 5rem; }
          .wp-feature-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wp">
        {/* Hero */}
        <section className="wp-hero">
          <div className="wp-badge">Extension installed</div>
          <h1 className="wp-h1">
            You now have <span>110 tools</span>
            <br />in your toolbar.
          </h1>
          <p className="wp-sub">
            kit is open. Right-click anything on any page to get started,
            or press <kbd>Alt+Shift+T</kbd> to open the popup.
          </p>
          <a href="/" className="wp-cta">Browse all tools</a>
        </section>

        {/* Features */}
        <section className="wp-section">
          <p className="wp-section-label">What you can do now</p>
          <div className="wp-feature-grid">
            {features.map((f) => (
              <div key={f.title} className="wp-feature-card">
                <span className="wp-feature-icon">{f.icon}</span>
                <h3 className="wp-feature-title">{f.title}</h3>
                <p className="wp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick-start */}
        <section className="wp-section">
          <p className="wp-section-label">Start with a tool</p>
          <div className="wp-chips">
            {quickTools.map((t) => (
              <a key={t.id} href={`/tools/${t.id}`} className="wp-chip">
                {t.label}
              </a>
            ))}
          </div>
        </section>

        {/* Tip */}
        <div className="wp-tip">
          <span className="wp-tip-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8h.01M11 12h1v4h1"/>
            </svg>
          </span>
          <div>
            <strong>Pro tip — pin it</strong>
            <p>Click the extensions icon in Chrome&apos;s toolbar, find <em>kit</em>, and pin it so it&apos;s always one click away.</p>
          </div>
        </div>
      </div>
    </>
  );
}
