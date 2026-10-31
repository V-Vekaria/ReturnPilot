import Link from "next/link";
import CustomerNav from "./components/CustomerNav";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sand">
      <CustomerNav active="/" />

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-deep via-[#0c0e27] to-[#1a1f4e] py-24 sm:py-32">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-teal/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-72 w-72 rounded-full bg-teal/10 blur-3xl" />

        <div className="shell relative text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-2 text-sm font-medium text-teal-light">
            <span className="h-2 w-2 rounded-full bg-teal-light animate-pulse" />
            Trusted by 500+ UK retailers
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            Returns and complaints,{" "}
            <span className="bg-gradient-to-r from-teal-light to-emerald-300 bg-clip-text text-transparent">
              made simple.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            ReturnPilot connects customers directly with retailers to resolve complaints faster, fairer and with full transparency at every step.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/report-issue" className="button button-lg w-full sm:w-auto">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Report an Issue
            </Link>
            <Link href="/track-case" className="button-secondary button-lg w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Track My Complaint
            </Link>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8">
            {[
              { value: "98%", label: "Resolution rate" },
              { value: "< 48h", label: "Avg. first response" },
              { value: "50k+", label: "Cases resolved" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-black text-white sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-sand" id="how-it-works">
        <div className="shell">
          <div className="text-center mb-14">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Three steps to resolution</h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">Submit your complaint, track progress in real time, and get a fair resolution — all in one place.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: (
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: "Submit",
                desc: "Fill in our guided form with your order details, describe what went wrong, and attach any supporting photos or documents.",
              },
              {
                step: "02",
                icon: (
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ),
                title: "Track",
                desc: "Use your unique complaint reference to monitor progress in real time. We keep you updated at every stage of the investigation.",
              },
              {
                step: "03",
                icon: (
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Resolve",
                desc: "Receive a clear decision from the retailer — refund, replacement, repair or explanation — backed by a transparent audit trail.",
              },
            ].map((item, i) => (
              <div key={i} className="relative card group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal group-hover:bg-teal group-hover:text-white transition-all duration-300">
                  {item.icon}
                </div>
                <div className="absolute top-5 right-7 text-6xl font-black text-slate-100 group-hover:text-slate-200 transition-colors select-none">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature cards ────────────────────────────────────────────────── */}
      <section className="py-20 bg-pale" id="features">
        <div className="shell">
          <div className="text-center mb-14">
            <p className="eyebrow">Why ReturnPilot</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Built for fair resolutions</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🔍",
                title: "Full Transparency",
                desc: "Every action, update and decision is logged in an immutable timeline you can view at any time.",
              },
              {
                icon: "⚡",
                title: "Fast Resolution",
                desc: "Automated routing gets your complaint to the right team immediately, cutting resolution time in half.",
              },
              {
                icon: "📊",
                title: "Real-Time Tracking",
                desc: "Monitor every stage of your case live — from submission through investigation to final decision.",
              },
              {
                icon: "🛡️",
                title: "Evidence-Led",
                desc: "Upload photos, receipts and documents to support your case and ensure a fair, informed outcome.",
              },
              {
                icon: "💬",
                title: "Direct Communication",
                desc: "Receive retailer responses and decisions directly through the platform with full context.",
              },
              {
                icon: "📱",
                title: "Works Everywhere",
                desc: "Fully responsive — manage your complaint from desktop, tablet or mobile with equal ease.",
              },
            ].map((feature, i) => (
              <div key={i} className="card-hover">
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="font-bold text-ink mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-teal to-teal-dark">
        <div className="shell text-center">
          <h2 className="text-3xl font-black text-white sm:text-4xl">Have an issue with a purchase?</h2>
          <p className="mt-4 text-teal-light/90 text-lg max-w-xl mx-auto">
            Submit your complaint in under 5 minutes. Our guided form makes it simple.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/report-issue" className="button bg-white text-teal hover:bg-slate-100 button-lg">
              Report an Issue
            </Link>
            <Link href="/track-case" className="button-secondary bg-transparent border-white/40 text-white hover:bg-white/10 button-lg">
              Track Existing Complaint
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-sand" id="faq">
        <div className="shell max-w-3xl">
          <div className="text-center mb-14">
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "How long does it take to resolve a complaint?",
                a: "Most complaints are acknowledged within 2 hours and resolved within 5 working days, depending on the retailer and the nature of the issue.",
              },
              {
                q: "What types of issues can I report?",
                a: "You can report damaged or defective products, wrong items received, missing deliveries, refund issues, return requests, and more.",
              },
              {
                q: "Do I need an account to submit a complaint?",
                a: "No. You can submit a complaint without creating an account. You receive a unique reference number to track your case.",
              },
              {
                q: "What evidence should I provide?",
                a: "Photos of the product or damage, screenshots of tracking information, order confirmation emails, and proof of purchase are all helpful.",
              },
              {
                q: "Can the retailer see everything I submit?",
                a: "Yes. All information and evidence you submit will be visible to the retailer's resolution team to help them investigate your case fairly.",
              },
              {
                q: "What happens if my complaint is rejected?",
                a: "You will receive a clear explanation of the decision. You can contact the retailer directly or escalate through your consumer rights channels if you disagree.",
              },
            ].map((faq, i) => (
              <FaqItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-700/50 bg-pale">
        <div className="shell py-12">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-xl font-black tracking-tight text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-white text-sm font-black">RP</span>
                Return<span className="text-teal">Pilot</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-slate-400 leading-relaxed">
                Professional complaint and returns management connecting customers with retailers for fair, transparent resolutions.
              </p>
              <p className="mt-4 text-xs text-slate-400">Fictional demo only. No real payments processed.</p>
            </div>
            <div>
              <p className="text-sm font-bold text-ink mb-4">Customer</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Report an Issue", href: "/report-issue" },
                  { label: "Track My Complaint", href: "/track-case" },
                  { label: "How It Works", href: "#how-it-works" },
                  { label: "FAQ", href: "#faq" },
                ].map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-slate-500 hover:text-teal transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-ink mb-4">Retailer</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Retailer Dashboard", href: "/retailer/dashboard" },
                  { label: "Case Management", href: "/retailer/cases" },
                  { label: "Privacy Policy", href: "#" },
                  { label: "Terms of Service", href: "#" },
                ].map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-slate-500 hover:text-teal transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-slate-700/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} ReturnPilot. Demo prototype only.</span>
            <span>Fictional orders · Simulated decisions · No real payments</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  // We use a native details/summary for zero-JS accordion
  return (
    <details className="group card cursor-pointer select-none" open={false}>
      <summary className="flex items-center justify-between gap-4 font-semibold text-ink list-none [&::-webkit-details-marker]:hidden">
        {question}
        <svg
          className="h-5 w-5 shrink-0 text-teal transition-transform duration-200 group-open:rotate-45"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </summary>
      <p className="mt-4 text-sm text-slate-400 leading-relaxed">{answer}</p>
    </details>
  );
}
