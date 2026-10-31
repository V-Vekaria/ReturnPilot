/**
 * API client for the ReturnPilot FastAPI + Google ADK backend.
 *
 * Set NEXT_PUBLIC_API_URL in .env.local to point at the backend:
 *   NEXT_PUBLIC_API_URL=http://localhost:8000
 *
 * Every function here mirrors the shape used by mockData.ts so pages
 * can swap `import ... from "./mockData"` → `import ... from "./api"`
 * with no other changes.
 */

import type {
  Complaint,
  ComplaintStatus,
  Decision,
  DashboardStats,
} from "./mockData";

export type { Complaint, ComplaintStatus, Decision, DashboardStats };

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ─── Cases ────────────────────────────────────────────────────────────────────

/** Fetch all cases for the retailer dashboard. */
export async function getCases(): Promise<Complaint[]> {
  return get<Complaint[]>("/cases");
}

/** Fetch a single case by ID. */
export async function getCase(id: string): Promise<Complaint> {
  return get<Complaint>(`/cases/${id}`);
}

/** Customer submits a new complaint. Returns the created case (with generated ID). */
export async function submitCase(
  payload: Omit<Complaint, "id" | "status" | "priority" | "submittedAt" | "updatedAt" | "timeline" | "internalComments" | "evidenceFiles" | "decision">
): Promise<Complaint> {
  return post<Complaint>("/cases", payload);
}

/** Track a case by reference number (public, no auth). */
export async function trackCase(referenceId: string): Promise<Complaint> {
  return get<Complaint>(`/cases/${referenceId}/status`);
}

// ─── Retailer actions ─────────────────────────────────────────────────────────

/** Post a retailer decision (approve / reject / escalate). */
export async function submitDecision(
  caseId: string,
  decision: Omit<Decision, "decidedBy" | "decidedAt">
): Promise<Complaint> {
  return post<Complaint>(`/cases/${caseId}/decision`, decision);
}

/** Add an internal comment on a case. */
export async function addInternalComment(
  caseId: string,
  text: string
): Promise<Complaint> {
  return post<Complaint>(`/cases/${caseId}/comments`, { text });
}

/** Update investigation notes. */
export async function updateInvestigationNotes(
  caseId: string,
  notes: string
): Promise<Complaint> {
  return post<Complaint>(`/cases/${caseId}/notes`, { notes });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

/** Pre-aggregated stats from the backend (avoids re-computing in the browser). */
export async function getDashboardStats(): Promise<DashboardStats> {
  return get<DashboardStats>("/stats");
}

// ─── Google ADK / AI ──────────────────────────────────────────────────────────

/**
 * Trigger the ADK investigation agent on a case.
 * Returns the updated case once the agent has run.
 */
export async function triggerInvestigation(caseId: string): Promise<Complaint> {
  return post<Complaint>(`/cases/${caseId}/investigate`, {});
}
