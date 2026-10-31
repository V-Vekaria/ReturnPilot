"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CustomerNav from "../components/CustomerNav";
import { StatusBadge } from "../components/Badges";
import {
  loadComplaints,
  Complaint,
  ComplaintStatus,
  formatStatus,
  formatDate,
  formatDateTime,
  formatIssueType,
  formatResolution,
} from "../lib/mockData";

// ─── Status timeline config ───────────────────────────────────────────────────
const TIMELINE_STEPS: { key: ComplaintStatus; label: string; desc: string }[] = [
  { key: "submitted", label: "Submitted", desc: "Your complaint has been received." },
  { key: "under_review", label: "Under Review", desc: "A team member is reviewing your case." },
  { key: "investigating", label: "Investigation", desc: "The team is actively investigating your complaint." },
  { key: "pending_approval", label: "Decision Made", desc: "A decision has been prepared and is pending approval." },
  { key: "resolved", label: "Resolved", desc: "Your case has been resolved." },
];

const STATUS_ORDER: ComplaintStatus[] = [
  "submitted",
  "under_review",
  "investigating",
  "pending_approval",
  "resolved",
];

function getStepIndex(status: ComplaintStatus): number {
  if (status === "rejected" || status === "escalated") return 4;
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
}

// ─── Track form ───────────────────────────────────────────────────────────────
function TrackContent() {
  const params = useSearchParams();
  const [refInput, setRefInput] = useState(params.get("ref") || "");
  const [emailInput, setEmailInput] = useState(params.get("email") || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);

  // Auto-search if params pre-filled (coming from confirmation page)
  useEffect(() => {
    if (params.get("ref") && params.get("email")) {
      handleSearch(params.get("ref")!, params.get("email")!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(refOverride?: string, emailOverride?: string) {
    const ref = (refOverride ?? refInput).trim().toUpperCase();
    const email = (emailOverride ?? emailInput).trim().toLowerCase();

    const errs: Record<string, string> = {};
    if (!ref) errs.ref = "Please enter your complaint reference number.";
    if (!email) errs.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({});
    setSearching(true);
    setComplaint(null);
    setNotFound(false);

    await new Promise((r) => setTimeout(r, 600)); // simulate search

    const all = loadComplaints();
    const found = all.find(
      (c) => c.id.toUpperCase() === ref && c.customerEmail.toLowerCase() === email
    );

    if (found) {
      setComplaint(found);
    } else {
      setNotFound(true);
    }
    setSearching(false);
  }

  function handleRefresh() {
    if (complaint) handleSearch(complaint.id, complaint.customerEmail);
  }

  const stepIdx = complaint ? getStepIndex(complaint.status) : -1;
  const isFinal = complaint && (complaint.status === "resolved" || complaint.status === "rejected" || complaint.status === "escalated");

  return (
    <main className="shell py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="eyebrow">Customer Portal</p>
          <h1 className="mt-2 page-title">Track Your Complaint</h1>
          <p className="mt-3 text-slate-600">Enter your complaint reference number and email to see the latest status.</p>
        </div>

        {/* ── Lookup form ─────────────────────────────────────────────── */}
        <div className="card mb-8">
          <h2 className="section-title mb-5">Complaint lookup</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="input-group">
              <label className="label" htmlFor="ref">Complaint reference number <span className="text-red-500">*</span></label>
              <input id="ref" className={`input ${errors.ref ? "input-error" : ""}`}
                value={refInput} onChange={(e) => setRefInput(e.target.value)}
                placeholder="e.g. RP-2024-001"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              {errors.ref && <p className="error-msg">{errors.ref}</p>}
            </div>
            <div className="input-group">
              <label className="label" htmlFor="trackEmail">Email address <span className="text-red-500">*</span></label>
              <input id="trackEmail" type="email" className={`input ${errors.email ? "input-error" : ""}`}
                value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              {errors.email && <p className="error-msg">{errors.email}</p>}
            </div>
          </div>

          {/* Demo hints */}
          <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-xs font-semibold text-blue-800 mb-1">Demo tip</p>
            <p className="text-xs text-blue-700">
              Try: Reference <strong>RP-2024-001</strong> with email <strong>emma.thompson@email.com</strong>
            </p>
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={() => handleSearch()} disabled={searching} className="button">
              {searching ? (
                <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Searching…</>
              ) : "Track Complaint"}
            </button>
          </div>
        </div>

        {/* ── Not found ───────────────────────────────────────────────── */}
        {notFound && (
          <div className="card text-center py-10 animate-fade-in">
            <div className="mb-3 text-4xl">🔍</div>
            <h2 className="section-title mb-2">No complaint found</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              We couldn't find a complaint matching that reference and email. Please check the details and try again.
            </p>
          </div>
        )}

        {/* ── Complaint details ────────────────────────────────────────── */}
        {complaint && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow mb-1">Case {complaint.id}</p>
                  <h2 className="section-title">{complaint.complaintTitle}</h2>
                  <p className="text-sm text-slate-500 mt-1">Submitted {formatDateTime(complaint.submittedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={complaint.status} />
                  <button onClick={handleRefresh} className="button-icon" title="Refresh status">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Details grid */}
              <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  { label: "Retailer", value: complaint.retailerName },
                  { label: "Product", value: complaint.productName },
                  { label: "Issue type", value: formatIssueType(complaint.issueType) },
                  { label: "Preferred resolution", value: formatResolution(complaint.preferredResolution) },
                  { label: "Order number", value: complaint.orderNumber },
                  { label: "Purchase date", value: formatDate(complaint.purchaseDate) },
                ].map(({ label, value }) => (
                  <div key={label} className="border-b border-slate-100 pb-3">
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</dt>
                    <dd className="text-sm font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</dt>
                <dd className="text-sm text-slate-700 leading-relaxed">{complaint.description}</dd>
              </div>
            </div>

            {/* Status timeline */}
            <div className="card">
              <h2 className="section-title mb-6">Status timeline</h2>

              {/* Final states */}
              {complaint.status === "rejected" && (
                <div className="alert-error mb-6 flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 mt-0.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Complaint Rejected</p>
                    {complaint.decision?.customerExplanation && (
                      <p className="text-xs mt-1 text-red-700">{complaint.decision.customerExplanation}</p>
                    )}
                  </div>
                </div>
              )}
              {complaint.status === "escalated" && (
                <div className="mb-6 rounded-xl bg-orange-50 border border-orange-200 p-4 text-sm text-orange-800 flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Case Escalated</p>
                    <p className="text-xs mt-1">Your case has been escalated to a senior team for further review.</p>
                  </div>
                </div>
              )}
              {complaint.status === "resolved" && (
                <div className="alert-success mb-6 flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 mt-0.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Case Resolved</p>
                    {complaint.retailerResponse && (
                      <p className="text-xs mt-1 text-green-700">{complaint.retailerResponse}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Progress steps */}
              <ol className="relative space-y-0">
                {TIMELINE_STEPS.map((ts, i) => {
                  const completed = i < stepIdx;
                  const current = i === stepIdx && !isFinal;
                  const pending = !completed && !current;
                  return (
                    <li key={ts.key} className="flex gap-5 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                          completed ? "bg-teal text-white" :
                          current ? "bg-teal text-white ring-4 ring-teal/25 animate-pulse-teal" :
                          "bg-slate-100 text-slate-400"
                        }`}>
                          {completed ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : i + 1}
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && (
                          <div className={`mt-2 w-0.5 flex-1 min-h-[20px] ${completed ? "bg-teal" : "bg-slate-200"}`} />
                        )}
                      </div>
                      <div className={`pb-4 pt-1 ${pending ? "opacity-50" : ""}`}>
                        <p className={`font-semibold text-sm ${current ? "text-teal" : completed ? "text-ink" : "text-slate-400"}`}>
                          {ts.label}
                          {current && <span className="ml-2 text-xs font-normal text-teal bg-teal/10 rounded-full px-2 py-0.5">Current</span>}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{ts.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Activity log */}
            {complaint.timeline.length > 0 && (
              <div className="card">
                <h2 className="section-title mb-5">Latest updates</h2>
                <ol className="space-y-4">
                  {[...complaint.timeline].reverse().map((event) => (
                    <li key={event.id} className="flex gap-4">
                      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        event.actorRole === "customer" ? "bg-blue-100 text-blue-700" :
                        event.actorRole === "retailer" ? "bg-teal/10 text-teal" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {event.actorRole === "customer" ? "C" : event.actorRole === "retailer" ? "R" : "S"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-ink">{event.event}</p>
                          <p className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(event.timestamp)}</p>
                        </div>
                        {event.note && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{event.note}</p>}
                        <p className="text-xs text-slate-400 mt-0.5">{event.actor}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Retailer response */}
            {complaint.retailerResponse && (
              <div className="card border-teal/20 bg-pale">
                <h2 className="section-title mb-3">Retailer response</h2>
                <p className="text-sm text-slate-700 leading-relaxed">{complaint.retailerResponse}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function TrackCasePage() {
  return (
    <div className="min-h-screen bg-sand">
      <CustomerNav active="/track-case" />
      <Suspense fallback={<div className="shell py-20 text-center text-slate-400">Loading…</div>}>
        <TrackContent />
      </Suspense>
    </div>
  );
}
