"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge, PriorityBadge } from "../../../components/Badges";
import { useToast } from "../../../components/Toast";
import {
  Complaint,
  formatDate,
  formatDateTime,
  formatIssueType,
  formatResolution,
} from "../../../lib/mockData";
import { ApiError, formatPence, getStaffCase, startInvestigation } from "../../../lib/api";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast, ToastContainer } = useToast();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [investigating, setInvestigating] = useState(false);
  const [runError, setRunError] = useState("");

  async function load() {
    try {
      setComplaint(await getStaffCase(id));
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof ApiError && err.status === 404 ? "Case not found." : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function runInvestigation() {
    if (!complaint || investigating) return;
    setInvestigating(true);
    setRunError("");
    try {
      setComplaint(await startInvestigation(complaint.id));
      showToast("Investigation complete. Proposal ready for review.", "success");
    } catch (err) {
      // Show the real failure; the backend leaves the case open with no invented findings
      setRunError((err as Error).message);
      await load();
    } finally {
      setInvestigating(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-400">Loading case…</div>;

  if (!complaint) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-400">{loadError || "Case not found."}</p>
        <Link href="/retailer/cases" className="button mt-4">← Back to cases</Link>
      </div>
    );
  }

  const lastEvent = complaint.timeline[complaint.timeline.length - 1];
  const lastRunFailed = complaint.status === "submitted" && lastEvent?.event === "Investigation failed";
  const canDecide = complaint.status === "pending_approval";

  return (
    <div className="min-h-screen">
      <ToastContainer />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/retailer/cases" className="button-icon" aria-label="Back to cases">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <p className="eyebrow">Case Investigation</p>
              <h1 className="text-xl font-black text-ink">{complaint.id} · {complaint.orderNumber}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            {canDecide && (
              <Link href={`/retailer/cases/${complaint.id}/decision`} className="button">
                Make Decision →
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 grid gap-6 xl:grid-cols-3">
        {/* ── Left column ──────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card">
            <h2 className="section-title mb-5">{complaint.complaintTitle}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Submitted", value: formatDateTime(complaint.submittedAt) },
                { label: "Last updated", value: formatDateTime(complaint.updatedAt) },
                { label: "Order number", value: complaint.orderNumber },
                { label: "Order total (recorded)", value: formatPence(complaint.orderAmountPence) },
                { label: "Purchase date", value: formatDate(complaint.purchaseDate) },
                { label: "Retailer", value: complaint.retailerName },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</dt>
                  <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="section-title mb-4">Customer information</h2>
            <p className="font-semibold text-ink">{complaint.customerName}</p>
            <p className="text-sm text-slate-500">{complaint.customerEmail || "No email supplied"}</p>
            {complaint.customerPhone && <p className="text-sm text-slate-500">{complaint.customerPhone}</p>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 border-t border-slate-100 pt-5">
              {[
                { label: "Product (as stated)", value: complaint.productName },
                { label: "Issue type", value: formatIssueType(complaint.issueType) },
                { label: "Requested resolution", value: formatResolution(complaint.preferredResolution) },
                { label: "Category", value: complaint.productCategory },
              ].map(({ label, value }) => (
                <div key={label} className="text-sm">
                  <span className="text-slate-500">{label}: </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">A requested resolution is not an authorisation.</p>
          </div>

          <div className="card">
            <h2 className="section-title mb-3">Complaint description</h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-ink mb-1">Supporting evidence</h3>
              <p className="text-xs text-slate-500 mb-3">Supplied by the customer. Not uploaded or verified: review required.</p>
              {complaint.evidenceFiles.length === 0 ? (
                <p className="text-sm text-slate-400">No evidence supplied.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {complaint.evidenceFiles.map((file) => (
                    <li key={file} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="text-xs font-medium truncate">{file}</span>
                      <span className="ml-auto text-[10px] font-semibold uppercase text-orange-700">Supplied</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Investigation findings */}
          <div className="card">
            <h2 className="section-title mb-3">Investigation findings</h2>
            {complaint.investigationSummary ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{complaint.investigationSummary}</p>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Policy result (fictional demo rule)</p>
                  <p className="text-sm text-ink">{complaint.policyReason}</p>
                </div>
              </div>
            ) : complaint.status === "investigating" || investigating ? (
              <p className="text-sm text-slate-500">Investigation in progress…</p>
            ) : (
              <p className="text-sm text-slate-400">Pending: no investigation has completed for this case yet.</p>
            )}
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {(complaint.status === "submitted" || complaint.status === "investigating") && (
            <div className="card">
              <h2 className="section-title mb-2">Investigation</h2>
              <p className="text-xs text-slate-600 mb-4">
                Checks the recorded order and delivery facts and applies the demo policy. It produces a proposal only; nothing is approved or paid.
              </p>
              {(runError || lastRunFailed) && (
                <div className="alert-error mb-4 text-sm" role="alert">
                  {runError || "The last investigation failed. The case is still open; retry or escalate after review."}
                </div>
              )}
              <button onClick={runInvestigation} disabled={investigating || complaint.status === "investigating"} className="button w-full">
                {investigating || complaint.status === "investigating" ? (
                  <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Investigating…</>
                ) : lastRunFailed || runError ? "Retry investigation" : "Start investigation"}
              </button>
            </div>
          )}

          {complaint.recommendation && (
            <div className={`card ${complaint.recommendation === "refund" ? "bg-amber-50 border-amber-200" : ""}`}>
              <h2 className="section-title mb-3">Proposal</h2>
              {complaint.recommendation === "refund" ? (
                <>
                  <p className="text-sm text-slate-600">Proposed refund</p>
                  <p className="text-2xl font-black text-ink">{formatPence(complaint.proposedAmountPence)}</p>
                  <p className="mt-1 text-xs text-slate-500">Taken from the recorded order total, not the complaint text.</p>
                </>
              ) : (
                <p className="text-sm text-ink font-semibold">Investigate: manual review recommended. No refund is proposed.</p>
              )}
              {canDecide && <p className="mt-3 text-xs font-semibold text-amber-800">Requires staff approval.</p>}
              {complaint.resolutionRef && (
                <p className="mt-3 text-xs text-green-700">
                  Simulated refund executed: {formatPence(complaint.resolutionAmountPence)} (ref {complaint.resolutionRef}). No real payment was made.
                </p>
              )}
            </div>
          )}

          {complaint.decision && (
            <div className="card bg-slate-50 border-slate-200">
              <h2 className="section-title mb-2">Recorded decision</h2>
              <p className="text-sm text-ink">{complaint.decision.reason}</p>
              {complaint.decision.customerExplanation && (
                <p className="mt-2 text-xs text-slate-500">Customer message: {complaint.decision.customerExplanation}</p>
              )}
              <p className="mt-2 text-[11px] text-slate-400">{formatDateTime(complaint.decision.decidedAt)}</p>
            </div>
          )}

          <div className="card">
            <h2 className="section-title mb-4">Activity</h2>
            <ol className="space-y-4">
              {[...complaint.timeline].reverse().map((event) => (
                <li key={event.id} className="flex gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    event.actorRole === "customer" ? "bg-blue-100 text-blue-700" :
                    event.actorRole === "retailer" ? "bg-teal/10 text-teal" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {event.actorRole === "customer" ? "C" : event.actorRole === "retailer" ? "R" : "S"}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-ink leading-tight">{event.event}</p>
                    {event.note && event.note !== event.event && <p className="text-xs text-slate-500 mt-0.5">{event.note}</p>}
                    <p className="text-[11px] text-slate-400 mt-0.5">{event.actor} · {formatDateTime(event.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {canDecide && (
            <div className="card bg-gradient-to-br from-teal/5 to-pale border-teal/20">
              <h2 className="text-sm font-bold text-ink mb-2">Ready to decide?</h2>
              <p className="text-xs text-slate-600 mb-4">Approve the proposal, reject, or escalate for manual review.</p>
              <Link href={`/retailer/cases/${complaint.id}/decision`} className="button w-full justify-center">
                Go to Decision →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
