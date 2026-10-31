"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge, PriorityBadge } from "../../../../components/Badges";
import Modal from "../../../../components/Modal";
import { useToast } from "../../../../components/Toast";
import {
  Complaint,
  formatIssueType,
  formatResolution,
  formatDateTime,
  formatDate,
} from "../../../../lib/mockData";
import { ApiError, decideCase, formatPence, getStaffCase } from "../../../../lib/api";

type DecisionType = "approve_refund" | "reject" | "escalate";

const DECISION_OPTIONS: { type: DecisionType; label: string; icon: string; color: string }[] = [
  { type: "approve_refund", label: "Approve simulated refund", icon: "💰", color: "bg-green-50 border-green-300 hover:bg-green-100 text-green-900" },
  { type: "reject", label: "Reject Complaint", icon: "✕", color: "bg-red-50 border-red-300 hover:bg-red-100 text-red-900" },
  { type: "escalate", label: "Escalate Case", icon: "⬆️", color: "bg-purple-50 border-purple-300 hover:bg-purple-100 text-purple-900" },
];
const TO_BACKEND = { approve_refund: "approve", reject: "reject", escalate: "escalate" } as const;

const ESCALATION_REASONS = [
  "High-value dispute requiring senior review",
  "Legal or regulatory implications",
  "Repeated complaint from same customer",
  "Courier investigation required",
  "Customer threatening legal action",
  "Policy ambiguity",
];

const ESCALATION_TEAMS = [
  "Senior Resolution Team",
  "Legal & Compliance",
  "Fraud & Security",
  "Executive Complaints",
  "Logistics & Courier Disputes",
];

