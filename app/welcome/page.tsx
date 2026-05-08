import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to kit — Extension Installed",
  description:
    "You've installed the kit Chrome Extension. 60 instant browser tools now live in your toolbar — right-click menus, inline runners, and one-click access to every tool.",
};

const features = [
  {
    icon: "⌨️",
    title: "Keyboard shortcut",
    desc: "Press Alt+Shift+T anywhere to open the popup instantly.",
  },
  {
    icon: "🖱️",
    title: "Right-click menus",
    desc: "Select text, right-click an image, or right-click a link to get context-aware tools.",
  },
  {
    icon: "⚡",
    title: "21 inline tools",
    desc: "Password gen, Base64, JSON formatter, regex tester, QR code — no new tab needed.",
  },
  {
    icon: "🔍",
    title: "Universal search",
    desc: "Search all 60 tools from the popup with Alt+Shift+S.",
  },
  {
    icon: "🧠",
    title: "Context-aware",
    desc: "On an image page? Image tools float up. On GitHub? Code tools appear.",
  },
  {
    icon: "🔒",
    title: "100% private",
    desc: "Nothing ever leaves your browser. No accounts, no uploads, no tracking.",
  },
];

const quickTools = [
  { id: "password-generator",   label: "Password Generator",  emoji: "🔑" },
  { id: "json-formatter",       label: "JSON Formatter",       emoji: "📋" },
  { id: "base64",               label: "Base64 Encode/Decode", emoji: "🔡" },
  { id: "regex-tester",         label: "Regex Tester",         emoji: "🧪" },
  { id: "qr-code-generator",    label: "QR Code",              emoji: "📱" },
  { id: "color-converter",      label: "Colour Converter",     emoji: "🎨" },
];

export default function WelcomePage() {
  return (
    <div className="welcome-page">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="badge">Extension installed ✓</div>
        <h1 className="headline">
          You now have <span className="accent">60 tools</span>
          <br />in your toolbar.
        </h1>
        <p className="sub">
          kit is open. Right-click anything on any page to get started,
          or press <kbd>Alt+Shift+T</kbd> to open the popup.
        </p>
        <a href="/" className="cta-btn">Browse all tools →</a>
      </section>

      {/* ── Feature Grid ── */}
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

      {/* ── Quick-Start ── */}
      <section className="quick-start">
        <h2 className="section-title">Start with a tool</h2>
        <div className="tool-grid">
          {quickTools.map((t) => (
            <a
              key={t.id}
              href={`/tools/${t.id}`}
              className="tool-chip"
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Tip ── */}
      <section className="tip-section">
        <div className="tip-card">
          <span className="tip-icon">💡</span>
          <div>
            <strong>Pro tip — pin it</strong>
            <p>Click the puzzle piece 🧩 in Chrome's toolbar, find <em>kit</em>, and pin it so it's always one click away.</p>
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

        /* ── Hero ── */
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
          font-size: .75rem;
          font-weight: 600;
          letter-spacing: .06em;
          text-transform: uppercase;
          background: hsl(0 0% 100% / .06);
          border: 1px solid hsl(0 0% 100% / .12);
          color: hsl(0 0% 80%);
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
          border-bottom: 2px solid hsl(0 0% 100% / .4);
        }
        .sub {
          font-size: 1.05rem;
          color: hsl(0 0% 60%);
          max-width: 520px;
          margin: 0 auto 2rem;
          line-height: 1.6;
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
          padding: .7rem 1.6rem;
          border-radius: 8px;
          font-size: .95rem;
          font-weight: 600;
          background: hsl(0 0% 97%);
          color: hsl(0 0% 5%);
          text-decoration: none;
          transition: opacity .15s;
        }
        .cta-btn:hover { opacity: .88; }

        /* ── Section titles ── */
        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: hsl(0 0% 70%);
          letter-spacing: .04em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        /* ── Feature grid ── */
        .features { margin-bottom: 3.5rem; }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
        }
        .feature-card {
          padding: 1.3rem;
          border-radius: 10px;
          background: hsl(0 0% 100% / .03);
          border: 1px solid hsl(0 0% 100% / .07);
          transition: border-color .2s;
        }
        .feature-card:hover { border-color: hsl(0 0% 100% / .15); }
        .feature-icon { font-size: 1.4rem; display: block; margin-bottom: .6rem; }
        .feature-title {
          font-size: .95rem;
          font-weight: 600;
          color: hsl(0 0% 90%);
          margin: 0 0 .35rem;
        }
        .feature-desc {
          font-size: .85rem;
          color: hsl(0 0% 55%);
          line-height: 1.5;
          margin: 0;
        }

        /* ── Quick-start ── */
        .quick-start { margin-bottom: 3rem; }
        .tool-grid {
          display: flex;
          flex-wrap: wrap;
          gap: .65rem;
        }
        .tool-chip {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          padding: .55rem 1rem;
          border-radius: 8px;
          font-size: .88rem;
          font-weight: 500;
          color: hsl(0 0% 80%);
          background: hsl(0 0% 100% / .04);
          border: 1px solid hsl(0 0% 100% / .09);
          text-decoration: none;
          transition: background .15s, border-color .15s, color .15s;
        }
        .tool-chip:hover {
          background: hsl(0 0% 100% / .08);
          border-color: hsl(0 0% 100% / .18);
          color: hsl(0 0% 95%);
        }

        /* ── Tip ── */
        .tip-section { margin-bottom: 2rem; }
        .tip-card {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1.2rem 1.4rem;
          border-radius: 10px;
          background: hsl(45 100% 55% / .06);
          border: 1px solid hsl(45 100% 55% / .18);
        }
        .tip-icon { font-size: 1.3rem; flex-shrink: 0; margin-top: .05rem; }
        .tip-card strong {
          display: block;
          color: hsl(45 100% 75%);
          font-size: .9rem;
          margin-bottom: .25rem;
        }
        .tip-card p { margin: 0; font-size: .85rem; color: hsl(0 0% 60%); line-height: 1.5; }

        @media (max-width: 540px) {
          .hero { padding: 2.5rem 0 2rem; }
          .feature-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
