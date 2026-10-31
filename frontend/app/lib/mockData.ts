// ─── Types ───────────────────────────────────────────────────────────────────

export type ComplaintStatus =
  | "submitted"
  | "under_review"
  | "investigating"
  | "pending_approval"
  | "resolved"
  | "rejected"
  | "escalated";

export type Priority = "low" | "medium" | "high" | "urgent";

export type IssueType =
  | "damaged_product"
  | "defective_product"
  | "wrong_item"
  | "missing_delivery"
  | "refund_issue"
  | "return_request"
  | "other";

export type Resolution = "refund" | "replacement" | "repair" | "other";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: "customer" | "system" | "retailer";
  event: string;
  note?: string;
}

export interface Complaint {
  id: string;
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  // Purchase details
  retailerName: string;
  orderNumber: string;
  purchaseDate: string;
  productName: string;
  productCategory: string;
  // Complaint details
  issueType: IssueType;
  complaintTitle: string;
  description: string;
  issueDate: string;
  preferredResolution: Resolution;
  // Meta
  status: ComplaintStatus;
  priority: Priority;
  assignedTo?: string;
  submittedAt: string;
  updatedAt: string;
  // Retailer workspace
  investigationNotes?: string;
  internalComments: InternalComment[];
  timeline: TimelineEvent[];
  decision?: Decision;
  retailerResponse?: string;
  // Evidence (simulated filenames)
  evidenceFiles: string[];
}

export interface InternalComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Decision {
  type: "approve_refund" | "approve_replacement" | "approve_repair" | "reject" | "request_info" | "escalate";
  reason: string;
  internalNote?: string;
  customerExplanation: string;
  refundAmount?: number;
  escalationReason?: string;
  escalationTeam?: string;
  escalationNote?: string;
  decidedBy: string;
  decidedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

// ─── Team Members ─────────────────────────────────────────────────────────────

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "tm1", name: "Sarah Chen", role: "Senior Investigator", avatar: "SC" },
  { id: "tm2", name: "James Okafor", role: "Complaints Handler", avatar: "JO" },
  { id: "tm3", name: "Priya Sharma", role: "Resolution Specialist", avatar: "PS" },
  { id: "tm4", name: "Marcus Webb", role: "Escalation Manager", avatar: "MW" },
  { id: "tm5", name: "Aisha Malik", role: "Customer Advocate", avatar: "AM" },
];

// ─── Seed Mock Complaints ─────────────────────────────────────────────────────

