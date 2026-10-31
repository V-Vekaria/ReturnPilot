"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge, PriorityBadge } from "../../../../components/Badges";
import Modal from "../../../../components/Modal";
import { useToast } from "../../../../components/Toast";
import {
  getComplaint,
  upsertComplaint,
  Complaint,
  Decision,
  formatIssueType,
  formatResolution,
  formatDateTime,
  formatDate,
  TEAM_MEMBERS,
} from "../../../../lib/mockData";

type DecisionType = Decision["type"];

const DECISION_OPTIONS: { type: DecisionType; label: string; icon: string; color: string }[] = [
  { type: "approve_refund", label: "Approve Refund", icon: "💰", color: "bg-green-50 border-green-300 hover:bg-green-100 text-green-900" },
  { type: "approve_replacement", label: "Approve Replacement", icon: "📦", color: "bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-900" },
  { type: "approve_repair", label: "Approve Repair", icon: "🔧", color: "bg-yellow-50 border-yellow-300 hover:bg-yellow-100 text-yellow-900" },
  { type: "reject", label: "Reject Complaint", icon: "✕", color: "bg-red-50 border-red-300 hover:bg-red-100 text-red-900" },
  { type: "request_info", label: "Request More Info", icon: "❓", color: "bg-orange-50 border-orange-300 hover:bg-orange-100 text-orange-900" },
  { type: "escalate", label: "Escalate Case", icon: "⬆️", color: "bg-purple-50 border-purple-300 hover:bg-purple-100 text-purple-900" },
];

const ESCALATION_REASONS = [
  "High-value dispute requiring senior review",
  "Legal or regulatory implications",
  "Repeated complaint from same customer",
  "Courier investigation required",
  "Fraud suspected",
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
  const [refundAmount, setRefundAmount] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const [escalationTeam, setEscalationTeam] = useState("");
  const [escalationNote, setEscalationNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const c = getComplaint(id);
    if (c) setComplaint(c);
  }, [id]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!selectedType) { errs.type = "Please select a decision type."; }
    if (!reason.trim()) errs.reason = "A reason for this decision is required.";
    if (!customerExplanation.trim()) errs.customerExplanation = "A customer-facing explanation is required.";
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
    if (!complaint || !selectedType) return;
    setSubmitting(true);

    await new Promise((r) => setTimeout(r, 800));

    const now = new Date().toISOString();
    const newStatus =
      selectedType === "escalate" ? "escalated" :
      selectedType === "reject" || selectedType === "request_info" ? "rejected" :
      selectedType === "approve_refund" || selectedType === "approve_replacement" || selectedType === "approve_repair" ? "resolved" :
      "pending_approval";

    const decisionLabel = DECISION_OPTIONS.find((d) => d.type === selectedType)?.label ?? selectedType;

    const decision: Decision = {
      type: selectedType,
      reason: reason.trim(),
      internalNote: internalNote.trim() || undefined,
      customerExplanation: customerExplanation.trim(),
      refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
      escalationReason: escalationReason || undefined,
      escalationTeam: escalationTeam || undefined,
      escalationNote: escalationNote.trim() || undefined,
      decidedBy: "You (Retailer)",
      decidedAt: now,
    };

    const updated: Complaint = {
      ...complaint,
      status: newStatus,
      decision,
      retailerResponse: customerExplanation.trim(),
      updatedAt: now,
      timeline: [
        ...complaint.timeline,
        {
          id: `t-${Date.now()}`,
          timestamp: now,
          actor: "You (Retailer)",
          actorRole: "retailer",
          event: `Decision: ${decisionLabel}`,
          note: reason.trim(),
        },
        {
          id: `t-sys-${Date.now()}`,
          timestamp: now,
          actor: "System",
          actorRole: "system",
          event: `Status changed to ${newStatus.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
        },
      ],
    };

    upsertComplaint(updated);
    setComplaint(updated);
    setConfirmOpen(false);
    setSubmitting(false);
    showToast(`Decision recorded: ${decisionLabel}`, "success");

    // Navigate back to case detail after short delay
    setTimeout(() => router.push(`/retailer/cases/${id}`), 1500);
  }

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
            {isRefund && refundAmount && (
              <div className="flex justify-between">
                <span className="text-slate-500">Refund amount</span>
                <span className="font-bold text-green-700">£{parseFloat(refundAmount).toFixed(2)}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-600">
            This action will update the complaint status and notify the customer. No real payments will be processed.
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

      {/* Already decided banner */}
      {complaint.decision && (
        <div className="mx-6 mt-6 alert-warning flex items-center gap-3">
          <svg className="h-5 w-5 shrink-0 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>
            A decision has already been recorded for this case ({complaint.decision.decidedBy}, {formatDateTime(complaint.decision.decidedAt)}). You can record an updated decision below.
          </span>
        </div>
      )}

      <div className="p-6 grid gap-6 xl:grid-cols-3">
        {/* ── Left: decision form ──────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          {/* Decision type selector */}
          <div className="card">
            <h2 className="section-title mb-4">Select a decision</h2>
            {errors.type && <p className="error-msg mb-3">{errors.type}</p>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DECISION_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => { setSelectedType(option.type); setErrors({}); }}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all duration-150 ${
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
          </div>

          {/* Decision form */}
          {selectedType && (
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
                <div className="input-group">
                  <label className="label" htmlFor="refundAmount">Refund amount (£) — simulated only</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">£</span>
                    <input id="refundAmount" type="number" min="0" step="0.01" className="input pl-7"
                      placeholder="0.00" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">This is a simulated refund. No real payment will be processed.</p>
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
