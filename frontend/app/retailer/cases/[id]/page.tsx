"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge, PriorityBadge } from "../../../components/Badges";
import { useToast } from "../../../components/Toast";
import {
  getComplaint,
  upsertComplaint,
  Complaint,
  ComplaintStatus,
  formatStatus,
  formatDate,
  formatDateTime,
  formatIssueType,
  formatResolution,
  TEAM_MEMBERS,
} from "../../../lib/mockData";

const STATUS_TRANSITIONS: ComplaintStatus[] = [
  "submitted",
  "under_review",
  "investigating",
  "pending_approval",
  "resolved",
  "rejected",
  "escalated",
];

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [noteText, setNoteText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [investigationNotes, setInvestigationNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>("submitted");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [saving, setSaving] = useState(false);

  function load() {
    const c = getComplaint(id);
    if (c) {
      setComplaint(c);
      setInvestigationNotes(c.investigationNotes || "");
      setSelectedStatus(c.status);
      setSelectedAssignee(c.assignedTo || "");
    }
  }

  useEffect(() => { load(); }, [id]);

  async function saveInvestigationNotes() {
    if (!complaint) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const updated: Complaint = {
      ...complaint,
      investigationNotes,
      updatedAt: new Date().toISOString(),
    };
    upsertComplaint(updated);
    setComplaint(updated);
    showToast("Investigation notes saved.", "success");
    setSaving(false);
  }

  async function addComment() {
    if (!complaint || !commentText.trim()) return;
    const now = new Date().toISOString();
    const updated: Complaint = {
      ...complaint,
      internalComments: [
        ...complaint.internalComments,
        { id: `ic-${Date.now()}`, author: "You (Retailer)", text: commentText.trim(), timestamp: now },
      ],
      timeline: [
        ...complaint.timeline,
        { id: `t-${Date.now()}`, timestamp: now, actor: "You (Retailer)", actorRole: "retailer", event: "Internal comment added" },
      ],
      updatedAt: now,
    };
    upsertComplaint(updated);
    setComplaint(updated);
    setCommentText("");
    showToast("Comment added.", "success");
  }

  async function updateStatus() {
    if (!complaint || selectedStatus === complaint.status) return;
    const now = new Date().toISOString();
    const updated: Complaint = {
      ...complaint,
      status: selectedStatus,
      updatedAt: now,
      timeline: [
        ...complaint.timeline,
        {
          id: `t-${Date.now()}`,
          timestamp: now,
          actor: "You (Retailer)",
          actorRole: "retailer",
          event: `Status changed to ${formatStatus(selectedStatus)}`,
          note: noteText.trim() || undefined,
        },
      ],
    };
    upsertComplaint(updated);
    setComplaint(updated);
    setNoteText("");
    showToast(`Status updated to "${formatStatus(selectedStatus)}".`, "success");
  }

  async function updateAssignee() {
    if (!complaint) return;
    const now = new Date().toISOString();
    const tm = TEAM_MEMBERS.find((t) => t.id === selectedAssignee);
    const updated: Complaint = {
      ...complaint,
      assignedTo: selectedAssignee || undefined,
      updatedAt: now,
      timeline: [
        ...complaint.timeline,
        {
          id: `t-${Date.now()}`,
          timestamp: now,
          actor: "You (Retailer)",
          actorRole: "retailer",
          event: tm ? `Case assigned to ${tm.name}` : "Case unassigned",
        },
      ],
    };
    upsertComplaint(updated);
    setComplaint(updated);
    showToast(tm ? `Assigned to ${tm.name}.` : "Assignment cleared.", "success");
  }

  if (!complaint) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-400">Case not found.</p>
        <Link href="/retailer/cases" className="button mt-4">← Back to cases</Link>
      </div>
    );
  }

  const assignedMember = TEAM_MEMBERS.find((t) => t.id === complaint.assignedTo);

  return (
    <div className="min-h-screen">
      <ToastContainer />

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/retailer/cases" className="button-icon">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <p className="eyebrow">Case Investigation</p>
              <h1 className="text-xl font-black text-ink">{complaint.id}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <Link href={`/retailer/cases/${complaint.id}/decision`} className="button">
              Make Decision →
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 grid gap-6 xl:grid-cols-3">
        {/* ── Left column ──────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          {/* Case header details */}
          <div className="card">
            <h2 className="section-title mb-5">{complaint.complaintTitle}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Submitted", value: formatDateTime(complaint.submittedAt) },
                { label: "Last updated", value: formatDateTime(complaint.updatedAt) },
                { label: "Order number", value: complaint.orderNumber },
                { label: "Purchase date", value: formatDate(complaint.purchaseDate) },
                { label: "Retailer", value: complaint.retailerName },
                { label: "Category", value: complaint.productCategory },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</dt>
                  <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
                </div>
              ))}
            </div>
          </div>

          {/* Customer information */}
          <div className="card">
            <h2 className="section-title mb-4">Customer information</h2>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal font-bold">
                {complaint.customerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink">{complaint.customerName}</p>
                <p className="text-sm text-slate-500">{complaint.customerEmail}</p>
                {complaint.customerPhone && (
                  <p className="text-sm text-slate-500">{complaint.customerPhone}</p>
                )}
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 border-t border-slate-100 pt-5">
              {[
                { label: "Product", value: complaint.productName },
                { label: "Order number", value: complaint.orderNumber },
                { label: "Issue type", value: formatIssueType(complaint.issueType) },
                { label: "Preferred resolution", value: formatResolution(complaint.preferredResolution) },
              ].map(({ label, value }) => (
                <div key={label} className="text-sm">
                  <span className="text-slate-500">{label}: </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Complaint description */}
          <div className="card">
            <h2 className="section-title mb-3">Complaint description</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{complaint.description}</p>
            {complaint.evidenceFiles.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-bold text-ink mb-3">Supporting evidence</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {complaint.evidenceFiles.map((file) => {
                    const ext = file.split(".").pop()?.toLowerCase() ?? "";
                    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
                    return (
                      <div key={file} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isImage ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                          {isImage ? "IMG" : ext.toUpperCase()}
                        </div>
                        <span className="text-xs font-medium truncate">{file}</span>
                        <button className="ml-auto text-teal text-xs font-semibold hover:underline">Preview</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Investigation notes */}
          <div className="card">
            <h2 className="section-title mb-3">Investigation notes</h2>
            <textarea
              className="input min-h-[120px]"
              placeholder="Record investigation findings, evidence review notes, and any actions taken..."
              value={investigationNotes}
              onChange={(e) => setInvestigationNotes(e.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <button onClick={saveInvestigationNotes} disabled={saving} className="button button-sm">
                {saving ? "Saving…" : "Save notes"}
              </button>
            </div>
          </div>

          {/* Internal comments */}
          <div className="card">
            <h2 className="section-title mb-4">Internal comments</h2>
            {complaint.internalComments.length === 0 ? (
              <p className="text-sm text-slate-400 mb-4">No comments yet.</p>
            ) : (
              <ol className="space-y-4 mb-5">
                {complaint.internalComments.map((comment) => (
                  <li key={comment.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal text-xs font-bold">
                      {comment.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-ink">{comment.author}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(comment.timestamp)}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{comment.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <div className="flex gap-3">
              <input
                className="input flex-1"
                placeholder="Add an internal comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComment()}
              />
              <button onClick={addComment} disabled={!commentText.trim()} className="button">Add</button>
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Status control */}
          <div className="card">
            <h2 className="section-title mb-4">Update status</h2>
            <div className="input-group">
              <label className="label" htmlFor="statusSelect">New status</label>
              <select id="statusSelect" className="input" value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}>
                {STATUS_TRANSITIONS.map((s) => (
                  <option key={s} value={s}>{formatStatus(s)}</option>
                ))}
              </select>
            </div>
            <div className="input-group mt-3">
              <label className="label" htmlFor="noteInput">Note (optional)</label>
              <input id="noteInput" className="input" placeholder="Reason for status change..."
                value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            </div>
            <button
              onClick={updateStatus}
              disabled={selectedStatus === complaint.status}
              className="button w-full mt-3"
            >
              Update Status
            </button>
          </div>

          {/* Assign team member */}
          <div className="card">
            <h2 className="section-title mb-4">Assigned investigator</h2>
            {assignedMember && (
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-teal/5 border border-teal/20 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-white text-sm font-bold">
                  {assignedMember.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{assignedMember.name}</p>
                  <p className="text-xs text-slate-500">{assignedMember.role}</p>
                </div>
              </div>
            )}
            <div className="input-group">
              <label className="label" htmlFor="assigneeSelect">Assign to</label>
              <select id="assigneeSelect" className="input" value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {TEAM_MEMBERS.map((tm) => (
                  <option key={tm.id} value={tm.id}>{tm.name} — {tm.role}</option>
                ))}
              </select>
            </div>
            <button onClick={updateAssignee} className="button w-full mt-3">Save Assignment</button>
          </div>

          {/* Case timeline */}
          <div className="card">
            <h2 className="section-title mb-4">Activity timeline</h2>
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
                    {event.note && <p className="text-xs text-slate-500 mt-0.5">{event.note}</p>}
                    <p className="text-[11px] text-slate-400 mt-0.5">{event.actor} · {formatDateTime(event.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Decision shortcut */}
          <div className="card bg-gradient-to-br from-teal/5 to-pale border-teal/20">
            <h2 className="text-sm font-bold text-ink mb-2">Ready to decide?</h2>
            <p className="text-xs text-slate-600 mb-4">Navigate to the approval screen to approve, reject, or escalate this complaint.</p>
            <Link href={`/retailer/cases/${complaint.id}/decision`} className="button w-full justify-center">
              Go to Decision →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
