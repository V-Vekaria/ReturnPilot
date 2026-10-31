"use client";

import { useCallback, useEffect, useState } from "react";
import { api, Audit, Case, money, title } from "../api";

export default function RetailerDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { const data = await api<Case[]>("/api/cases", "retailer"); setCases(data); setSelectedId(current => current && data.some(item => item.id === current) ? current : data[0]?.id || null); setError(""); }
    catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (selectedId) api<Audit[]>(`/api/cases/${selectedId}/audit`, "retailer").then(setAudit).catch(e => setError(e.message)); else setAudit([]); }, [selectedId, cases]);
  const selected = cases.find(item => item.id === selectedId);
  const pending = cases.filter(item => item.status === "pending_review").length;
  async function decide(decision: "approve" | "reject") {
    if (!selected) return;
    setBusy(true); setError("");
    try { await api<Case>(`/api/cases/${selected.id}/approve`, "retailer", { method: "POST", body: JSON.stringify({ decision, note: "Reviewed in ReturnPilot demo" }) }); await load(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="shell py-12 sm:py-16">
    <div className="mb-10 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Retailer Dashboard</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Resolution queue</h1><p className="mt-4 max-w-2xl text-lg text-slate-600">Review recorded facts, policy guidance and gaps before approving an action.</p></div><button onClick={load} className="button-secondary">Refresh cases</button></div>
    <div className="mb-7 grid gap-4 sm:grid-cols-3"><div className="card"><p className="eyebrow">All cases</p><p className="mt-2 text-3xl font-black">{cases.length}</p></div><div className="card"><p className="eyebrow">Awaiting review</p><p className="mt-2 text-3xl font-black text-teal">{pending}</p></div><div className="card"><p className="eyebrow">Financial action</p><p className="mt-2 text-sm font-semibold">Server approval required</p></div></div>
    {error && <p role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <div className="grid gap-7 lg:grid-cols-[0.85fr_1.6fr]">
      <section className="card h-fit"><h2 className="text-xl font-bold">Cases</h2>{cases.length === 0 ? <p className="mt-5 text-sm text-slate-500">No complaints yet. Submit one in the Customer Portal, then refresh.</p> : <div className="mt-5 space-y-3">{cases.map(item => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl border p-4 text-left transition ${item.id === selectedId ? "border-teal bg-pale" : "border-slate-200 hover:border-teal"}`}><span className="flex justify-between gap-2"><span className="font-semibold">{title(item.issue_type)}</span><span className="text-xs text-slate-500">{item.order_id}</span></span><span className="mt-2 block text-xs text-slate-500">{item.id} · {title(item.status)}</span></button>)}</div>}</section>
      {selected && <div className="space-y-6"><section className="card"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Investigation</p><h2 className="mt-2 text-2xl font-bold">{title(selected.issue_type)}</h2><p className="mt-1 text-sm text-slate-500">{selected.id} · {selected.order_id}</p></div><span className="rounded-full bg-pale px-3 py-2 text-xs font-bold text-teal">{title(selected.status)}</span></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-sand p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Customer report</p><p className="mt-2 text-sm">{selected.description}</p></div><div className="rounded-xl bg-sand p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Recommendation</p><p className="mt-2 font-semibold">{title(selected.recommendation)}</p>{selected.proposed_amount_pence > 0 && <p className="mt-1 text-sm">Proposed: {money(selected.proposed_amount_pence)}</p>}</div></div>
        <div className="mt-6"><h3 className="font-bold">Recorded facts and gaps</h3><p className="mt-2 text-sm leading-6 text-slate-700">{selected.investigation}</p></div><div className="mt-6"><h3 className="font-bold">Demo policy rationale</h3><p className="mt-2 text-sm leading-6 text-slate-700">{selected.policy_reason}</p><p className="mt-2 text-xs text-slate-500">Fictional merchant policy. This is not a conclusive legal determination.</p></div>
        {selected.status === "pending_review" && <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-200 pt-6"><button className="button" disabled={busy} onClick={() => decide("approve")}>{busy ? "Saving…" : selected.recommendation === "refund" ? "Approve simulated refund" : "Approve next step"}</button><button className="button-secondary" disabled={busy} onClick={() => decide("reject")}>Reject recommendation</button></div>}
        {selected.status === "approved" && selected.recommendation === "refund" && <p className="mt-6 rounded-xl bg-pale p-4 text-sm font-semibold text-teal">Simulated refund recorded. No payment was processed.</p>}
      </section><section className="card"><h2 className="text-xl font-bold">Audit timeline</h2><ol className="mt-5 space-y-4">{audit.map(event => <li key={event.id} className="border-l-2 border-teal pl-4"><p className="text-sm font-semibold">{title(event.event_type)}</p><p className="mt-1 text-xs text-slate-500">{event.actor} · {new Date(event.created_at).toLocaleString()}</p></li>)}</ol></section></div>}
    </div>
  </main>;
}
