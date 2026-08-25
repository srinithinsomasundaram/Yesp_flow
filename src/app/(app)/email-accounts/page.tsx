import { Mail } from "lucide-react";
import { getEmailAccounts } from "@/actions/email-accounts";
import { EmailAccountManager } from "@/components/EmailAccountManager";

export const dynamic = "force-dynamic";

export default async function EmailAccountsPage() {
  const accounts = await getEmailAccounts();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Email Accounts
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Email Accounts</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Connect sender accounts for outreach campaigns. Supports SMTP and Resend.
        </p>
      </div>

      <EmailAccountManager accounts={accounts} />
    </div>
  );
}
