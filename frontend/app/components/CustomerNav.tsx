"use client";

import Link from "next/link";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
}

const customerNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Report an Issue", href: "/report-issue" },
  { label: "Track Complaint", href: "/track-case" },
  { label: "Returns Policy", href: "/policy" },
  { label: "Help", href: "/help" },
  { label: "Retailer Portal", href: "/retailer/dashboard" },
];

export default function CustomerNav({ active }: { active?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="shell flex items-center justify-between gap-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal text-white text-sm font-black">RP</span>
          Return<span className="text-teal">Pilot</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {customerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active === item.href
                  ? "bg-pale text-teal"
                  : "text-slate-600 hover:bg-slate-100 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/report-issue" className="button button-sm ml-3">
            Report an Issue
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="button-icon md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-100 bg-white px-5 pb-4 md:hidden animate-fade-in">
          {customerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
