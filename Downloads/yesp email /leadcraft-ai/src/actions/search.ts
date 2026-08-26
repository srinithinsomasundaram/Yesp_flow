"use server";

import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/auth-helper";

export type SearchResult = {
  type: "contact" | "campaign";
  id: string; label: string; sublabel?: string; href: string;
};

export async function searchGlobal(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const userId = await getCurrentUserId();
  const q = query.trim();

  const [{ data: contacts }, { data: campaigns }] = await Promise.all([
    supabase
      .from("Contact")
      .select("id, name, firstName, lastName, email, company")
      .eq("userId", userId)
      .or(`email.ilike.%${q}%,name.ilike.%${q}%,firstName.ilike.%${q}%,lastName.ilike.%${q}%,company.ilike.%${q}%`)
      .limit(5),
    supabase
      .from("Campaign")
      .select("id, name, status")
      .eq("userId", userId)
      .ilike("name", `%${q}%`)
      .limit(4),
  ]);

  return [
    ...(contacts || []).map((c) => ({
      type: "contact" as const, id: c.id,
      label: c.name || [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email,
      sublabel: c.email, href: `/contacts`,
    })),
    ...(campaigns || []).map((c) => ({
      type: "campaign" as const, id: c.id,
      label: c.name, sublabel: c.status, href: `/campaigns/${c.id}`,
    })),
  ];
}
