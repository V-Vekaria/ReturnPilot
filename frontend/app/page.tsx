"use client";

import { useEffect, useState } from "react";
import { api, Case, money, Order, title } from "./api";

const scenarios = [
  { id: "RP-1001", issue: "damaged_item", label: "Damaged item", text: "My headphones arrived with a cracked earcup." },
  { id: "RP-1002", issue: "disputed_delivery", label: "Disputed delivery", text: "Tracking says delivered, but I have not received the lamp." },
  { id: "RP-1003", issue: "change_of_mind", label: "Change of mind", text: "I would like to return the tote bag." },
] as const;

export default function CustomerPortal() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState("RP-1001");
  const [issue, setIssue] = useState("damaged_item");
  const [description, setDescription] = useState<string>(scenarios[0].text);
  const [result, setResult] = useState<Case | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<Order[]>("/api/orders", "customer").then(setOrders).catch(e => setError(e.message)); }, []);
  const selected = orders.find(order => order.id === orderId);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setResult(null);
    try { setResult(await api<Case>("/api/cases", "customer", { method: "POST", body: JSON.stringify({ order_id: orderId, issue_type: issue, description }) })); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="shell py-12 sm:py-16">
    <div className="mb-10 max-w-3xl"><p className="eyebrow">Customer Portal</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Tell us what happened.</h1><p className="mt-4 text-lg text-slate-600">Submit an issue with a sample order. ReturnPilot gathers the facts and prepares a recommendation for retailer review.</p></div>
    <div className="grid gap-7 lg:grid-cols-[1.45fr_1fr]">
      <form onSubmit={submit} className="card space-y-6"><div><p className="eyebrow">01 / Your issue</p><h2 className="mt-2 text-2xl font-bold">Report a problem</h2></div>
        <div><label className="label" htmlFor="order">Order</label><select className="input" id="order" value={orderId} onChange={e => setOrderId(e.target.value)}>{orders.map(order => <option key={order.id} value={order.id}>{order.id} · {order.item} · {money(order.amount_pence)}</option>)}</select></div>
        <div><label className="label" htmlFor="issue">Issue type</label><select className="input" id="issue" value={issue} onChange={e => setIssue(e.target.value)}>{scenarios.map(s => <option key={s.issue} value={s.issue}>{s.label}</option>)}</select></div>
        <div><label className="label" htmlFor="description">What happened?</label><textarea className="input min-h-32" id="description" minLength={10} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} /></div>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        <button className="button w-full" disabled={busy || !selected}>{busy ? "Investigating…" : "Submit complaint"}</button>
      </form>
      <div className="space-y-7"><section className="card"><p className="eyebrow">Demo scenarios</p><h2 className="mt-2 text-xl font-bold">Try a sample case</h2><div className="mt-5 space-y-3">{scenarios.map(s => <button type="button" key={s.id} onClick={() => { setOrderId(s.id); setIssue(s.issue); setDescription(s.text); setResult(null); }} className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-teal hover:bg-pale"><span className="block font-semibold">{s.label}</span><span className="text-sm text-slate-500">{s.id}</span></button>)}</div></section>
      {selected && <section className="card"><p className="eyebrow">Recorded order facts</p><h2 className="mt-2 text-xl font-bold">{selected.item}</h2><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Paid</dt><dd className="font-semibold">{money(selected.amount_pence)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Delivery</dt><dd className="font-semibold">{title(selected.delivery_status)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Proof</dt><dd className="text-right font-semibold">{title(selected.proof_of_delivery)}</dd></div></dl></section>}</div>
    </div>
    {result && <section aria-live="polite" className="card mt-8 border-teal/30 bg-pale"><p className="eyebrow">02 / Submitted</p><h2 className="mt-2 text-2xl font-bold">Case {result.id}</h2><p className="mt-3 text-slate-700">Your case is awaiting retailer review. No financial action has been taken.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Recommendation</p><p className="mt-2 font-semibold">{title(result.recommendation)}</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold uppercase text-slate-500">Why</p><p className="mt-2 text-sm">{result.policy_reason}</p></div></div></section>}
  </main>;
}
