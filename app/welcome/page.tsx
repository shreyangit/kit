import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to kit — Extension Installed",
  description:
    "You've installed the kit Chrome Extension. 110 instant browser tools now live in your toolbar — right-click menus, inline runners, and one-click access to every tool.",
};

// All icons are inline SVG — zero emoji anywhere on this page
const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M8 13h.01M12 13h.01M16 13h.01M7 17h10"/>
      </svg>
    ),
    title: "Keyboard shortcut",
    desc: "Press Alt+Shift+T anywhere to open the popup instantly.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 12h16M4 18h7"/>
        <circle cx="19" cy="18" r="3"/>
        <path d="M19 15v3l2 1"/>
      </svg>
    ),
    title: "Right-click menus",
    desc: "Select text, right-click an image, or right-click a link to get context-aware tools.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: "Inline tools",
    desc: "Password gen, Base64, JSON formatter, regex tester, QR code — no new tab needed.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
    ),
    title: "Universal search",
    desc: "Search all 110 tools from the popup with Alt+Shift+S.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    title: "100% private",
    desc: "Nothing ever leaves your browser. No accounts, no uploads, no tracking.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="welcome-page">
      {/* Hero */}
      <section className="hero">
        <div className="badge">Extension installed</div>
        <h1 className="headline">
          You now have <span className="accent">110 tools</span>
          <br />in your toolbar.
        </h1>
        <p className="sub">
          kit is open. Right-click anything on any page to get started,
          or press <kbd>Alt+Shift+T</kbd> to open the popup.
        </p>
        <a href="/" className="cta-btn">Browse all tools</a>
      </section>

      {/* Feature Grid */}
      <section className="features">
        <h2 className="section-title">What you can do now</h2>
        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick-Start */}
      <section className="quick-start">
        <h2 className="section-title">Start with a tool</h2>
        <div className="tool-grid">
          {quickTools.map((t) => (
            <a key={t.id} href={`/tools/${t.id}`} className="tool-chip">
              {t.label}
            </a>
          ))}
        </div>
      </section>

      {/* Tip */}
      <section className="tip-section">
        <div className="tip-card">
          <span className="tip-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8h.01M11 12h1v4h1"/>
            </svg>
          </span>
          <div>
            <strong>Pro tip — pin it</strong>
            <p>Click the extensions icon in Chrome&apos;s toolbar, find <em>kit</em>, and pin it so it&apos;s always one click away.</p>
          </div>
        </div>
      </section>

      <style>{`
        .welcome-page {
          max-width: 860px;
          margin: 0 auto;
          padding: 3rem 1.5rem 6rem;
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }

        .hero {
          text-align: center;
          padding: 4rem 0 3rem;
          border-bottom: 1px solid hsl(0 0% 100% / .07);
          margin-bottom: 3.5rem;
        }
        .badge {
          display: inline-block;
          padding: .3rem .8rem;
          border-radius: 99px;
          font-size: .72rem;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          background: hsl(0 0% 100% / .06);
          border: 1px solid hsl(0 0% 100% / .12);
          color: hsl(0 0% 65%);
          margin-bottom: 1.4rem;
        }
        .headline {
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -.03em;
          color: hsl(0 0% 95%);
          margin: 0 0 1.1rem;
        }
        .accent {
          color: hsl(0 0% 100%);
          border-bottom: 2px solid hsl(0 0% 100% / .35);
        }
        .sub {
          font-size: 1.05rem;
          color: hsl(0 0% 58%);
          max-width: 520px;
          margin: 0 auto 2rem;
          line-height: 1.65;
        }
        kbd {
          display: inline-block;
          padding: .1em .45em;
          border-radius: 4px;
          font-size: .85em;
          font-family: var(--font-geist-mono), monospace;
          background: hsl(0 0% 100% / .07);
          border: 1px solid hsl(0 0% 100% / .15);
          color: hsl(0 0% 85%);
        }
        .cta-btn {
          display: inline-block;
          padding: .7rem 1.8rem;
          border-radius: 8px;
          font-size: .92rem;
          font-weight: 600;
          background: hsl(0 0% 97%);
          color: hsl(0 0% 5%);
          text-decoration: none;
          transition: opacity .15s;
          letter-spacing: -.01em;
        }
        .cta-btn:hover { opacity: .85; }

        .section-title {
          font-size: .75rem;
          font-weight: 600;
          color: hsl(0 0% 50%);
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 1.2rem;
        }

        .features { margin-bottom: 3.5rem; }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1px;
          border: 1px solid hsl(0 0% 100% / .07);
          border-radius: 12px;
          overflow: hidden;
          background: hsl(0 0% 100% / .07);
        }
        .feature-card {
          padding: 1.4rem;
          background: hsl(0 0% 8%);
          transition: background .2s;
        }
        .feature-card:hover { background: hsl(0 0% 10%); }
        .feature-icon {
          display: block;
          margin-bottom: .75rem;
          color: hsl(0 0% 60%);
        }
        .feature-title {
          font-size: .9rem;
          font-weight: 600;
          color: hsl(0 0% 90%);
          margin: 0 0 .35rem;
        }
        .feature-desc {
          font-size: .82rem;
          color: hsl(0 0% 50%);
          line-height: 1.55;
          margin: 0;
        }

        .quick-start { margin-bottom: 3rem; }
        .tool-grid { display: flex; flex-wrap: wrap; gap: .5rem; }
        .tool-chip {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          padding: .5rem 1rem;
          border-radius: 6px;
          font-size: .84rem;
          font-weight: 500;
          color: hsl(0 0% 72%);
          background: hsl(0 0% 100% / .04);
          border: 1px solid hsl(0 0% 100% / .09);
          text-decoration: none;
          transition: background .15s, border-color .15s, color .15s;
          letter-spacing: -.01em;
        }
        .tool-chip:hover {
          background: hsl(0 0% 100% / .09);
          border-color: hsl(0 0% 100% / .18);
          color: hsl(0 0% 95%);
        }

        .tip-section { margin-bottom: 2rem; }
        .tip-card {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1.1rem 1.4rem;
          border-radius: 10px;
          background: hsl(0 0% 100% / .03);
          border: 1px solid hsl(0 0% 100% / .08);
        }
        .tip-icon { flex-shrink: 0; margin-top: .15rem; color: hsl(0 0% 55%); }
        .tip-card strong {
          display: block;
          color: hsl(0 0% 85%);
          font-size: .88rem;
          margin-bottom: .25rem;
        }
        .tip-card p { margin: 0; font-size: .82rem; color: hsl(0 0% 52%); line-height: 1.55; }

        @media (max-width: 540px) {
          .hero { padding: 2.5rem 0 2rem; }
          .feature-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
