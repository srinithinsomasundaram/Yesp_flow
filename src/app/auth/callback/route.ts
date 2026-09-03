import { createSupabaseServerClient } from "@/lib/supabase-server";
import { acceptPendingInvites } from "@/actions/teams";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Activate any pending team invites that match this user's email.
      await acceptPendingInvites().catch(() => {});
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Link+expired+or+invalid.+Request+a+new+reset+link.`);
}
