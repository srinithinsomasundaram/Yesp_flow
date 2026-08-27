import Link from "next/link";
import {
  Mail, Zap, BarChart2, Users, CheckCircle2, Shield, Clock,
  ArrowRight, Star, Send, Activity, Layers,
} from "lucide-react";

const FEATURES = [
  {
    icon: Mail,
    title: "Multi-Step Sequences",
    desc: "Build automated email sequences with custom delays — days, hours, or business days between each step.",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    icon: Activity,
    title: "Real-Time Delivery Tracking",
    desc: "See delivered, opened, clicked, bounced, and complained status per email — powered by Resend webhooks.",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    icon: Zap,
    title: "Smart Automation",
    desc: "Set your automation interval (15 min to daily). Campaigns run within your defined send window and allowed days.",
    color: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    icon: Users,
    title: "Bulk Contact Import",
    desc: "Import thousands of contacts from CSV. Auto-deduplicates, skips DNC and unsubscribed contacts.",
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    icon: BarChart2,
    title: "Campaign Analytics",
    desc: "Track reply rate, bounce rate, opens, and clicks per campaign. Downloadable PDF reports after every run.",
    color: "bg-rose-50 text-rose-600 border-rose-100",
  },
  {
    icon: Shield,
    title: "Team RBAC",
    desc: "Invite your team with owner, admin, or member roles. Each member operates within their permission scope.",
    color: "bg-sky-50 text-sky-600 border-sky-100",
  },
  {
    icon: Clock,
    title: "Send Windows",
    desc: "Define allowed days and time windows per campaign. Emails only go out when your contacts are most likely to read.",
    color: "bg-orange-50 text-orange-600 border-orange-100",
  },
  {
    icon: Layers,
    title: "Merge Tags",
    desc: "Personalise every email with {{name}}, {{company}}, {{jobTitle}}, {{city}}, {{linkedinUrl}}, and more.",
    color: "bg-teal-50 text-teal-600 border-teal-100",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "₹2,499",
    period: "/mo",
    desc: "For solo founders and small teams just getting started.",
    highlights: ["3,000 contacts", "5 campaigns", "3 email accounts", "Resend + SMTP", "Activity logs"],
    cta: "Start Free Trial",
    accent: false,
  },
  {
    name: "Growth",
    price: "₹6,999",
    period: "/mo",
    desc: "For growing teams with serious outreach volume.",
    highlights: [
      "25,000 contacts",
      "Unlimited campaigns",
      "10 email accounts",
      "Delivery tracking",
      "Team RBAC (5 seats)",
      "PDF run reports",
      "Webhook tracking",
    ],
    cta: "Start Free Trial",
    accent: true,
  },
  {
    name: "Scale",
    price: "₹14,999",
    period: "/mo",
    desc: "For agencies and high-volume outreach operations.",
    highlights: [
      "Unlimited contacts",
      "Unlimited campaigns",
      "Unlimited email accounts",
      "Priority support",
      "Unlimited team seats",
      "Custom domain",
      "API access",
    ],
    cta: "Contact Sales",
    accent: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Arjun M.",
    role: "Founder, B2B SaaS",
    body: "We went from manually following up to running 500-contact sequences fully automated. Reply rates went up 3x.",
    stars: 5,
  },
  {
    name: "Priya K.",
    role: "Growth Lead, Agency",
    body: "The per-campaign send windows and daily limits mean we never blow past Resend quotas. Exactly what we needed.",
    stars: 5,
  },
  {
    name: "Rahul S.",
    role: "Sales Head, Enterprise",
    body: "Bounce detection saves our domain reputation. As soon as someone bounces, they're automatically removed.",
    stars: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Send className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">YESP Flow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6 text-center bg-gradient-to-b from-blue-50/60 to-white">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" /> Automated Cold Email for B2B Teams
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-5">
            Cold outreach on autopilot.<br />
            <span className="text-blue-600">Replies on demand.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
            YESP Flow automates your entire cold email pipeline — from first touch to follow-ups —
            with real delivery tracking, bounce protection, and team-level controls.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-colors text-sm bg-white"
            >
              Watch Demo
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-4">No credit card required. 14-day free trial.</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-slate-100 bg-white py-8">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { val: "10K+", label: "Emails sent daily" },
            { val: "3×",   label: "Avg reply rate lift" },
            { val: "99.9%", label: "Uptime" },
            { val: "<2min", label: "Setup time" },
          ].map(({ val, label }) => (
            <div key={label}>
              <p className="text-2xl font-extrabold text-blue-600">{val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Everything you need to scale cold outreach
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-sm">
              Built for B2B teams that need reliable automation, real tracking, and zero deliverability drama.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-10">Get started in 3 steps</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { step: "1", title: "Connect your email", desc: "Add your SMTP account or Resend API key. We validate the connection instantly." },
              { step: "2", title: "Import contacts", desc: "Upload a CSV or add contacts manually. Assign them to a campaign with a single click." },
              { step: "3", title: "Launch your sequence", desc: "Set your follow-up steps, daily limits, and send window. Enable automation and you're live." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mb-3">
                  {step}
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Simple, predictable pricing</h2>
            <p className="text-sm text-slate-500">Start with a 14-day free trial. No credit card required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, period, desc, highlights, cta, accent }) => (
              <div
                key={name}
                className={`rounded-2xl p-6 border shadow-sm flex flex-col ${
                  accent
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-200 text-slate-900"
                }`}
              >
                {accent && (
                  <span className="text-xs font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full self-start mb-3">
                    Most Popular
                  </span>
                )}
                <h3 className={`font-bold text-lg mb-0.5 ${accent ? "text-white" : "text-slate-900"}`}>{name}</h3>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-3xl font-extrabold ${accent ? "text-white" : "text-slate-900"}`}>{price}</span>
                  <span className={`text-sm mb-1 ${accent ? "text-blue-200" : "text-slate-400"}`}>{period}</span>
                </div>
                <p className={`text-xs mb-5 ${accent ? "text-blue-100" : "text-slate-500"}`}>{desc}</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${accent ? "text-blue-200" : "text-emerald-500"}`} />
                      <span className={accent ? "text-blue-50" : "text-slate-700"}>{h}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`block text-center font-bold text-sm py-2.5 rounded-xl transition-colors ${
                    accent
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">What teams are saying</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, body, stars }) => (
              <div key={name} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 mb-4 leading-relaxed">&ldquo;{body}&rdquo;</p>
                <div>
                  <p className="text-xs font-bold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to run your outreach on autopilot?
          </h2>
          <p className="text-blue-100 text-sm mb-8">
            Join hundreds of B2B teams using YESP Flow to book more meetings with less effort.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-3.5 rounded-xl transition-colors text-sm"
          >
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-blue-200 text-xs mt-4">14 days free. No credit card required.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
              <Send className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">YESP Flow</span>
          </div>
          <p className="text-xs text-slate-400">© 2026 YESP Studio. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link href="/login" className="hover:text-slate-900">Log in</Link>
            <span>·</span>
            <span>Privacy</span>
            <span>·</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
