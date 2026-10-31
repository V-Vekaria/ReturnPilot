"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onDone: () => void;
  duration?: number;
}

export function Toast({ message, type = "info", onDone, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  const icon =
    type === "success" ? "✓" :
    type === "error" ? "✕" :
    type === "warning" ? "⚠" : "ℹ";

  const cls =
    type === "success" ? "toast-success" :
    type === "error" ? "toast-error" :
    type === "warning" ? "toast-warning" :
    "bg-ink";

  return (
    <div className={`toast ${cls}`} role="status" aria-live="polite">
      <span className="text-base font-bold">{icon}</span>
      <span>{message}</span>
      <button onClick={onDone} className="ml-2 opacity-70 hover:opacity-100" aria-label="Dismiss">✕</button>
    </div>
  );
}

// ─── Toast manager hook ────────────────────────────────────────────────────────
interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

let toastCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function showToast(message: string, type: ToastItem["type"] = "info") {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function ToastContainer() {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onDone={() => removeToast(t.id)} />
        ))}
      </div>
    );
  }

  return { showToast, ToastContainer };
}
