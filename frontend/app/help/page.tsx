import Link from "next/link";
import CustomerNav from "../components/CustomerNav";

const STEPS = [
  { title: "Report the issue", desc: "Tell us your order number, what went wrong and what outcome you would like." },
  { title: "We investigate", desc: "We check your order and delivery records against our returns policy." },
  { title: "Our team reviews", desc: "A member of staff reviews the findings. Nothing is approved automatically." },
  { title: "You get an update", desc: "Your tracking page shows the outcome and any next steps." },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-sand">
      <CustomerNav active="/help" />
      <main className="shell py-10 sm:py-14">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <p className="eyebrow">Customer Portal</p>
            <h1 className="mt-2 page-title">Help &amp; Support</h1>
          </div>
          <div className="card">
            <h2 className="section-title mb-4">How it works</h2>
            <ol className="space-y-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal text-xs font-bold">{i + 1}</div>
                  <div>
                    <p className="font-semibold text-sm text-ink">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="card">
            <h2 className="section-title mb-2">Contact</h2>
            <p className="text-sm text-slate-600">
              Demo placeholder: this is a fictional retailer and there is no real support team. Use{" "}
              <Link href="/track-case" className="font-semibold text-teal hover:underline">Track Complaint</Link>{" "}
              to check an existing case, or{" "}
              <Link href="/report-issue" className="font-semibold text-teal hover:underline">Report an Issue</Link>{" "}
              to start a new one.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
