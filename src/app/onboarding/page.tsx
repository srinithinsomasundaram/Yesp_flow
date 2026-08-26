import { redirect } from "next/navigation";
import { getUser } from "@/actions/auth";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return <OnboardingFlow />;
}
