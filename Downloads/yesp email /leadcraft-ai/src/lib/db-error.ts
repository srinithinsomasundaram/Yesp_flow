/**
 * Logs a Supabase PostgrestError in a readable format.
 * PostgrestError objects don't enumerate their properties, so console.error(error) prints {}.
 */
export function dbLog(context: string, error: any): void {
  if (!error) return;

  const code: string = error?.code ?? "";
  const message: string = error?.message ?? "Unknown error";
  const details: string = error?.details ?? "";
  const hint: string = error?.hint ?? "";

  // Table / relation does not exist — migration hasn't been run yet
  if (code === "42P01") {
    console.warn(
      `[DB] ${context}: table not found — run migration.sql in Supabase SQL editor. (${message})`
    );
    return;
  }

  const parts = [`[DB] ${context}: [${code}] ${message}`];
  if (details) parts.push(`details: ${details}`);
  if (hint) parts.push(`hint: ${hint}`);
  console.error(parts.join(" | "));
}
