"use client";
import * as React from "react";

async function toMarkdown(html: string): Promise<string> {
  const TurndownService = (await import('turndown')).default;
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  return td.turndown(html);
}

const EXAMPLE_HTML = `<h1>Hello World</h1>
<p>This is a <strong>bold</strong> and <em>italic</em> paragraph with a <a href="https://example.com">link</a>.</p>
<ul>
  <li>Item one</li>
  <li>Item two</li>
  <li>Item three</li>
</ul>
<pre><code>const greeting = "hello";</code></pre>`;

export function HtmlToMarkdownTool() {
  const [input, setInput] = React.useState(EXAMPLE_HTML);
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    toMarkdown(input).then(md => { setOutput(md); setError(''); }).catch(e => setError((e as Error).message));
  }, [input]);

  const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">HTML input</label>
          <textarea className="w-full h-72 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
            value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">Markdown output</label>
            {output && <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied ? 'Copied!' : 'Copy'}</button>}
          </div>
          {error ? (
            <div className="h-72 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400 font-mono">{error}</div>
          ) : (
            <pre className="h-72 rounded-md border bg-card px-3 py-2 font-mono text-xs overflow-auto whitespace-pre-wrap">{output}</pre>
          )}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">Converts &lt;h1-h6&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;code&gt;, &lt;pre&gt;, &lt;blockquote&gt;, and more.</div>
    </div>
  );
}
