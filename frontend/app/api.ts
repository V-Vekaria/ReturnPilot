export type Order = { id: string; item: string; amount_pence: number; delivery_status: string; delivered_at: string; proof_of_delivery: string };
export type Case = { id: string; order_id: string; issue_type: string; description: string; recommendation: string; proposed_amount_pence: number; policy_reason: string; investigation: string; status: string; created_at: string };
export type Audit = { id: number; event_type: string; actor: string; details: Record<string, unknown>; created_at: string };

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const tokens = { customer: process.env.NEXT_PUBLIC_CUSTOMER_TOKEN || "demo-customer-token", retailer: process.env.NEXT_PUBLIC_RETAILER_TOKEN || "demo-retailer-token" };

export async function api<T>(path: string, role: "customer" | "retailer", options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${base}${path}`, { ...options, cache: "no-store", headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens[role]}`, ...options.headers } });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { const error = await response.json(); message = error.detail || message; } catch { /* keep status */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const money = (pence: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
export const title = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
