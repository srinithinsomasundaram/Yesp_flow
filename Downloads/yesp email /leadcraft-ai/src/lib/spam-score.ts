const SPAM_WORDS = [
  "free", "guaranteed", "winner", "prize", "congratulations", "urgent", "act now",
  "limited time", "click here", "buy now", "order now", "discount", "earn money",
  "extra income", "make money", "work from home", "cash", "100%", "risk free",
  "no obligation", "no cost", "incredible deal", "once in a lifetime",
  "special promotion", "lowest price", "best price", "unsubscribe",
];

export type SpamIssue = { severity: "error" | "warn"; text: string };

export function getSpamScore(subject: string, body: string): { score: number; issues: SpamIssue[] } {
  const issues: SpamIssue[] = [];
  const combined = `${subject} ${body}`.toLowerCase();
  const words = combined.split(/\s+/);

  // Spam trigger words
  const found = SPAM_WORDS.filter((w) => combined.includes(w));
  if (found.length >= 3) {
    issues.push({ severity: "error", text: `Contains ${found.length} spam trigger words: ${found.slice(0, 3).join(", ")}…` });
  } else if (found.length > 0) {
    issues.push({ severity: "warn", text: `Spam trigger words detected: ${found.join(", ")}` });
  }

  // ALL CAPS words in subject
  const capsWords = subject.split(/\s+/).filter((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (capsWords.length >= 2) {
    issues.push({ severity: "error", text: "Subject has multiple ALL CAPS words — looks spammy" });
  } else if (capsWords.length === 1) {
    issues.push({ severity: "warn", text: `ALL CAPS word in subject: "${capsWords[0]}"` });
  }

  // Excessive exclamation marks
  const excl = (subject + body).split("!").length - 1;
  if (excl >= 3) {
    issues.push({ severity: "error", text: `${excl} exclamation marks — reduce to 1 or fewer` });
  } else if (excl === 2) {
    issues.push({ severity: "warn", text: "2 exclamation marks — keep it to 1" });
  }

  // Very short body (less than 30 words)
  const plainWords = body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean);
  if (plainWords.length < 20) {
    issues.push({ severity: "warn", text: "Body is very short — add more context to improve trust" });
  }

  // No personalisation
  if (!body.includes("{{")) {
    issues.push({ severity: "warn", text: "No merge tags used — personalise with {{name}} or {{company}}" });
  }

  // Missing unsubscribe (this gets injected automatically, so just a note)
  // Not flagged here since the send engine handles it

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount  = issues.filter((i) => i.severity === "warn").length;

  // Score: 0 (clean) to 100 (very spammy)
  const score = Math.min(100, errorCount * 30 + warnCount * 10);

  return { score, issues };
}
