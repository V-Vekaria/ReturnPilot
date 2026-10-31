"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StatusBadge, PriorityBadge } from "../../components/Badges";
import { formatPence, listCases } from "../../lib/api";
import {
  Complaint,
  ComplaintStatus,
  Priority,
  IssueType,
  formatDate,
  formatIssueType,
  TEAM_MEMBERS,
} from "../../lib/mockData";

const STATUS_OPTIONS: { value: ComplaintStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "investigating", label: "Investigating" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
  { value: "escalated", label: "Escalated" },
];

const PRIORITY_OPTIONS: { value: Priority | "all"; label: string }[] = [
  { value: "all", label: "All priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const ISSUE_OPTIONS: { value: IssueType | "all"; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "damaged_product", label: "Damaged Item" },
  { value: "missing_delivery", label: "Missing / Disputed Delivery" },
  { value: "return_request", label: "Change of Mind" },
];

const PAGE_SIZE = 10;

function CasesContent() {
  const params = useSearchParams();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">(
    (params.get("status") as ComplaintStatus) || "all"
  );
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [issueFilter, setIssueFilter] = useState<IssueType | "all">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setComplaints(await listCases());
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load cases.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  // Filtering + sorting
  const filtered = complaints
    .filter((c) => {
      const q = search.toLowerCase();
      if (q && !c.id.toLowerCase().includes(q) && !c.customerName.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
      if (issueFilter !== "all" && c.issueType !== issueFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      return sortOrder === "desc" ? -diff : diff;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((c) => c.id)));
    }
  }

  function getAssigneeName(id?: string) {
    if (!id) return "—";
    return TEAM_MEMBERS.find((t) => t.id === id)?.name ?? "—";
  }

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter, issueFilter]);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Retailer Portal</p>
            <h1 className="text-xl font-black text-ink">Case Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{filtered.length} complaints</span>
            <button onClick={refresh} className="button-icon" title="Refresh">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="card">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="input pl-9"
                placeholder="Search by complaint ID or customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Status */}
            <select className="input w-auto text-sm" value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | "all")}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {/* Priority */}
            <select className="input w-auto text-sm" value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}>
              {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {/* Issue category */}
            <select className="input w-auto text-sm" value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value as IssueType | "all")}>
              {ISSUE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {/* Sort */}
            <button onClick={() => setSortOrder((o) => o === "desc" ? "asc" : "desc")}
              className="button-secondary text-xs gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Date {sortOrder === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </div>

        {/* ── Selection bar ─────────────────────────────────────────────── */}
        {selected.size > 0 && (
          <div className="rounded-xl bg-teal/10 border border-teal/20 px-4 py-3 flex items-center gap-4 animate-fade-in">
            <span className="text-sm font-semibold text-teal">{selected.size} selected</span>
            <button className="button button-sm">Bulk assign</button>
            <button className="button-secondary button-sm">Export</button>
            <button onClick={() => setSelected(new Set())} className="button-ghost button-sm ml-auto">Clear</button>
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">
                  <input type="checkbox" className="accent-teal"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onChange={toggleAll} />
                </th>
                <th>Case ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Category</th>
                <th>Submitted</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Proposed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    {loading ? "Loading cases…" : loadError ? loadError : "No complaints match the current filters."}
                  </td>
                </tr>
              ) : paginated.map((c) => (
                <tr key={c.id} className={selected.has(c.id) ? "bg-pale" : ""}>
                  <td>
                    <input type="checkbox" className="accent-teal"
                      checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} />
                  </td>
                  <td className="font-mono text-xs font-bold text-teal">{c.id}</td>
                  <td>
                    <div className="font-medium text-ink">{c.customerName}</div>
                    <div className="text-xs text-slate-400">{c.customerEmail}</div>
                  </td>
                  <td className="max-w-[140px]">
                    <div className="truncate text-sm">{c.productName}</div>
                    <div className="text-xs text-slate-400">{c.retailerName}</div>
                  </td>
                  <td className="text-xs">{formatIssueType(c.issueType)}</td>
                  <td className="text-xs text-slate-500">{formatDate(c.submittedAt)}</td>
                  <td><PriorityBadge priority={c.priority} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-xs font-semibold">
                    {c.recommendation === "refund" ? `Refund ${formatPence(c.proposedAmountPence)}`
                      : c.recommendation === "investigate" ? "Investigate" : <span className="text-slate-400">Pending</span>}
                  </td>
                  <td>
                    <Link href={`/retailer/cases/${c.id}`} className="button button-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="button-secondary button-sm"
              >
                ← Prev
              </button>
              <span className="text-xs font-semibold text-ink">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="button-secondary button-sm"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading…</div>}>
      <CasesContent />
    </Suspense>
  );
}
