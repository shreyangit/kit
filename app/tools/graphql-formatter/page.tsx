import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { GraphqlFormatterTool } from "./GraphqlFormatterTool";
export const metadata: Metadata = {
  title: "GraphQL Schema Formatter",
  description: "Format and validate GraphQL SDL schemas, queries, mutations, and fragments using the official graphql package.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/graphql-formatter" },
};
export default function Page() {
  return <ToolShell toolId="graphql-formatter"><GraphqlFormatterTool /></ToolShell>;
}
