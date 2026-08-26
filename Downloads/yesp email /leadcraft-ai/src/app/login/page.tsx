"use client";

import { useActionState, useState, useEffect } from "react";
import { signIn, signUp, forgotPassword, type AuthState } from "@/actions/auth";
import { Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const initial: AuthState = {};

const inputCls = "w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white text-slate-900 placeholder-slate-400 transition-all";

function LoginForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");

  const [signInState,  signInAction,  signInPending]  = useActionState(signIn,         initial);
  const [signUpState,  signUpAction,  signUpPending]  = useActionState(signUp,         initial);
  const [forgotState,  forgotAction,  forgotPending]  = useActionState(forgotPassword, initial);

  const isPending = signInPending || signUpPending || forgotPending;
  const state  = mode === "signin" ? signInState  : mode === "signup" ? signUpState  : forgotState;
  const action = mode === "signin" ? signInAction : mode === "signup" ? signUpAction : forgotAction;

  const headings = {
    signin: { title: "Welcome back",     sub: "Sign in to your outreach dashboard" },
    signup: { title: "Create account",   sub: "Set up your outreach account" },
    forgot: { title: "Forgot password?", sub: "Enter your email and we'll send a reset link" },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/flow-logo.png" alt="Flow" className="h-10 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{headings[mode].title}</h1>
          <p className="text-sm text-slate-500 mt-1">{headings[mode].sub}</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <form action={action} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input name="email" type="email" required placeholder="you@company.com" className={inputCls} />
              </div>
            </div>

            {/* Password — hidden in forgot mode */}
            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input name="password" type="password" required minLength={6} placeholder="••••••••" className={inputCls} />
                </div>
              </div>
            )}

            {/* URL error (e.g. expired reset link) */}
            {urlError && mode === "signin" && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                {urlError}
              </p>
            )}

            {state?.error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                {state.error}
              </p>
            )}

            {state?.success && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                {state.success}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 text-center space-y-2">
            {mode === "forgot" ? (
              <button
                onClick={() => setMode("signin")}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors mx-auto"
              >
                <ArrowLeft className="w-3 h-3" /> Back to sign in
              </button>
            ) : (
              <>
                <span className="text-xs text-slate-500">
                  {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