export default function DecisionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [selectedType, setSelectedType] = useState<DecisionType | null>(null);
  const [reason, setReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [customerExplanation, setCustomerExplanation] = useState("");
  const [evidenceConfirmed, setEvidenceConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationTeam, setEscalationTeam] = useState("");
  const [escalationNote, setEscalationNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);

  async function load() {
    try { setComplaint(await getStaffCase(id)); } catch { setComplaint(null); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!selectedType) { errs.type = "Please select a decision type."; }
    if (reason.trim().length < 10) errs.reason = "Give a reason of at least 10 characters.";
    else if (reason.trim().length > 350) errs.reason = "Keep the reason under 350 characters.";
    if (!customerExplanation.trim()) errs.customerExplanation = "A customer-facing explanation is required.";
    if (selectedType === "approve_refund" && complaint?.issueType === "damaged_product" && !evidenceConfirmed)
      errs.evidence = "Confirm you have reviewed the damage evidence before approving.";
    if (selectedType === "escalate") {
      if (!escalationReason) errs.escalationReason = "Please select an escalation reason.";
      if (!escalationTeam) errs.escalationTeam = "Please select a destination team.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function openConfirm() {
    if (validate()) setConfirmOpen(true);
  }

  async function confirmDecision() {
    if (!complaint || !selectedType || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    const parts = [reason.trim()];
    if (selectedType === "escalate") parts.push(`Escalated to ${escalationTeam}: ${escalationReason}.`);
    if (internalNote.trim()) parts.push(`Note: ${internalNote.trim()}`);
    if (escalationNote.trim()) parts.push(`Escalation note: ${escalationNote.trim()}`);
    try {
      const updated = await decideCase(complaint.id, {
        decision: TO_BACKEND[selectedType],
        note: parts.join(" ").slice(0, 500),
        customer_message: customerExplanation.trim(),
        evidence_confirmed: selectedType === "approve_refund" ? evidenceConfirmed : false,
      });
      setComplaint(updated);
      setConfirmOpen(false);
      // Report what the backend recorded, not an optimistic message
      showToast(updated.resolutionRef
        ? `Approved. Simulated refund ${formatPence(updated.resolutionAmountPence)} recorded (${updated.resolutionRef}).`
        : `Decision recorded: case is now ${updated.status.replace("_", " ")}.`, "success");
      setTimeout(() => router.push(`/retailer/cases/${id}`), 1500);
    } catch (err) {
      setConfirmOpen(false);
      setSubmitError(err instanceof ApiError && err.status === 409
        ? `${err.message}. The case has been refreshed; review it before deciding again.`
        : (err as Error).message);
      if (err instanceof ApiError && err.status === 409) { setSelectedType(null); await load(); }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-400">Loading case…</div>;

  if (!complaint) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-400">Case not found.</p>
        <Link href="/retailer/cases" className="button mt-4">← Back to cases</Link>
      </div>
    );
  }

  const isEscalation = selectedType === "escalate";
  const isRefund = selectedType === "approve_refund";
  const canDecide = complaint.status === "pending_approval";
  const refundAvailable = complaint.recommendation === "refund" && !!complaint.proposedAmountPence;
  const needsEvidenceConfirmation = complaint.issueType === "damaged_product";
  const decisionLabel = DECISION_OPTIONS.find((d) => d.type === selectedType)?.label ?? "";

  return (
    <div className="min-h-screen">
      <ToastContainer />

      {/* Confirmation modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Decision">
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Decision</span>
              <span className="font-bold">{decisionLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Case</span>
              <span className="font-mono font-bold">{complaint.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer</span>
              <span className="font-medium">{complaint.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Order</span>
              <span className="font-mono font-bold">{complaint.orderNumber}</span>
            </div>
            {isRefund && (
              <div className="flex justify-between">
                <span className="text-slate-500">Refund amount (stored proposal)</span>
                <span className="font-bold text-green-700">{formatPence(complaint.proposedAmountPence)} GBP</span>
              </div>
            )}
            {isRefund && needsEvidenceConfirmation && (
              <div className="flex justify-between">
                <span className="text-slate-500">Evidence confirmed</span>
                <span className="font-medium">{evidenceConfirmed ? "Yes" : "No"}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-600">
            This updates the case and the customer&apos;s tracking page. Approval runs a simulated refund only: no real payment is processed.
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={confirmDecision} disabled={submitting} className="button flex-1">
              {submitting ? (
                <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Recording…</>
              ) : "Confirm Decision"}
            </button>
            <button onClick={() => setConfirmOpen(false)} className="button-secondary flex-1">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/retailer/cases/${id}`} className="button-icon">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <p className="eyebrow">Approval & Escalation</p>
              <h1 className="text-xl font-black text-ink">{complaint.id}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>
      </div>

      {submitError && <div className="mx-6 mt-6 alert-error" role="alert">{submitError}</div>}

      {/* Decision not available banner */}
      {!canDecide && (
        <div className="mx-6 mt-6 alert-warning flex items-center gap-3">
          <svg className="h-5 w-5 shrink-0 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            {complaint.decision
              ? `A decision has already been recorded (${formatDateTime(complaint.decision.decidedAt)}). Decisions cannot be repeated.`
              : "This case is not awaiting review yet. Run the investigation from the case page first."}
          </span>
        </div>
      )}

      <div className="p-6 grid gap-6 xl:grid-cols-3">
        {/* ── Left: decision form ──────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          {/* Decision type selector */}
          {canDecide && <div className="card">
            <h2 className="section-title mb-4">Select a decision</h2>
            {errors.type && <p className="error-msg mb-3">{errors.type}</p>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DECISION_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  disabled={option.type === "approve_refund" && !refundAvailable}
                  title={option.type === "approve_refund" && !refundAvailable ? "The proposal does not recommend a refund. Escalate or reject instead." : undefined}
                  onClick={() => { setSelectedType(option.type); setErrors({}); setSubmitError(""); }}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                    selectedType === option.type
                      ? option.color + " ring-2 ring-offset-1 ring-teal/40"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="text-sm font-semibold">{option.label}</span>
                </button>
              ))}
            </div>
            {!refundAvailable && (
              <p className="mt-3 text-xs text-slate-500">Refund approval is unavailable: the proposal recommends investigation, not a refund.</p>
            )}
          </div>}

          {/* Decision form */}
          {canDecide && selectedType && (
            <div className="card space-y-5 animate-fade-in">
              <h2 className="section-title">Decision details</h2>

              <div className="input-group">
                <label className="label" htmlFor="reason">Reason for decision <span className="text-red-500">*</span></label>
                <textarea id="reason" rows={3} className={`input ${errors.reason ? "input-error" : ""}`}
                  placeholder="Explain the internal rationale for this decision..."
                  value={reason} onChange={(e) => setReason(e.target.value)} />
                {errors.reason && <p className="error-msg">{errors.reason}</p>}
              </div>

              <div className="input-group">
                <label className="label" htmlFor="internalNote">Internal notes (optional)</label>
                <textarea id="internalNote" rows={2} className="input"
                  placeholder="Any additional internal notes not shared with the customer..."
                  value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
              </div>

              <div className="input-group">
                <label className="label" htmlFor="customerExplanation">Customer-facing explanation <span className="text-red-500">*</span></label>
                <textarea id="customerExplanation" rows={3}
                  className={`input ${errors.customerExplanation ? "input-error" : ""}`}
                  placeholder="This message will be visible to the customer in their tracking view..."
                  value={customerExplanation} onChange={(e) => setCustomerExplanation(e.target.value)} />
                {errors.customerExplanation && <p className="error-msg">{errors.customerExplanation}</p>}
              </div>

              {isRefund && (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 space-y-3">
                  <p className="text-sm">
                    Simulated refund of <strong>{formatPence(complaint.proposedAmountPence)}</strong>, taken from the stored proposal (not editable). No real payment will be processed.
                  </p>
                  {needsEvidenceConfirmation && (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={evidenceConfirmed} onChange={(e) => setEvidenceConfirmed(e.target.checked)}
                        className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-teal" />
                      <span className="text-sm text-slate-700">
                        I have reviewed the customer&apos;s damage evidence and confirm the defect. The evidence is customer-supplied and has not been verified automatically.
                      </span>
                    </label>
                  )}
                  {errors.evidence && <p className="error-msg">{errors.evidence}</p>}
                </div>
              )}

              {/* Escalation workflow */}
              {isEscalation && (
                <div className="rounded-xl bg-purple-50 border border-purple-200 p-5 space-y-4 animate-fade-in">
                  <h3 className="font-bold text-purple-900">Escalation details</h3>

                  <div className="input-group">
                    <label className="label" htmlFor="escalationReason">Escalation reason <span className="text-red-500">*</span></label>
                    <select id="escalationReason" className={`input ${errors.escalationReason ? "input-error" : ""}`}
                      value={escalationReason} onChange={(e) => setEscalationReason(e.target.value)}>
                      <option value="">Select a reason</option>
                      {ESCALATION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {errors.escalationReason && <p className="error-msg">{errors.escalationReason}</p>}
                  </div>

                  <div className="input-group">
                    <label className="label" htmlFor="escalationTeam">Destination team <span className="text-red-500">*</span></label>
                    <select id="escalationTeam" className={`input ${errors.escalationTeam ? "input-error" : ""}`}
                      value={escalationTeam} onChange={(e) => setEscalationTeam(e.target.value)}>
                      <option value="">Select a team</option>
                      {ESCALATION_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {errors.escalationTeam && <p className="error-msg">{errors.escalationTeam}</p>}
                  </div>

                  <div className="input-group">
                    <label className="label" htmlFor="escalationNote">Escalation notes</label>
                    <textarea id="escalationNote" rows={3} className="input"
                      placeholder="Provide context for the receiving team..."
                      value={escalationNote} onChange={(e) => setEscalationNote(e.target.value)} />
                  </div>
                </div>
              )}

              <button onClick={openConfirm} className="button w-full">
                {decisionLabel} →
              </button>
            </div>
          )}
        </div>

        {/* ── Right: case summary ──────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Case summary */}
          <div className="card">
            <h2 className="section-title mb-4">Complaint summary</h2>
            <dl className="space-y-3">
              {[
                { label: "Customer", value: complaint.customerName },
                { label: "Product", value: complaint.productName },
                { label: "Issue", value: formatIssueType(complaint.issueType) },
                { label: "Requested resolution", value: formatResolution(complaint.preferredResolution) },
                { label: "Submitted", value: formatDate(complaint.submittedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 text-sm">
                  <dt className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">{label}</dt>
                  <dd className="font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Investigation findings */}
          {complaint.investigationNotes && (
            <div className="card border-teal/20 bg-teal/5">
              <h2 className="section-title mb-3">Investigation findings</h2>
              <p className="text-sm text-slate-700 leading-relaxed">{complaint.investigationNotes}</p>
              {complaint.policyReason && <p className="mt-3 text-xs text-slate-600"><strong>Policy:</strong> {complaint.policyReason}</p>}
            </div>
          )}

          {/* Supporting evidence */}
          {complaint.evidenceFiles.length > 0 && (
            <div className="card">
              <h2 className="section-title mb-3">Evidence files ({complaint.evidenceFiles.length})</h2>
              <ul className="space-y-2">
                {complaint.evidenceFiles.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                    <svg className="h-4 w-4 text-teal shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Previous decision */}
          {complaint.decision && (
            <div className="card bg-slate-50 border-slate-200">
              <h2 className="section-title mb-3">Previous decision</h2>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Decision</span>
                  <span className="font-semibold">{DECISION_OPTIONS.find((d) => d.type === complaint.decision?.type)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">By</span>
                  <span className="font-semibold">{complaint.decision.decidedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">At</span>
                  <span className="font-semibold">{formatDateTime(complaint.decision.decidedAt)}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500">{complaint.decision.reason}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
