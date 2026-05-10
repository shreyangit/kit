"use client";
import * as React from "react";

async function formatGraphQL(schema: string): Promise<string> {
  const { parse, print } = await import('graphql');
  return print(parse(schema));
}

const EXAMPLE = `type Query {
  user(id: ID!): User
  users(limit: Int = 10 offset: Int = 0): [User!]!
}
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  createdAt: String!
}
type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  published: Boolean!
}
type Mutation {
  createUser(name: String! email: String!): User!
  updateUser(id: ID! name: String email: String): User
  deleteUser(id: ID!): Boolean!
}`;

export function GraphqlFormatterTool() {
  const [input, setInput] = React.useState(EXAMPLE);
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    setLoading(true);
    formatGraphQL(input).then(r => { setOutput(r); setError(''); }).catch(e => { setError((e as Error).message); setOutput(''); }).finally(() => setLoading(false));
  }, [input]);

  const copy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">GraphQL Schema / Query</label>
          <textarea className="w-full h-80 rounded-md border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-none"
            value={input} onChange={e => setInput(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">Formatted output</label>
            {output && <button onClick={copy} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{copied ? 'Copied!' : 'Copy'}</button>}
          </div>
          {error ? (
            <div className="h-80 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400 font-mono overflow-auto">{error}</div>
          ) : loading ? (
            <div className="h-80 rounded-md border bg-card flex items-center justify-center text-xs text-muted-foreground">Formatting…</div>
          ) : (
            <pre className="h-80 rounded-md border bg-card px-3 py-2 font-mono text-xs overflow-auto">{output}</pre>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Parses and re-prints GraphQL SDL using the official <code>graphql</code> package. Also works on queries and fragments.</p>
    </div>
  );
}