export const SEED_COMPLAINTS: Complaint[] = [
  {
    id: "RP-2024-001",
    customerName: "Emma Thompson",
    customerEmail: "emma.thompson@email.com",
    customerPhone: "07700900123",
    retailerName: "TechNova Electronics",
    orderNumber: "TNE-88421",
    purchaseDate: "2024-10-01",
    productName: "Sony WH-1000XM5 Headphones",
    productCategory: "Electronics",
    issueType: "damaged_product",
    complaintTitle: "Headphones arrived with cracked earcup",
    description: "I received my Sony headphones yesterday but the left earcup arrived with a large crack running through the plastic. The item was clearly damaged during shipping. The packaging itself appeared intact but the product inside was already broken.",
    issueDate: "2024-10-14",
    preferredResolution: "replacement",
    status: "investigating",
    priority: "high",
    assignedTo: "tm1",
    submittedAt: "2024-10-14T09:23:00Z",
    updatedAt: "2024-10-15T14:30:00Z",
    investigationNotes: "Customer provided clear photo evidence of the crack. Checking with logistics team re packaging standards.",
    internalComments: [
      { id: "ic1", author: "Sarah Chen", text: "Contacted warehouse re this order. Awaiting response.", timestamp: "2024-10-14T11:00:00Z" },
    ],
    timeline: [
      { id: "t1", timestamp: "2024-10-14T09:23:00Z", actor: "Emma Thompson", actorRole: "customer", event: "Complaint submitted" },
      { id: "t2", timestamp: "2024-10-14T09:30:00Z", actor: "System", actorRole: "system", event: "Case assigned to Sarah Chen" },
      { id: "t3", timestamp: "2024-10-14T10:00:00Z", actor: "Sarah Chen", actorRole: "retailer", event: "Status changed to Under Review" },
      { id: "t4", timestamp: "2024-10-15T14:30:00Z", actor: "Sarah Chen", actorRole: "retailer", event: "Status changed to Investigating", note: "Awaiting warehouse response on packaging quality." },
    ],
    evidenceFiles: ["headphones_crack_1.jpg", "headphones_crack_2.jpg", "packaging_photo.jpg"],
  },
  {
    id: "RP-2024-002",
    customerName: "Daniel Park",
    customerEmail: "d.park@mailbox.co.uk",
    customerPhone: "07911123456",
    retailerName: "StyleHouse Fashion",
    orderNumber: "SHF-22901",
    purchaseDate: "2024-10-05",
    productName: "Merino Wool Jumper (Navy, XL)",
    productCategory: "Clothing",
    issueType: "wrong_item",
    complaintTitle: "Received wrong size and colour",
    description: "I ordered a navy XL merino jumper but received a grey medium instead. The packing slip inside matched my order but the item is completely different. I need the correct item for an event next week.",
    issueDate: "2024-10-12",
    preferredResolution: "replacement",
    status: "pending_approval",
    priority: "medium",
    assignedTo: "tm2",
    submittedAt: "2024-10-12T16:45:00Z",
    updatedAt: "2024-10-16T09:00:00Z",
    investigationNotes: "Confirmed pick-and-pack error on our side. Replacement in stock. Recommend immediate dispatch with pre-paid return label.",
    internalComments: [
      { id: "ic2", author: "James Okafor", text: "Warehouse confirmed pick error. Navy XL available.", timestamp: "2024-10-13T10:00:00Z" },
      { id: "ic3", author: "Priya Sharma", text: "Preparing approval for replacement dispatch.", timestamp: "2024-10-16T09:00:00Z" },
    ],
    timeline: [
      { id: "t5", timestamp: "2024-10-12T16:45:00Z", actor: "Daniel Park", actorRole: "customer", event: "Complaint submitted" },
      { id: "t6", timestamp: "2024-10-12T17:00:00Z", actor: "System", actorRole: "system", event: "Case assigned to James Okafor" },
      { id: "t7", timestamp: "2024-10-13T09:00:00Z", actor: "James Okafor", actorRole: "retailer", event: "Status changed to Under Review" },
      { id: "t8", timestamp: "2024-10-13T10:30:00Z", actor: "James Okafor", actorRole: "retailer", event: "Status changed to Investigating" },
      { id: "t9", timestamp: "2024-10-16T09:00:00Z", actor: "Priya Sharma", actorRole: "retailer", event: "Status changed to Pending Approval", note: "Replacement confirmed available, awaiting sign-off." },
    ],
    evidenceFiles: ["wrong_item_received.jpg"],
  },
  {
    id: "RP-2024-003",
    customerName: "Fatima Al-Rashid",
    customerEmail: "fatima.r@outlook.com",
    retailerName: "HomeComfort Living",
    orderNumber: "HCL-55782",
    purchaseDate: "2024-09-20",
    productName: "Dyson V15 Detect Vacuum",
    productCategory: "Home Appliances",
    issueType: "missing_delivery",
    complaintTitle: "Order marked delivered but never received",
    description: "My tracking shows the vacuum was delivered on 28th September at 14:32, but I was home all day and received nothing. No parcel was left with a neighbour and there is no safe place note. This is a £500+ purchase.",
    issueDate: "2024-09-28",
    preferredResolution: "refund",
    status: "escalated",
    priority: "urgent",
    assignedTo: "tm4",
    submittedAt: "2024-09-28T18:00:00Z",
    updatedAt: "2024-10-10T11:00:00Z",
    investigationNotes: "Courier GPS data does not match customer address. Investigating possible misdelivery. High value case - escalated to senior team.",
    internalComments: [
      { id: "ic4", author: "Marcus Webb", text: "Formal investigation opened with courier. Case escalated due to order value.", timestamp: "2024-10-02T09:00:00Z" },
    ],
    timeline: [
      { id: "t10", timestamp: "2024-09-28T18:00:00Z", actor: "Fatima Al-Rashid", actorRole: "customer", event: "Complaint submitted" },
      { id: "t11", timestamp: "2024-09-29T09:00:00Z", actor: "System", actorRole: "system", event: "Auto-escalated: high value order" },
      { id: "t12", timestamp: "2024-09-29T10:00:00Z", actor: "Marcus Webb", actorRole: "retailer", event: "Escalation confirmed", note: "Courier investigation opened." },
    ],
    evidenceFiles: ["tracking_screenshot.png", "home_cctv_28sep.mp4"],
  },
  {
    id: "RP-2024-004",
    customerName: "Oliver James",
    customerEmail: "oliver.james@gmail.com",
    customerPhone: "07823456789",
    retailerName: "TechNova Electronics",
    orderNumber: "TNE-91034",
    purchaseDate: "2024-10-08",
    productName: 'Samsung 65" QLED TV',
    productCategory: "Electronics",
    issueType: "defective_product",
    complaintTitle: "TV has dead pixels and display fault",
    description: "After 5 days of use the TV developed a large cluster of dead pixels in the top-right corner covering approximately 15% of the screen. The issue appeared suddenly and is clearly a manufacturing defect.",
    issueDate: "2024-10-13",
    preferredResolution: "replacement",
    status: "submitted",
    priority: "high",
    submittedAt: "2024-10-17T08:00:00Z",
    updatedAt: "2024-10-17T08:00:00Z",
    internalComments: [],
    timeline: [
      { id: "t13", timestamp: "2024-10-17T08:00:00Z", actor: "Oliver James", actorRole: "customer", event: "Complaint submitted" },
    ],
    evidenceFiles: ["tv_dead_pixels_photo.jpg", "tv_defect_video.mp4"],
  },
  {
    id: "RP-2024-005",
    customerName: "Sophie Williams",
    customerEmail: "sophie.w@yahoo.co.uk",
    retailerName: "BeautyBliss Cosmetics",
    orderNumber: "BBC-30012",
    purchaseDate: "2024-10-02",
    productName: "Charlotte Tilbury Advent Calendar",
    productCategory: "Beauty",
    issueType: "refund_issue",
    complaintTitle: "Refund not received after 14 days",
    description: "I returned this item on 5th October using the provided returns label. I have proof of postage. It's now been 14 days and I have received no refund and no communication from the retailer.",
    issueDate: "2024-10-19",
    preferredResolution: "refund",
    status: "under_review",
    priority: "medium",
    assignedTo: "tm5",
    submittedAt: "2024-10-19T12:00:00Z",
    updatedAt: "2024-10-19T14:00:00Z",
    internalComments: [],
    timeline: [
      { id: "t14", timestamp: "2024-10-19T12:00:00Z", actor: "Sophie Williams", actorRole: "customer", event: "Complaint submitted" },
      { id: "t15", timestamp: "2024-10-19T14:00:00Z", actor: "System", actorRole: "system", event: "Case assigned to Aisha Malik" },
      { id: "t16", timestamp: "2024-10-19T14:30:00Z", actor: "Aisha Malik", actorRole: "retailer", event: "Status changed to Under Review" },
    ],
    evidenceFiles: ["proof_of_postage.pdf", "return_confirmation.pdf"],
  },
  {
    id: "RP-2024-006",
    customerName: "Mohammed Hassan",
    customerEmail: "m.hassan@hotmail.com",
    customerPhone: "07612345678",
    retailerName: "SportsPro Gear",
    orderNumber: "SPG-77654",
    purchaseDate: "2024-09-15",
    productName: "Nike Air Max 270 (UK 10)",
    productCategory: "Footwear",
    issueType: "return_request",
    complaintTitle: "Request to return shoes — wrong fit",
    description: "The Nike Air Max 270 I ordered in UK 10 runs significantly small — feels like a UK 9. I would like to return them and exchange for a UK 11. I have not worn them outdoors, tags are still attached.",
    issueDate: "2024-09-22",
    preferredResolution: "replacement",
    status: "resolved",
    priority: "low",
    assignedTo: "tm3",
    submittedAt: "2024-09-22T10:30:00Z",
    updatedAt: "2024-10-01T16:00:00Z",
    investigationNotes: "Customer confirmed unworn with tags. Standard exchange policy applies. Exchange processed.",
    internalComments: [
      { id: "ic5", author: "Priya Sharma", text: "Exchange dispatched, return label emailed.", timestamp: "2024-10-01T15:00:00Z" },
    ],
    timeline: [
      { id: "t17", timestamp: "2024-09-22T10:30:00Z", actor: "Mohammed Hassan", actorRole: "customer", event: "Complaint submitted" },
      { id: "t18", timestamp: "2024-09-22T11:00:00Z", actor: "System", actorRole: "system", event: "Case assigned to Priya Sharma" },
      { id: "t19", timestamp: "2024-09-23T09:00:00Z", actor: "Priya Sharma", actorRole: "retailer", event: "Status changed to Under Review" },
      { id: "t20", timestamp: "2024-09-24T10:00:00Z", actor: "Priya Sharma", actorRole: "retailer", event: "Status changed to Investigating" },
      { id: "t21", timestamp: "2024-09-30T14:00:00Z", actor: "Priya Sharma", actorRole: "retailer", event: "Status changed to Pending Approval" },
      { id: "t22", timestamp: "2024-10-01T15:00:00Z", actor: "Priya Sharma", actorRole: "retailer", event: "Decision: Approve Replacement", note: "Exchange dispatched with return label." },
      { id: "t23", timestamp: "2024-10-01T16:00:00Z", actor: "System", actorRole: "system", event: "Status changed to Resolved" },
    ],
    evidenceFiles: ["shoe_tags_photo.jpg"],
    decision: {
      type: "approve_replacement",
      reason: "Standard size exchange within return window. Item unworn.",
      customerExplanation: "We are happy to exchange your shoes. A UK 11 has been dispatched and a free returns label has been emailed to you.",
      decidedBy: "Priya Sharma",
      decidedAt: "2024-10-01T15:00:00Z",
    },
    retailerResponse: "We apologise for the inconvenience. Your exchange has been processed and a UK 11 will arrive within 3-5 working days.",
  },
  {
    id: "RP-2024-007",
    customerName: "Charlotte Baines",
    customerEmail: "c.baines@icloud.com",
    retailerName: "HomeComfort Living",
    orderNumber: "HCL-60023",
    purchaseDate: "2024-10-10",
    productName: "Nespresso Vertuo Next Coffee Machine",
    productCategory: "Kitchen Appliances",
    issueType: "damaged_product",
    complaintTitle: "Coffee machine arrived with shattered water tank",
    description: "The Nespresso machine arrived today with the water tank completely shattered. There are loose shards of plastic inside the packaging. The outer box shows signs of impact damage. This is unsafe and cannot be used.",
    issueDate: "2024-10-17",
    preferredResolution: "refund",
    status: "rejected",
    priority: "medium",
    assignedTo: "tm2",
    submittedAt: "2024-10-17T11:00:00Z",
    updatedAt: "2024-10-18T10:00:00Z",
    investigationNotes: "Claim reviewed. Product was insured for delivery. However, customer's submitted photos show the machine was already powered on, contradicting the damage claim.",
    internalComments: [],
    timeline: [
      { id: "t24", timestamp: "2024-10-17T11:00:00Z", actor: "Charlotte Baines", actorRole: "customer", event: "Complaint submitted" },
      { id: "t25", timestamp: "2024-10-17T11:30:00Z", actor: "James Okafor", actorRole: "retailer", event: "Status changed to Under Review" },
      { id: "t26", timestamp: "2024-10-17T12:00:00Z", actor: "James Okafor", actorRole: "retailer", event: "Status changed to Investigating" },
      { id: "t27", timestamp: "2024-10-18T10:00:00Z", actor: "James Okafor", actorRole: "retailer", event: "Decision: Reject", note: "Evidence inconsistent with claim." },
      { id: "t28", timestamp: "2024-10-18T10:05:00Z", actor: "System", actorRole: "system", event: "Status changed to Rejected" },
    ],
    evidenceFiles: ["machine_damage.jpg"],
    decision: {
      type: "reject",
      reason: "Evidence inconsistent with claim. Photos show machine was operated before reporting damage.",
      customerExplanation: "After reviewing the evidence provided, we are unable to approve this complaint as the submitted photos indicate the machine was used prior to the reported damage.",
      decidedBy: "James Okafor",
      decidedAt: "2024-10-18T10:00:00Z",
    },
    retailerResponse: "We are unable to approve your complaint on this occasion. Please refer to our terms and conditions or contact us to discuss further.",
  },
];

