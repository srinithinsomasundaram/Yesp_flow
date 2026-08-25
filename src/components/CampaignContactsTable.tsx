"use client";

import { Users, Trash2 } from "lucide-react";
import { removeContactFromCampaign } from "@/actions/campaigns";

export function CampaignContactsTable({ campaign }: { campaign: any }) {
  const handleRemove = async (contactId: string) => {
    if (confirm("Are you sure you want to remove this contact from the campaign? They will not receive any further emails.")) {
      await removeContactFromCampaign(contactId, campaign.id);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden mt-8">
      <div className="px-8 py-6 border-b border-border/50 bg-secondary/30 flex justify-between items-center backdrop-blur-sm">
        <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Enrolled Contacts
        </h2>
        <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
          Total: {campaign.states?.length || 0}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/30 text-muted-foreground font-semibold border-b border-border/50">
            <tr>
              <th className="px-8 py-4">Contact</th>
              <th className="px-8 py-4">Email</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4">Current Step</th>
              <th className="px-8 py-4">Next Action</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 bg-card/20">
            {(!campaign.states || campaign.states.length === 0) ? (
              <tr>
                <td colSpan={6} className="px-8 py-12 text-center text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                  No contacts enrolled in this campaign yet.
                </td>
              </tr>
            ) : (
              campaign.states.map((state: any) => (
                <tr key={state.id} className="hover:bg-secondary/20 transition-colors group">
                  <td className="px-8 py-4 font-medium text-foreground">{state.contact?.name || "-"}</td>
                  <td className="px-8 py-4 text-muted-foreground">{state.contact?.email}</td>
                  <td className="px-8 py-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      state.status === 'New' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      state.status === 'Replied' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      state.status === 'Bounced' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      state.status === 'Completed' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {state.status === "New" ? "Waiting" : state.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-muted-foreground font-medium">
                    {state.currentStep > 0 ? `Step ${state.currentStep}` : 'Not Started'}
                  </td>
                  <td className="px-8 py-4 text-muted-foreground text-sm font-medium">
                    {state.status === "New" ? "Send Today" : 
                      state.nextActionDate ? new Date(state.nextActionDate).toLocaleDateString() : 
                      "-"}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button 
                      onClick={() => handleRemove(state.contact?.id)}
                      className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="Remove from campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
