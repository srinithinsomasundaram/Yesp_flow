"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export type AuthState = { error?: string; success?: string };

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
      return { error: "An account with this email already exists. Please sign in instead." };
    }
    return { error: error.message };
  }
  // Supabase returns a user with empty identities when the email is already taken (email confirmation enabled)
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "An account with this email already exists. Please sign in instead." };
  }
  return { success: "Account created! Check your email for a confirmation link, then sign in." };
}

export async function forgotPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get("email") as string;
  if (!email) return { error: "Please enter your email address." };
  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return { success: "Check your email — we sent a password reset link." };
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = formData.get("password") as string;
  const confirm  = formData.get("confirm")  as string;
  if (!password || password.length < 6) return { error: "Password must be at least 6 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
