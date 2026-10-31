// Live backend adapter. Maps backend snake_case records onto the Complaint shape the pages render.
import { Complaint, ComplaintStatus, IssueType, Resolution, TimelineEvent, Decision } from "./mockData";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type BackendIssue = "damaged_item" | "disputed_delivery" | "change_of_mind";
type BackendStatus = "submitted" | "investigating" | "awaiting_review" | "resolved" | "escalated" | "rejected";

// The three issue types the backend investigates; the form offers only these
export const SUPPORTED_ISSUES: { value: IssueType; backend: BackendIssue; label: string }[] = [
  { value: "damaged_product", backend: "damaged_item", label: "Damaged item" },
  { value: "missing_delivery", backend: "disputed_delivery", label: "Missing / disputed delivery" },
  { value: "return_request", backend: "change_of_mind", label: "Change of mind / return" },
];
const ISSUE_FROM_BACKEND: Record<BackendIssue, IssueType> = {
  damaged_item: "damaged_product", disputed_delivery: "missing_delivery", change_of_mind: "return_request",
};
const STATUS_FROM_BACKEND: Record<BackendStatus, ComplaintStatus> = {
  submitted: "submitted", investigating: "investigating", awaiting_review: "pending_approval",
  resolved: "resolved", escalated: "escalated", rejected: "rejected",
};
export const STATUS_TO_BACKEND: Partial<Record<ComplaintStatus, BackendStatus>> = {
  submitted: "submitted", investigating: "investigating", pending_approval: "awaiting_review",
  resolved: "resolved", escalated: "escalated", rejected: "rejected",
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public fieldErrors: Record<string, string> = {}) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, `Cannot reach the ReturnPilot backend at ${API_URL}. Is it running?`);
  }
  if (res.ok) return res.json();
  const body = await res.json().catch(() => ({}));
  // FastAPI: detail is a string for HTTPException, a list for validation errors
  if (Array.isArray(body.detail)) {
    const fieldErrors: Record<string, string> = {};
    for (const e of body.detail) fieldErrors[String(e.loc?.[e.loc.length - 1])] = e.msg;
    throw new ApiError(res.status, "Some fields are invalid.", fieldErrors);
  }
  throw new ApiError(res.status, body.detail ?? `Request failed (${res.status})`);
}

// ─── Backend shapes ───────────────────────────────────────────────────────────

