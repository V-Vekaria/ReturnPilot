"use client";

import { useEffect, useState } from "react";
import CustomerNav from "../components/CustomerNav";
import { getPolicy, PolicyInfo } from "../lib/api";

const ISSUE_LABEL: Record<string, string> = {
  damaged_item: "Damaged item",
  disputed_delivery: "Missing or disputed delivery",
  change_of_mind: "Change of mind",
};

export default function PolicyPage() {
  const [policy, setPolicy] = useState<PolicyInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { getPolicy().then(setPolicy).catch((e) => setError(e.message)); }, []);

  return (
    <div className="min-h-screen bg-sand">
      <CustomerNav active="/policy" />
      <main className="shell py-10 sm:py-14">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <p className="eyebrow">Customer Portal</p>
            <h1 className="mt-2 page-title">Returns Policy</h1>
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
              Demo guidance only. These are fictional sample rules for a demonstration retailer, not a statement of your legal rights.
            </div>
          </div>
          {error && <div className="alert-error" role="alert">{error}</div>}
          {policy?.rules.map((r) => (
            <div key={r.rule_id} className="card">
              <h2 className="section-title mb-2">{ISSUE_LABEL[r.issue_type] ?? r.issue_type}</h2>
              <p className="text-sm text-slate-700 leading-relaxed">{r.summary}</p>
            </div>
          ))}
          <p className="text-xs text-slate-500">
            Every outcome is reviewed by a member of staff before anything is approved. Submitting a request does not guarantee a refund.
          </p>
        </div>
      </main>
    </div>
  );
}
