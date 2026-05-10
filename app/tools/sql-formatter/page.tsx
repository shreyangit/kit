import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import { SqlFormatterTool } from "./SqlFormatterTool";
export const metadata: Metadata = {
  title: "SQL Formatter",
  description: "Format and beautify SQL queries. Supports PostgreSQL, MySQL, SQLite, BigQuery, and T-SQL with proper indentation and uppercase keywords.",
  alternates: { canonical: "https://kit.shreyannarula.com/tools/sql-formatter" },
};
export default function Page() {
  return <ToolShell toolId="sql-formatter"><SqlFormatterTool /></ToolShell>;
}