// ─── localStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = "returnpilot_complaints";

export function loadComplaints(): Complaint[] {
  if (typeof window === "undefined") return SEED_COMPLAINTS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: Complaint[] = JSON.parse(stored);
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  saveComplaints(SEED_COMPLAINTS);
  return SEED_COMPLAINTS;
}

export function saveComplaints(complaints: Complaint[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
}

export function getComplaint(id: string): Complaint | undefined {
  return loadComplaints().find((c) => c.id === id);
}

export function upsertComplaint(complaint: Complaint): void {
  const all = loadComplaints();
  const idx = all.findIndex((c) => c.id === complaint.id);
  if (idx >= 0) {
    all[idx] = complaint;
  } else {
    all.unshift(complaint);
  }
  saveComplaints(all);
}

// ─── Reference number generator ───────────────────────────────────────────────

export function generateComplaintId(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `RP-${year}-${num}`;
}

// ─── Utility formatters ───────────────────────────────────────────────────────

export function formatStatus(status: ComplaintStatus): string {
  const map: Record<ComplaintStatus, string> = {
    submitted: "Submitted",
    under_review: "Under Review",
    investigating: "Investigating",
    pending_approval: "Pending Approval",
    resolved: "Resolved",
    rejected: "Rejected",
    escalated: "Escalated",
  };
  return map[status] ?? status;
}

export function formatIssueType(type: IssueType): string {
  const map: Record<IssueType, string> = {
    damaged_product: "Damaged Product",
    defective_product: "Defective Product",
    wrong_item: "Wrong Item Received",
    missing_delivery: "Missing Delivery",
    refund_issue: "Refund Issue",
    return_request: "Return Request",
    other: "Other",
  };
  return map[type] ?? type;
}

export function formatPriority(p: Priority): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function formatResolution(r: Resolution): string {
  const map: Record<Resolution, string> = {
    refund: "Refund",
    replacement: "Replacement",
    repair: "Repair",
    other: "Other",
  };
  return map[r] ?? r;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function statusColor(status: ComplaintStatus): string {
  const map: Record<ComplaintStatus, string> = {
    submitted: "bg-blue-100 text-blue-800",
    under_review: "bg-yellow-100 text-yellow-800",
    investigating: "bg-orange-100 text-orange-800",
    pending_approval: "bg-purple-100 text-purple-800",
    resolved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    escalated: "bg-red-200 text-red-900",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}

export function priorityColor(priority: Priority): string {
  const map: Record<Priority, string> = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };
  return map[priority] ?? "bg-gray-100 text-gray-700";
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  total: number;
  newToday: number;
  inProgress: number;
  pendingApproval: number;
  resolved: number;
  escalated: number;
}

export function computeStats(complaints: Complaint[]): DashboardStats {
  const today = new Date().toDateString();
  return {
    total: complaints.length,
    newToday: complaints.filter((c) => new Date(c.submittedAt).toDateString() === today).length,
    inProgress: complaints.filter((c) => ["under_review", "investigating"].includes(c.status)).length,
    pendingApproval: complaints.filter((c) => c.status === "pending_approval").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
    escalated: complaints.filter((c) => c.status === "escalated").length,
  };
}
