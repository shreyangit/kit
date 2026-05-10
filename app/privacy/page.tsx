import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — kit",
  description:
    "kit processes everything locally in your browser. No uploads, no accounts, no tracking. Read our full privacy policy.",
};

const LAST_UPDATED = "10 May 2025";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Privacy Policy
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
          Your data never leaves your device.
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Last updated {LAST_UPDATED}. This policy applies to{" "}
          <span className="text-foreground font-medium">kit.shreyannarula.com</span>{" "}
          and the <span className="text-foreground font-medium">kit Chrome Extension</span>.
        </p>
      </div>

      <div className="space-y-10 text-sm leading-relaxed">

        <Section title="The short version">
          <p>
            kit is a collection of browser-based utilities. Every tool — image
            compression, background removal, JSON formatting, password
            generation, PDF merging, and all others — runs entirely inside your
            browser using standard Web APIs and WebAssembly. <strong className="text-foreground">No file, image,
            or piece of text you process is ever sent to any server.</strong> We do
            not have a processing backend. We could not see your data even if
            we wanted to.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="space-y-3 list-none">
            <Li label="Nothing you process">
              Files, images, text, passwords, code — every input you provide to
              any kit tool is processed locally and discarded when you close or
              navigate away from the page. It is never transmitted.
            </Li>
            <Li label="Anonymous usage analytics (website only)">
              The website uses{" "}
              <a
                href="https://plausible.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                Plausible Analytics
              </a>
              , a privacy-first analytics service. Plausible does not use cookies,
              does not collect personal data, and does not track individuals across
              sessions or sites. The only data recorded is page views and
              general country-level location. No IP address is stored.
            </Li>
            <Li label="Recently used tools (extension only)">
              The Chrome Extension stores a list of your recently used tool IDs in
              Chrome&apos;s local storage (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">chrome.storage.local</code>). This
              data never leaves your device and can be cleared at any time by
              removing the extension or clearing extension storage.
            </Li>
          </ul>
        </Section>

        <Section title="What we do NOT collect">
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "Your name or email address",
              "Your IP address",
              "Files or images you process",
              "Passwords you generate",
              "Text or code you enter into tools",
              "Browsing history",
              "Device identifiers",
              "Cookies (website uses none)",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-secondary border border-border text-xs text-foreground"
              >
                <span className="text-muted-foreground shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </span>
                {item}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Third-party services">
          <ul className="space-y-3 list-none">
            <Li label="Plausible Analytics">
              Website analytics only. No cookies, no personal data. See{" "}
              <a href="https://plausible.io/privacy" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2">
                plausible.io/privacy
              </a>.
            </Li>
            <Li label="AI model CDN (extension background removal only)">
              The Background Remover tool uses the open-source{" "}
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">@imgly/background-removal</code>{" "}
              library. The AI model weight files (binary data, ~50 MB) are
              fetched once from a static CDN (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">staticimgly.com</code>) and
              cached locally in your browser. Your images are never sent to
              this CDN — only the model weights are downloaded, the same way a
              website downloads a font file.
            </Li>
            <Li label="Cloudflare Pages">
              The website is hosted on Cloudflare Pages. Cloudflare processes
              HTTP requests and may log anonymous request metadata (IP, country)
              per their own{" "}
              <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2">
                privacy policy
              </a>
              . We do not have access to this data.
            </Li>
          </ul>
        </Section>

        <Section title="Chrome Extension permissions">
          <p className="mb-4">The extension requests the following permissions and uses them exclusively as described:</p>
          <div className="space-y-2">
            {[
              ["contextMenus", "Adds right-click menu options on images, text, and links."],
              ["activeTab", "Reads the current page URL to detect context and surface relevant tools."],
              ["storage", "Stores your recently used tool IDs locally on your device."],
              ["scripting", "Injects a lightweight script to detect page context (image page, code page, etc.)."],
              ["notifications", "Shows a notification when a long operation (e.g. background removal) finishes."],
              ["sidePanel", "Lets the extension open as a persistent Chrome Side Panel."],
              ["clipboardRead", "Reads clipboard text only when you click a tool that pre-fills from clipboard."],
              ["clipboardWrite", "Copies output to clipboard when you click a Copy button."],
              ["offscreen", "Runs Canvas operations (image processing) in an offscreen context."],
            ].map(([perm, desc]) => (
              <div key={perm} className="flex gap-3 text-xs">
                <code className="shrink-0 bg-secondary border border-border rounded px-2 py-1 text-foreground font-mono leading-tight">
                  {perm}
                </code>
                <span className="text-muted-foreground leading-relaxed pt-1">{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Data retention">
          <p>
            We retain no user data. The only persistent data associated with
            kit is the anonymous page-view count in Plausible (no personal
            identifier) and the list of recently used tools stored in your
            browser&apos;s local storage.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Because we do not collect personal data, there is nothing to
            access, correct, or delete on our end. To remove the locally stored
            recently-used list, uninstall the Chrome Extension or clear its
            storage via{" "}
            <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">
              chrome://extensions → kit → Storage → Clear
            </code>
            .
          </p>
        </Section>

        <Section title="Children">
          <p>
            kit does not knowingly collect any data from anyone, including
            children under 13. No account creation is required or possible.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make material changes, we will update the date at the top of
            this page. Continued use of kit after any change constitutes
            acceptance of the updated policy.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy?{" "}
            <a href="/feedback" className="text-foreground underline underline-offset-2">
              Send us a message
            </a>{" "}
            or email{" "}
            <a href="mailto:hi@shreyannarula.com" className="text-foreground underline underline-offset-2">
              hi@shreyannarula.com
            </a>
            .
          </p>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">
        {title}
      </h2>
      <div className="text-muted-foreground">{children}</div>
    </section>
  );
}

function Li({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li>
      <span className="font-medium text-foreground">{label} — </span>
      {children}
    </li>
  );
}
