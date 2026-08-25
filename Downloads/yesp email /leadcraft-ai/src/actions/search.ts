"use server";

import { supabase } from "@/lib/supabase";

export type SearchResult = {
  type: "contact" | "campaign";
  id: string;
  label: string;
  sublabel?: string;
  href: string;
};

export async function searchGlobal(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim().toLowerCase();

  const [{ data: contacts }, { data: campaigns }] = await Promise.all([
    supabase
      .from("Contact")
      .select("id, name, firstName, lastName, email, company")
      .or(`email.ilike.%${q}%,name.ilike.%${q}%,firstName.ilike.%${q}%,lastName.ilike.%${q}%,company.ilike.%${q}%`)
      .limit(5),
    supabase
      .from("Campaign")
      .select("id, name, status")
      .ilike("name", `%${q}%`)
      .limit(4),
  ]);

  const contactResults: SearchResult[] = (contacts || []).map((c) => ({
    type: "contact",
    id: c.id,
    label:
      c.name ||
      [c.firstName, c.lastName].filter(Boolean).join(" ") ||
      c.email,
    sublabel: c.email,
    href: `/contacts`,
  }));

  const campaignResults: SearchResult[] = (campaigns || []).map((c) => ({
    type: "campaign",
    id: c.id,
    label: c.name,
    sublabel: c.status,
    href: `/campaigns/${c.id}`,
  }));

  return [...contactResults, ...campaignResults];
}
