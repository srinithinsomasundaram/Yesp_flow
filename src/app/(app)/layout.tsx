import { AppShell } from "@/components/AppShell";
import { getUser } from "@/actions/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <AppShell user={user ? { email: user.email ?? "", id: user.id } : null}>
      {children}
    </AppShell>
  );
}
