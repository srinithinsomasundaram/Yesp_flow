"use client";

import { useState } from "react";
import {
  Users, Plus, Trash2, Loader2, ChevronDown, CheckCircle2,
  AlertCircle, Shield, Eye, Crown, UserCog, LogOut,
} from "lucide-react";
import {
  createTeam, inviteTeamMember, removeTeamMember, updateMemberRole,
  deleteTeam, leaveTeam, type TeamRole,
} from "@/actions/teams";

const ROLE_META: Record<TeamRole, { label: string; color: string; icon: React.ReactNode }> = {
  owner:  { label: "Owner",  color: "text-blue-700 bg-blue-50 border-blue-200",        icon: <Crown    className="w-3 h-3" /> },
  admin:  { label: "Admin",  color: "text-violet-700 bg-violet-50 border-violet-200",  icon: <Shield   className="w-3 h-3" /> },
  member: { label: "Member", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <UserCog className="w-3 h-3" /> },
  viewer: { label: "Viewer", color: "text-slate-600 bg-slate-50 border-slate-200",     icon: <Eye      className="w-3 h-3" /> },
};

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role as TeamRole] ?? ROLE_META.viewer;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

export function TeamManager({ initialTeam }: { initialTeam: any }) {
  const [team, setTeam]         = useState<any>(initialTeam);
  const myRole: TeamRole        = team?.myRole ?? "viewer";
  const isOwner                 = myRole === "owner";
  const isAdmin                 = myRole === "admin";
  const canManage               = isOwner || isAdmin;

  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole,  setInviteRole]  = useState<TeamRole>("member");
  const [inviting,    setInviting]    = useState(false);

  const [toast,    setToast]    = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [leaving,  setLeaving]  = useState(false);
  const [deleting, setDeleting] = useState(false);

  function flash(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreating(true);
    const res = await createTeam(teamName.trim());
    setCreating(false);
    if (res.success) {
      setTeam({ ...res.team, members: [], myRole: "owner" });
      setTeamName("");
      flash("Team created!");
    } else {
      flash(res.error ?? "Failed to create team.", "error");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !team) return;
    setInviting(true);
    const res = await inviteTeamMember(team.id, inviteEmail.trim(), inviteRole);
    setInviting(false);
    if (res.success) {
      setTeam((t: any) => ({
        ...t,
        members: [...(t.members || []), {
          id: crypto.randomUUID(), email: inviteEmail.trim(), role: inviteRole, status: "invited",
        }],
      }));
      setInviteEmail("");
      flash(`Invite sent to ${inviteEmail}`);
    } else {
      flash(res.error ?? "Failed to invite.", "error");
    }
  };

  const handleRemove = async (memberId: string) => {
    setRemoving(memberId);
    const res = await removeTeamMember(memberId);
    setRemoving(null);
    if (res.success) {
      setTeam((t: any) => ({ ...t, members: t.members.filter((m: any) => m.id !== memberId) }));
      flash("Member removed.");
    } else {
      flash(res.error ?? "Failed to remove.", "error");
    }
  };

  const handleRoleChange = async (memberId: string, role: TeamRole) => {
    const res = await updateMemberRole(memberId, role);
    if (res.success) {
      setTeam((t: any) => ({
        ...t, members: t.members.map((m: any) => m.id === memberId ? { ...m, role } : m),
      }));
      flash("Role updated.");
    } else {
      flash(res.error ?? "Failed to update role.", "error");
    }
  };

  const handleLeave = async () => {
    if (!confirm("Leave this team? You will lose access to the shared workspace.")) return;
    setLeaving(true);
    const res = await leaveTeam();
    setLeaving(false);
    if (res.success) {
      setTeam(null);
      flash("You have left the team.");
    } else {
      flash(res.error ?? "Failed to leave team.", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete team "${team.name}"? All members will lose access.`)) return;
    setDeleting(true);
    const res = await deleteTeam(team.id);
    setDeleting(false);
    if (res.success) {
      setTeam(null);
      flash("Team deleted.");
    } else {
      flash(res.error ?? "Failed to delete team.", "error");
    }
  };

  // Can this user remove a specific member?
  function canRemove(member: any) {
    if (member.role === "owner") return false;
    if (isOwner) return true;
    if (isAdmin && member.role !== "admin") return true;
    return false;
  }

  const inputCls = "w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Team & RBAC</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Invite team members. They share your workspace; role determines what they can do.
          </p>
        </div>
      </div>

      {/* No team yet — create one */}
      {!team && (
        <form onSubmit={handleCreateTeam} className="flex items-center gap-2">
          <input
            type="text" placeholder="Team name e.g. Yesp Sales"
            value={teamName} onChange={e => setTeamName(e.target.value)}
            className={inputCls + " flex-1"} required
          />
          <button
            type="submit" disabled={creating}
            className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Team
          </button>
        </form>
      )}

      {/* Team exists */}
      {team && (
        <>
          {/* Team title + my role badge */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">{team.name}</p>
              <p className="text-xs text-slate-400">
                {(team.members || []).length} member{(team.members || []).length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role={myRole} />
              {!isOwner && (
                <button
                  onClick={handleLeave} disabled={leaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  {leaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                  Leave team
                </button>
              )}
              {isOwner && (
                <button
                  onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Delete team
                </button>
              )}
            </div>
          </div>

          {/* Member table */}
          {(team.members || []).length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Email", "Role", "Status", ...(canManage ? [""] : [])].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {team.members.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-800 font-medium text-sm">
                        {m.email || <span className="text-slate-400 italic">you (owner)</span>}
                      </td>
                      <td className="px-4 py-3">
                        {/* Owner can change any non-owner role; admin sees badge only */}
                        {m.role === "owner" || !isOwner ? (
                          <RoleBadge role={m.role} />
                        ) : (
                          <div className="relative inline-block">
                            <select
                              value={m.role}
                              onChange={e => handleRoleChange(m.id, e.target.value as TeamRole)}
                              className="appearance-none pr-6 pl-2 py-0.5 text-xs font-semibold border rounded-full outline-none cursor-pointer bg-white border-slate-200 text-slate-700"
                            >
                              {(["admin", "member", "viewer"] as TeamRole[]).map(r => (
                                <option key={r} value={r}>{ROLE_META[r].label}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          m.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {m.status === "active" ? "Active" : "Invited"}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          {canRemove(m) && (
                            <button
                              onClick={() => handleRemove(m.id)}
                              disabled={removing === m.id}
                              className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                            >
                              {removing === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Invite form — owner and admin only */}
          {canManage && (
            <form onSubmit={handleInvite} className="flex items-center gap-2 pt-1">
              <input
                type="email" placeholder="colleague@company.com"
                value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                className={inputCls + " flex-1"} required
              />
              <select
                value={inviteRole} onChange={e => setInviteRole(e.target.value as TeamRole)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit" disabled={inviting}
                className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Invite
              </button>
            </form>
          )}

          {/* Role legend */}
          <div className="flex items-center gap-3 flex-wrap pt-1 text-xs text-slate-500">
            <span className="font-semibold">Roles:</span>
            <span><Crown   className="inline w-3 h-3 text-blue-600"   /> Owner — full control</span>
            <span><Shield  className="inline w-3 h-3 text-violet-600" /> Admin — invite &amp; edit</span>
            <span><UserCog className="inline w-3 h-3 text-emerald-600"/> Member — run &amp; view</span>
            <span><Eye     className="inline w-3 h-3 text-slate-500"  /> Viewer — read only</span>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl animate-in slide-in-from-bottom-5 duration-300 ${
          toast.type === "success"
            ? "bg-white border-emerald-300 text-emerald-800"
            : "bg-white border-red-300 text-red-800"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            : <AlertCircle  className="w-5 h-5 text-red-600" />}
          <span className="text-sm font-bold">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
