"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Backdrop click closes */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className={`modal-panel ${maxWidth} relative mx-4`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink transition-colors"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
