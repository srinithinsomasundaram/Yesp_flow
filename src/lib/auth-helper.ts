import { cache } from "react";
import { createSupabaseServerClient } from "./supabase-server";
import { supabase } from "./supabase";

// Role rank — higher = more access
const ROLE_RANK: Record<string, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

// Returns the effective workspace owner ID.
// Team members transparently resolve to the team owner's ID so all
// data queries (getCampaigns, getContacts …) hit the shared workspace.
export const getCurrentUserId = cache(async (): Promise<string> => {
  const supa = await createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("TeamMember")
    .select(`role, status, team:Team(ownerId)`)
    .eq("userId", user.id)
    .eq("status", "active")
    .neq("role", "owner")
    .maybeSingle();

  const ownerIdFromTeam = (membership?.team as any)?.ownerId;
  if (ownerIdFromTeam && ownerIdFromTeam !== user.id) return ownerIdFromTeam;

  return user.id;
});

// Returns the actual logged-in user's auth ID (never the team owner's).
export const getMyAuthId = cache(async (): Promise<string> => {
  const supa = await createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
});

// Returns the current user's role in their team, or "owner" when solo.
export const getCurrentUserRole = cache(async (): Promise<string> => {
  const supa = await createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return "owner";

  const { data: membership } = await supabase
    .from("TeamMember")
    .select("role, status")
    .eq("userId", user.id)
    .eq("status", "active")
    .maybeSingle();

  return membership?.role || "owner";
});

// Returns true when the current user's role is >= minRole.
export async function hasPermission(minRole: "owner" | "admin" | "member" | "viewer"): Promise<boolean> {
  const role = await getCurrentUserRole();
  return (ROLE_RANK[role] ?? 1) >= (ROLE_RANK[minRole] ?? 1);
}

// Throws a clean error if the user lacks minRole — use in fire-and-forget paths.
export async function requirePermission(minRole: "owner" | "admin" | "member" | "viewer"): Promise<void> {
  if (!await hasPermission(minRole)) {
    const role = await getCurrentUserRole();
    throw new Error(`Permission denied: ${minRole} access required (you are ${role}).`);
  }
}
