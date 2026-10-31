"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "../../components/Badges";
import { Complaint, formatDateTime } from "../../lib/mockData";
import { AuditEvent, getEvents, listCases } from "../../lib/api";

export default function AuditLogPage() {
  const [cases, setCases] = useState<Complaint[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listCases()
      .then((all) => { setCases(all); if (all[0]) setSelectedId(all[0].id); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    getEvents(selectedId).then(setEvents).catch((e) => setError(e.message));
  }, [selectedId]);

  const selected = cases.find((c) => c.id === selectedId);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="px-6 py-4">
          <p className="eyebrow">Retailer Portal</p>
          <h1 className="text-xl font-black text-ink">Audit Log</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && <div className="alert-error" role="alert">{error}</div>}
        <div className="card">
          <label className="label" htmlFor="caseSelect">Case</label>
          {cases.length === 0 ? (
            <p className="text-sm text-slate-400">No cases yet.</p>
          ) : (
            <select id="caseSelect" className="input max-w-md" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.orderNumber} · {c.status.replace("_", " ")}</option>)}
            </select>
          )}
          {selected && (
            <div className="mt-4 flex items-center gap-3">
              <StatusBadge status={selected.status} />
              <Link href={`/retailer/cases/${selected.id}`} className="text-sm font-semibold text-teal hover:underline">Open case →</Link>
            </div>
          )}
        </div>

        {selected && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Time</th><th>Actor</th><th>Event</th><th>Detail</th></tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="font-mono text-xs">{e.id}</td>
                    <td className="text-xs whitespace-nowrap">{formatDateTime(e.at)}</td>
                    <td className="text-xs">{e.actor}</td>
                    <td className="font-mono text-xs">{e.type}</td>
                    <td className="text-xs text-slate-600">{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-400">Append-only application history stored by the backend. This demo audit is not cryptographically tamper-proof.</p>
      </div>
    </div>
  );
}
