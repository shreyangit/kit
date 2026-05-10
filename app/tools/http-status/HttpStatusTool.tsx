"use client";
import * as React from "react";

const HTTP_STATUSES = [
  // 1xx
  { code: 100, name: 'Continue', cat: '1xx', desc: 'The server has received the request headers and the client should proceed.', use: 'Large file uploads — client checks if server is ready before sending body.' },
  { code: 101, name: 'Switching Protocols', cat: '1xx', desc: 'Server agrees to switch protocols requested by client.', use: 'WebSocket upgrade: HTTP → WS handshake.' },
  { code: 102, name: 'Processing', cat: '1xx', desc: 'Server has received and is processing the request; no response yet.', use: 'Long-running WebDAV operations.' },
  // 2xx
  { code: 200, name: 'OK', cat: '2xx', desc: 'Request succeeded.', use: 'Standard successful GET, POST, PUT, DELETE responses.' },
  { code: 201, name: 'Created', cat: '2xx', desc: 'Request succeeded and a new resource was created.', use: 'POST to create a new user, order, or record.' },
  { code: 202, name: 'Accepted', cat: '2xx', desc: 'Request accepted but processing not yet complete.', use: 'Async jobs — email queued, background task started.' },
  { code: 204, name: 'No Content', cat: '2xx', desc: 'Request succeeded, no body returned.', use: 'DELETE and PUT that return no data.' },
  { code: 206, name: 'Partial Content', cat: '2xx', desc: 'Server fulfils partial GET (Range header).', use: 'Video streaming, download resumption.' },
  // 3xx
  { code: 301, name: 'Moved Permanently', cat: '3xx', desc: 'Resource permanently moved to a new URL.', use: 'Domain migrations, URL restructuring. Browsers cache this.' },
  { code: 302, name: 'Found', cat: '3xx', desc: 'Temporary redirect.', use: 'Temporarily redirect after login/logout.' },
  { code: 304, name: 'Not Modified', cat: '3xx', desc: 'Cached version is still valid.', use: 'ETag/Last-Modified caching — avoid re-downloading unchanged resources.' },
  { code: 307, name: 'Temporary Redirect', cat: '3xx', desc: 'Temporary redirect preserving HTTP method.', use: 'Like 302 but guarantees POST stays POST (not converted to GET).' },
  { code: 308, name: 'Permanent Redirect', cat: '3xx', desc: 'Permanent redirect preserving HTTP method.', use: 'Like 301 but POST stays POST.' },
  // 4xx
  { code: 400, name: 'Bad Request', cat: '4xx', desc: 'Server cannot process due to client error.', use: 'Malformed JSON, missing required fields, invalid parameters.' },
  { code: 401, name: 'Unauthorized', cat: '4xx', desc: 'Authentication required.', use: 'Missing or invalid auth token. Client must authenticate.' },
  { code: 403, name: 'Forbidden', cat: '4xx', desc: 'Server understood but refuses to authorize.', use: 'Authenticated but lacks permission. Different from 401.' },
  { code: 404, name: 'Not Found', cat: '4xx', desc: 'Resource not found.', use: 'URL does not exist. Also used to hide existence of protected resources.' },
  { code: 405, name: 'Method Not Allowed', cat: '4xx', desc: 'HTTP method not supported for this resource.', use: 'POST to a read-only endpoint, DELETE on non-deletable resource.' },
  { code: 409, name: 'Conflict', cat: '4xx', desc: 'Request conflicts with current state.', use: 'Duplicate email on signup, optimistic locking conflicts.' },
  { code: 410, name: 'Gone', cat: '4xx', desc: 'Resource permanently deleted.', use: 'Like 404 but permanent — tells crawlers to remove from index.' },
  { code: 422, name: 'Unprocessable Entity', cat: '4xx', desc: 'Request understood but semantic errors prevent processing.', use: 'Validation errors on a form submission.' },
  { code: 429, name: 'Too Many Requests', cat: '4xx', desc: 'Rate limit exceeded.', use: 'API rate limiting. Usually includes Retry-After header.' },
  // 5xx
  { code: 500, name: 'Internal Server Error', cat: '5xx', desc: 'Generic server-side error.', use: 'Unhandled exception, database crash, server bug.' },
  { code: 501, name: 'Not Implemented', cat: '5xx', desc: 'Server does not support the functionality.', use: 'HTTP method not implemented.' },
  { code: 502, name: 'Bad Gateway', cat: '5xx', desc: 'Upstream server returned invalid response.', use: 'Reverse proxy / load balancer got a bad response from upstream.' },
  { code: 503, name: 'Service Unavailable', cat: '5xx', desc: 'Server temporarily unable to handle request.', use: 'Maintenance mode, overload. Include Retry-After header.' },
  { code: 504, name: 'Gateway Timeout', cat: '5xx', desc: 'Upstream server timed out.', use: 'Backend service slow or unreachable.' },
];

const CAT_COLORS: Record<string, string> = {
  '1xx': '#60a5fa', '2xx': '#4ade80', '3xx': '#fbbf24', '4xx': '#f87171', '5xx': '#f472b6'
};

export function HttpStatusTool() {
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<typeof HTTP_STATUSES[0] | null>(null);
  const [catFilter, setCatFilter] = React.useState('all');

  const filtered = HTTP_STATUSES.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.code.toString().includes(q) || s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q);
    const matchCat = catFilter === 'all' || s.cat === catFilter;
    return matchQ && matchCat;
  });

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input className="flex-1 rounded-md border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          placeholder="Search code or name…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-1.5 flex-wrap">
          {['all','1xx','2xx','3xx','4xx','5xx'].map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${catFilter === cat ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground/30'}`}
              style={catFilter === cat || cat === 'all' ? {} : { borderColor: `${CAT_COLORS[cat]}44`, color: CAT_COLORS[cat] }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 gap-2">
        {filtered.map(s => (
          <button key={s.code} onClick={() => setSelected(selected?.code === s.code ? null : s)}
            className={`rounded-lg border p-3 text-left transition-colors ${selected?.code === s.code ? 'border-foreground/40 bg-foreground/5' : 'border-border bg-card hover:border-foreground/20'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-base" style={{ color: CAT_COLORS[s.cat] }}>{s.code}</span>
              <span className="text-sm font-medium truncate">{s.name}</span>
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: `${CAT_COLORS[s.cat]}22`, color: CAT_COLORS[s.cat] }}>{s.cat}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{s.desc}</p>
            {selected?.code === s.code && (
              <div className="mt-2 pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">When to use</div>
                <p className="text-xs">{s.use}</p>
              </div>
            )}
          </button>
        ))}
        {filtered.length === 0 && <div className="col-span-2 text-center text-muted-foreground text-sm py-8">No matching status codes found.</div>}
      </div>

      <div className="text-xs text-muted-foreground">Click any card to see usage guidance. {HTTP_STATUSES.length} codes total.</div>
    </div>
  );
}
