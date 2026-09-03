import { supabase } from "@/lib/supabase";
import { MailX, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

type UnsubResult = "ok" | "notfound" | "already";

async function doUnsubscribeByToken(token: string): Promise<UnsubResult> {
  const { data: contact } = await supabase
    .from("Contact")
    .select("id, isUnsubscribed")
    .eq("unsubscribeToken", token)
    .maybeSingle();

  if (!contact) return "notfound";
  if (contact.isUnsubscribed) return "already";

  await supabase
    .from("Contact")
    .update({ isUnsubscribed: true, status: "Unsubscribed" })
    .eq("id", contact.id);

  return "ok";
}

// Fallback for legacy contacts that were imported before unsubscribeToken was added (v6).
async function doUnsubscribeByEmail(email: string): Promise<UnsubResult> {
  const { data: contact } = await supabase
    .from("Contact")
    .select("id, isUnsubscribed")
    .eq("email", email)
    .maybeSingle();

  if (!contact) return "notfound";
  if (contact.isUnsubscribed) return "already";

  await supabase
    .from("Contact")
    .update({ isUnsubscribed: true, status: "Unsubscribed" })
    .eq("id", contact.id);

  return "ok";
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string; confirm?: string }>;
}) {
  const { token, email, confirm } = await searchParams;

  // Neither token nor email — malformed link.
  if (!token && !email) {
    return (
      <Shell>
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h1 className="text-lg font-bold text-slate-900 mb-2">Invalid link</h1>
        <p className="text-sm text-slate-500">
          This unsubscribe link is missing a token. Please use the link from the email you received.
        </p>
      </Shell>
    );
  }

  // Build the confirm href that preserves whichever identifier we have.
  const confirmHref = token
    ? `/unsubscribe?token=${encodeURIComponent(token)}&confirm=1`
    : `/unsubscribe?email=${encodeURIComponent(email!)}&confirm=1`;

  if (confirm === "1") {
    const result = token
      ? await doUnsubscribeByToken(token)
      : await doUnsubscribeByEmail(email!);

    if (result === "notfound") {
      return (
        <Shell>
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-slate-900 mb-2">Link not found</h1>
          <p className="text-sm text-slate-500">
            We could not find your subscription. The link may be expired or already used.
          </p>
        </Shell>
      );
    }

    return (
      <Shell>
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-lg font-bold text-slate-900 mb-2">
          {result === "already" ? "Already unsubscribed" : "You've been unsubscribed"}
        </h1>
        <p className="text-sm text-slate-500">
          {result === "already"
            ? "You were already removed from this list. You won't receive any more emails."
            : "You've been successfully removed from this outreach list. You will no longer receive emails from this sender."}
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <MailX className="w-10 h-10 text-slate-400 mx-auto mb-4" />
      <h1 className="text-lg font-bold text-slate-900 mb-2">Unsubscribe</h1>
      <p className="text-sm text-slate-500 mb-6">
        You are about to unsubscribe from this outreach list. You will no longer receive emails from this sender.
      </p>
      <Link
        href={confirmHref}
        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
      >
        <MailX className="w-4 h-4" /> Confirm Unsubscribe
      </Link>
      <p className="text-xs text-slate-400 mt-4">Changed your mind? Just close this tab.</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-lg">F</span>
        </div>
        {children}
      </div>
    </div>
  );
}