interface Details {
  retailer_name?: string; customer_name?: string; customer_email?: string; customer_phone?: string;
  title?: string; product_name?: string; product_category?: string; purchase_date?: string;
  issue_date?: string; requested_resolution?: string; evidence_files?: string[];
}
interface Order { id: string; item: string; amount_pence: number; delivery_status: string; proof_of_delivery: string; delivered_at: string }
interface StaffCase {
  id: string; order_id: string; issue_type: BackendIssue; description: string; status: BackendStatus;
  recommendation: "refund" | "investigate" | null; proposed_amount_pence: number | null;
  investigation_summary: string | null; policy_reason: string | null; decision_note: string | null;
  customer_message: string | null; created_at: string; updated_at: string;
  details: Details; order: Order | null; resolution: { amount_pence: number; ref: string } | null;
}
export interface AuditEvent { id: number; case_id: string; at: string; actor: string; type: string; message: string }
interface CustomerCase {
  id: string; order_id: string; issue_type: BackendIssue; description: string; status: BackendStatus;
  message: string; created_at: string; updated_at: string; title: string | null; product_name: string | null;
  requested_resolution: string | null; retailer_name: string | null;
  resolution: { amount_pence: number; ref: string } | null;
  public_events: { id: number; at: string; actor: string; message: string }[];
}
export interface PolicyInfo {
  version: string; return_window_days: number; demo_today: string;
  rules: { rule_id: string; issue_type: BackendIssue; summary: string }[];
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

const ROLE: Record<string, TimelineEvent["actorRole"]> = { customer: "customer", retailer: "retailer", system: "system" };
const ACTOR_NAME: Record<string, string> = { customer: "Customer", retailer: "Retailer staff", system: "ReturnPilot" };

function toTimeline(events: { id: number; at: string; actor: string; message: string; type?: string }[]): TimelineEvent[] {
  return events.map((e) => ({
    id: String(e.id), timestamp: e.at, actor: ACTOR_NAME[e.actor] ?? e.actor,
    actorRole: ROLE[e.actor] ?? "system",
    event: e.type ? EVENT_LABEL[e.type] ?? e.type : e.message,
    note: e.type && EVENT_LABEL[e.type] ? e.message : undefined,
  }));
}
const EVENT_LABEL: Record<string, string> = {
  case_created: "Complaint submitted",
  investigation_started: "Investigation started",
  investigation_failed: "Investigation failed",
  proposal_created: "Proposal created",
  decision_approve: "Approved: simulated refund executed",
  decision_reject: "Rejected",
  decision_escalate: "Escalated",
};

function resolutionOf(r?: string | null): Resolution {
  return r === "refund" || r === "replacement" || r === "repair" ? r : "other";
}

function decisionOf(c: StaffCase): Decision | undefined {
  if (!c.decision_note) return undefined;
  const type: Decision["type"] =
    c.status === "resolved" ? "approve_refund" : c.status === "escalated" ? "escalate" : "reject";
  return {
    type, reason: c.decision_note, customerExplanation: c.customer_message ?? "",
    refundAmount: c.resolution ? c.resolution.amount_pence / 100 : undefined,
    decidedBy: "Retailer staff", decidedAt: c.updated_at,
  };
}

function fromStaff(c: StaffCase, events: AuditEvent[] = []): Complaint {
  const d = c.details ?? {};
  const amount = c.proposed_amount_pence ?? c.order?.amount_pence ?? 0;
  return {
    id: c.id,
    customerName: d.customer_name || "Demo customer",
    customerEmail: d.customer_email || "",
    customerPhone: d.customer_phone || undefined,
    retailerName: d.retailer_name || "NovaTech",
    orderNumber: c.order_id,
    purchaseDate: d.purchase_date || c.order?.delivered_at || c.created_at,
    productName: d.product_name || c.order?.item || "—",
    productCategory: d.product_category || "—",
    issueType: ISSUE_FROM_BACKEND[c.issue_type],
    complaintTitle: d.title || `${c.order?.item ?? "Order"} (${c.order_id})`,
    description: c.description,
    issueDate: d.issue_date || c.created_at,
    preferredResolution: resolutionOf(d.requested_resolution),
    status: STATUS_FROM_BACKEND[c.status],
    // No priority in the backend; derive one from the amount at stake so the queue can sort
    priority: amount >= 20000 ? "high" : amount >= 10000 ? "medium" : "low",
    submittedAt: c.created_at,
    updatedAt: c.updated_at,
    investigationNotes: c.investigation_summary ?? undefined,
    internalComments: [],
    timeline: toTimeline(events),
    decision: decisionOf(c),
    retailerResponse: c.customer_message ?? undefined,
    evidenceFiles: d.evidence_files ?? [],
    recommendation: c.recommendation,
    proposedAmountPence: c.proposed_amount_pence,
    orderAmountPence: c.order?.amount_pence ?? null,
    investigationSummary: c.investigation_summary,
    policyReason: c.policy_reason,
    resolutionRef: c.resolution?.ref ?? null,
    resolutionAmountPence: c.resolution?.amount_pence ?? null,
  };
}

function fromCustomer(c: CustomerCase, email: string): Complaint {
  return {
    id: c.id, customerName: "", customerEmail: email, retailerName: c.retailer_name || "NovaTech",
    orderNumber: c.order_id, purchaseDate: c.created_at, productName: c.product_name || "—", productCategory: "—",
    issueType: ISSUE_FROM_BACKEND[c.issue_type], complaintTitle: c.title || `Order ${c.order_id}`,
    description: c.description, issueDate: c.created_at, preferredResolution: resolutionOf(c.requested_resolution),
    status: STATUS_FROM_BACKEND[c.status], priority: "medium", submittedAt: c.created_at, updatedAt: c.updated_at,
    internalComments: [], timeline: toTimeline(c.public_events), retailerResponse: c.message,
    evidenceFiles: [],
    resolutionRef: c.resolution?.ref ?? null, resolutionAmountPence: c.resolution?.amount_pence ?? null,
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface CreateCaseInput {
  order_id: string;
  issue_type: BackendIssue;
  description: string;
  details: Details;
}

export async function createCase(input: CreateCaseInput): Promise<Complaint> {
  return fromStaff(await request<StaffCase>("/api/cases", { method: "POST", body: JSON.stringify(input) }));
}

export async function getCustomerCase(id: string, email: string): Promise<Complaint> {
  const c = await request<CustomerCase>(
    `/api/customer/cases/${encodeURIComponent(id)}?email=${encodeURIComponent(email)}`);
  return fromCustomer(c, email);
}

export async function listCases(): Promise<Complaint[]> {
  const { items } = await request<{ items: StaffCase[] }>("/api/cases");
  return items.map((c) => fromStaff(c));
}

export async function getEvents(id: string): Promise<AuditEvent[]> {
  return (await request<{ items: AuditEvent[] }>(`/api/cases/${encodeURIComponent(id)}/audit`)).items;
}

export async function getStaffCase(id: string): Promise<Complaint> {
  const [c, events] = await Promise.all([
    request<StaffCase>(`/api/cases/${encodeURIComponent(id)}`), getEvents(id),
  ]);
  return fromStaff(c, events);
}

export async function startInvestigation(id: string): Promise<Complaint> {
  await request<StaffCase>(`/api/cases/${encodeURIComponent(id)}/investigate`, { method: "POST" });
  return getStaffCase(id);
}

export interface DecisionInput {
  decision: "approve" | "reject" | "escalate";
  note: string;
  customer_message?: string;
  evidence_confirmed?: boolean;
}

export async function decideCase(id: string, input: DecisionInput): Promise<Complaint> {
  await request<StaffCase>(`/api/cases/${encodeURIComponent(id)}/decision`, { method: "POST", body: JSON.stringify(input) });
  return getStaffCase(id);
}

export async function getPolicy(): Promise<PolicyInfo> {
  return request<PolicyInfo>("/api/policy");
}

export async function getHealth(): Promise<{ status: string; mode: string }> {
  return request("/health");
}

export async function resetDemo(): Promise<void> {
  await request("/api/dev/reset", { method: "POST" });
}

export function formatPence(pence: number | null | undefined): string {
  return pence == null ? "—" : `£${(pence / 100).toFixed(2)}`;
}
