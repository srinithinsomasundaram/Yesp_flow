"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { dbLog } from "@/lib/db-error";
import { getMyAuthId, hasPermission } from "@/lib/auth-helper";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type TeamRole = "owner" | "admin" | "member" | "viewer";

// ── Get team visible to current user ─────────────────────────────────────
// Returns the team the user owns, OR the team they're an active member of,
// together with all members and the current user's own role.
export async function getMyTeam() {
  const userId = await getMyAuthId();

  // Case 1: user owns a team
  const { data: ownedTeam } = await supabase
    .from("Team").select("*").eq("ownerId", userId).maybeSingle();

  if (ownedTeam) {
    const { data: members } = await supabase
      .from("TeamMember").select("*").eq("teamId", ownedTeam.id)
      .order("createdAt", { ascending: true });
    return { ...ownedTeam, members: members || [], myRole: "owner" as TeamRole };
  }

  // Case 2: user is a member of someone else's team
  const { data: membership } = await supabase
    .from("TeamMember")
    .select(`role, teamId, team:Team(*)`)
    .eq("userId", userId)
    .eq("status", "active")
    .maybeSingle();

  if (membership?.team) {
    const team = membership.team as any;
    const { data: members } = await supabase
      .from("TeamMember").select("*").eq("teamId", team.id)
      .order("createdAt", { ascending: true });
    return { ...team, members: members || [], myRole: membership.role as TeamRole };
  }

  return null;
}

// ── Create a team (one per owner) ─────────────────────────────────────────
export async function createTeam(name: string) {
  const userId = await getMyAuthId();

  const { data: existing } = await supabase.from("Team").select("id").eq("ownerId", userId).maybeSingle();
  if (existing) return { success: false, error: "You already have a team." };

  const { data: team, error } = await supabase
    .from("Team").insert([{ name, ownerId: userId }]).select().single();
  if (error || !team) { dbLog("createTeam", error); return { success: false, error: error?.message }; }

  await supabase.from("TeamMember").insert([{
    teamId: team.id, userId, email: "", role: "owner", status: "active",
  }]);

  revalidatePath("/settings");
  return { success: true, team };
}

// ── Delete a team (owner only) ────────────────────────────────────────────
export async function deleteTeam(teamId: string) {
  const userId = await getMyAuthId();

  const { data: team } = await supabase.from("Team").select("ownerId").eq("id", teamId).single();
  if (!team || team.ownerId !== userId)
    return { success: false, error: "Only the team owner can delete the team." };

  await supabase.from("Team").delete().eq("id", teamId);
  revalidatePath("/settings");
  return { success: true };
}

// ── Invite a member ───────────────────────────────────────────────────────
export async function inviteTeamMember(teamId: string, email: string, role: TeamRole = "member") {
  if (!await hasPermission("admin"))
    return { success: false, error: "Admin or Owner access required to invite members." };

  const { data: existing } = await supabase.from("TeamMember")
    .select("id").eq("teamId", teamId).eq("email", email).maybeSingle();
  if (existing) return { success: false, error: "This email is already in the team." };

  if (role === "owner") return { success: false, error: "Cannot invite another owner." };

  const { error } = await supabase.from("TeamMember").insert([{
    teamId, email: email.toLowerCase().trim(), role, status: "invited",
  }]);
  if (error) { dbLog("inviteTeamMember", error); return { success: false, error: error.message }; }

  revalidatePath("/settings");
  return { success: true };
}

// ── Update member role ────────────────────────────────────────────────────
export async function updateMemberRole(memberId: string, role: TeamRole) {
  const userId = await getMyAuthId();

  const { data: member } = await supabase.from("TeamMember")
    .select("teamId, role").eq("id", memberId).single();
  if (!member) return { success: false, error: "Member not found." };
  if (member.role === "owner") return { success: false, error: "Cannot change the owner's role." };
  if (role === "owner") return { success: false, error: "Cannot promote to owner." };

  // Only owner can change roles
  const { data: myRow } = await supabase.from("TeamMember")
    .select("role").eq("teamId", member.teamId).eq("userId", userId).single();
  if (!myRow || myRow.role !== "owner")
    return { success: false, error: "Only the team owner can change roles." };

  const { error } = await supabase.from("TeamMember").update({ role }).eq("id", memberId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

// ── Remove a member (owner/admin) ─────────────────────────────────────────
export async function removeTeamMember(memberId: string) {
  const userId = await getMyAuthId();

  const { data: member } = await supabase.from("TeamMember")
    .select("teamId, role, userId").eq("id", memberId).single();
  if (!member) return { success: false, error: "Member not found." };
  if (member.role === "owner") return { success: false, error: "Cannot remove the team owner." };

  const { data: myRow } = await supabase.from("TeamMember")
    .select("role").eq("teamId", member.teamId).eq("userId", userId).single();
  if (!myRow || !["owner", "admin"].includes(myRow.role))
    return { success: false, error: "Admin or Owner access required to remove members." };

  // Admins cannot remove other admins — only owner can
  if (member.role === "admin" && myRow.role !== "owner")
    return { success: false, error: "Only the owner can remove other admins." };

  const { error } = await supabase.from("TeamMember").delete().eq("id", memberId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

// ── Leave a team (non-owner members) ─────────────────────────────────────
export async function leaveTeam() {
  const userId = await getMyAuthId();

  const { data: membership } = await supabase.from("TeamMember")
    .select("id, role").eq("userId", userId).eq("status", "active").maybeSingle();
  if (!membership) return { success: false, error: "You are not in a team." };
  if (membership.role === "owner") return { success: false, error: "Owners cannot leave — delete the team instead." };

  const { error } = await supabase.from("TeamMember").delete().eq("id", membership.id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/settings");
  return { success: true };
}

// ── Accept pending invite on login ────────────────────────────────────────
export async function acceptPendingInvites() {
  const supa = await createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return;

  await supabase.from("TeamMember")
    .update({ userId: user.id, status: "active" })
    .eq("email", user.email!.toLowerCase())
    .eq("status", "invited");
}
