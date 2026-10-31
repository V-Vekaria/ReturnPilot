"use client";

import { ComplaintStatus, formatStatus, statusColor, Priority, formatPriority, priorityColor } from "../lib/mockData";

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`badge ${statusColor(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {formatStatus(status)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`badge ${priorityColor(priority)}`}>
      {formatPriority(priority)}
    </span>
  );
}
