"use client";

import { useEffect, useState } from "react";
import { API_URL, getHealth, getPolicy, PolicyInfo, resetDemo } from "../../lib/api";

export default function SettingsPage() {
  const [health, setHealth] = useState<{ status: string; mode: string } | null>(null);
  const [policy, setPolicy] = useState<PolicyInfo | null>(null);
  const [error, setError] = useState("");
  const [resetState, setResetState] = useState<"" | "confirm" | "done">("");

  useEffect(() => {
    getHealth().then(setHealth).catch((e) => setError(e.message));
    getPolicy().then(setPolicy).catch(() => {});
  }, []);

  async function reset() {
    if (resetState !== "confirm") { setResetState("confirm"); return; }
    try { await resetDemo(); setResetState("done"); } catch (e) { setError((e as Error).message); setResetState(""); }
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="px-6 py-4">
          <p className="eyebrow">Retailer Portal</p>
          <h1 className="text-xl font-black text-ink">Settings</h1>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-3xl">
        {error && <div className="alert-error" role="alert">{error}</div>}

        <div className="card">
          <h2 className="section-title mb-4">Connection</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Backend</dt><dd className="font-mono">{API_URL}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd className="font-semibold">{health ? "Live backend connected" : error ? "Unreachable" : "Checking…"}</dd></div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Investigation mode</dt>
              <dd className="font-semibold">
                {health?.mode === "adk" ? "Live AI (Google ADK + Gemini)" : health?.mode === "demo" ? "Deterministic demo investigation (no AI call)" : "—"}
              </dd>
            </div>
            <div className="flex justify-between"><dt className="text-slate-500">Payments</dt><dd className="font-semibold">Simulated only: no payment provider connected</dd></div>
          </dl>
        </div>

        <div className="card">
          <h2 className="section-title mb-1">Demo policy {policy ? `v${policy.version}` : ""}</h2>
          <p className="text-xs text-slate-500 mb-4">
            Read-only. Fictional operational rules for the demo, not statements of legal entitlement.
            {policy && ` Dates are evaluated as of ${policy.demo_today}.`}
          </p>
          <ul className="space-y-3">
            {policy?.rules.map((r) => (
              <li key={r.rule_id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-mono text-xs font-bold text-teal">{r.rule_id} · {r.issue_type}</p>
                <p className="mt-1 text-sm text-slate-700">{r.summary}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="section-title mb-2">Demo data</h2>
          <p className="text-xs text-slate-600 mb-4">Deletes every case and event in the disposable demo database and re-seeds the three demo orders.</p>
          <button onClick={reset} className={resetState === "confirm" ? "button bg-red-600 hover:bg-red-700" : "button-secondary"}>
            {resetState === "confirm" ? "Click again to confirm reset" : resetState === "done" ? "Demo data reset ✓" : "Reset demo data"}
          </button>
        </div>
      </div>
    </div>
  );
}
