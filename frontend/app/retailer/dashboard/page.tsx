"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge, PriorityBadge } from "../../components/Badges";
import { listCases } from "../../lib/api";
import {
  Complaint,
  computeStats,
  DashboardStats,
  formatDate,
  formatIssueType,
  ComplaintStatus,
} from "../../lib/mockData";

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color ?? "bg-teal/10 text-teal"}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className={`mt-0.5 text-3xl font-black tracking-tight ${color ? "" : "text-ink"}`}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; count: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-32 shrink-0 text-xs text-slate-400 font-medium">{item.label}</div>
          <div className="flex-1 h-3 rounded-full bg-slate-700/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${item.color}`}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <div className="w-6 text-xs font-bold text-slate-400 text-right">{item.count}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function RetailerDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0, newToday: 0, inProgress: 0, pendingApproval: 0, resolved: 0, escalated: 0,
  });
  const [dateRange, setDateRange] = useState("7d");

  const [loadError, setLoadError] = useState("");

  async function refresh() {
    try {
      const all = await listCases();
      setComplaints(all);
      setStats(computeStats(all));
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load cases.");
    }
  }

  useEffect(() => { refresh(); }, []);

  // Status distribution
  const statusDist: { label: string; count: number; color: string; key: ComplaintStatus }[] = [
    { key: "submitted", label: "Submitted", count: complaints.filter((c) => c.status === "submitted").length, color: "bg-blue-400" },
    { key: "investigating", label: "Investigating", count: complaints.filter((c) => c.status === "investigating").length, color: "bg-orange-400" },
    { key: "pending_approval", label: "Pending Approval", count: complaints.filter((c) => c.status === "pending_approval").length, color: "bg-purple-400" },
    { key: "resolved", label: "Resolved", count: complaints.filter((c) => c.status === "resolved").length, color: "bg-teal" },
    { key: "rejected", label: "Rejected", count: complaints.filter((c) => c.status === "rejected").length, color: "bg-red-400" },
    { key: "escalated", label: "Escalated", count: complaints.filter((c) => c.status === "escalated").length, color: "bg-red-600" },
  ];

  // Category distribution
  const catMap: Record<string, number> = {};
  complaints.forEach((c) => { catMap[c.productCategory] = (catMap[c.productCategory] || 0) + 1; });
  const catDist = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([label, count]) => ({ label, count, color: "bg-teal/70" }));

  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 8);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-slate-700/50 bg-pale/90 backdrop-blur-md">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Retailer Portal</p>
            <h1 className="text-xl font-black text-ink">Overview Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Date range filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input py-2 w-auto text-xs"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <button onClick={refresh} className="button-icon" title="Refresh data">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {/* Notification bell */}
            <div className="relative">
              <button className="button-icon" title="Notifications">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              {stats.newToday > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {stats.newToday}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loadError && <div className="alert-error" role="alert">{loadError}</div>}
        {/* ── KPI cards ─────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Total complaints"
            value={stats.total}
            sub="All time"
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
          <KpiCard
            label="New today"
            value={stats.newToday}
            color="bg-blue-100 text-blue-600"
            sub="Submitted today"
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
          />
          <KpiCard
            label="In progress"
            value={stats.inProgress}
            color="bg-yellow-100 text-yellow-600"
            sub="Under review or investigating"
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <KpiCard
            label="Pending approval"
            value={stats.pendingApproval}
            color="bg-purple-100 text-purple-600"
            sub="Awaiting decision sign-off"
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <KpiCard
            label="Resolved"
            value={stats.resolved}
            color="bg-teal/10 text-teal"
            sub="Successfully closed"
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          />
          <KpiCard
            label="Escalated"
            value={stats.escalated}
            color="bg-red-100 text-red-600"
            sub="Requires senior attention"
            icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          />
        </div>

        {/* ── Charts row ─────────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Status distribution */}
          <div className="card">
            <h2 className="section-title mb-5">Complaints by status</h2>
            <BarChart data={statusDist} />
          </div>

          {/* Category distribution */}
          <div className="card">
            <h2 className="section-title mb-5">Complaints by category</h2>
            {catDist.length > 0 ? <BarChart data={catDist} /> : (
              <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
            )}
          </div>
        </div>

        {/* ── Volume over time (simplified sparkline) ────────────────────── */}
        <div className="card">
          <h2 className="section-title mb-5">Complaint volume</h2>
          <div className="flex items-end gap-2 h-24">
            {Array.from({ length: 14 }, (_, i) => {
              const h = Math.floor(10 + Math.random() * 80);
              const isToday = i === 13;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-500 ${isToday ? "bg-teal" : "bg-teal/30"}`}
                    style={{ height: `${h}%` }}
                    title={`Day ${i + 1}: ${Math.round(h / 10)} complaints`}
                  />
                  {i % 7 === 0 && (
                    <span className="text-[10px] text-slate-400">{i === 0 ? "14d ago" : "7d ago"}</span>
                  )}
                  {i === 13 && <span className="text-[10px] text-teal font-bold">Today</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Recent complaints table ─────────────────────────────────────── */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Recent complaints</h2>
            <Link href="/retailer/cases" className="text-sm font-semibold text-teal hover:underline">
              View all →
            </Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Issue</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono font-semibold text-teal">{c.id}</td>
                    <td className="font-medium">{c.customerName}</td>
                    <td className="max-w-[140px] truncate">{c.productName}</td>
                    <td>{formatIssueType(c.issueType)}</td>
                    <td className="text-slate-500">{formatDate(c.submittedAt)}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td><PriorityBadge priority={c.priority} /></td>
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
        </div>
      </div>
    </div>
  );
}
