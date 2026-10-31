"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CustomerNav from "../components/CustomerNav";
import { getComplaint, formatDate, formatIssueType, formatResolution, Complaint } from "../lib/mockData";

export default function ComplaintSubmittedPage() {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("rp_last_complaint_id");
    if (id) {
      const c = getComplaint(id);
      if (c) setComplaint(c);
    }
  }, []);

  function copyRef() {
    if (!complaint) return;
    navigator.clipboard.writeText(complaint.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-sand">
      <CustomerNav />

      <main className="shell py-14 sm:py-20">
        <div className="mx-auto max-w-2xl animate-fade-in">
          {/* Success icon */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-teal/10 animate-pulse-teal">
              <svg className="h-10 w-10 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="eyebrow mb-2">Complaint Submitted</p>
            <h1 className="page-title">Your complaint has been submitted.</h1>
            <p className="mt-4 text-slate-600 leading-relaxed max-w-md">
              We've received your complaint and it's now in our system. You'll be able to track its progress using the reference number below.
            </p>
          </div>

          {complaint ? (
            <>
              {/* Reference number card */}
              <div className="card mb-6 bg-gradient-to-br from-teal/5 to-pale border-teal/20">
                <div className="text-center">
                  <p className="eyebrow mb-2">Your complaint reference</p>
                  <div className="flex items-center justify-center gap-3 mt-1">
                    <span className="text-3xl font-black tracking-tight text-ink">{complaint.id}</span>
                    <button
                      onClick={copyRef}
                      className="button-icon"
                      aria-label="Copy reference number"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <svg className="h-4 w-4 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {copied && <p className="mt-2 text-xs font-medium text-teal">Copied to clipboard!</p>}
                  <p className="mt-3 text-xs text-slate-500">
                    Save this reference — you'll need it to track your complaint.
                  </p>
                </div>
              </div>

              {/* Complaint summary */}
              <div className="card mb-6">
                <h2 className="section-title mb-4">Complaint summary</h2>
                <dl className="space-y-3">
                  {[
                    { label: "Retailer", value: complaint.retailerName },
                    { label: "Product", value: complaint.productName },
                    { label: "Issue type", value: formatIssueType(complaint.issueType) },
                    { label: "Preferred resolution", value: formatResolution(complaint.preferredResolution) },
                    { label: "Submission date", value: formatDate(complaint.submittedAt) },
                    { label: "Current status", value: "Submitted" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0 text-sm">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="font-semibold text-right">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Status indicator */}
              <div className="card mb-6 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">Status: Submitted</p>
                    <p className="mt-1 text-xs text-blue-700 leading-relaxed">
                      Your complaint has been received and is in the queue for review. A member of the retailer's resolution team will begin investigating shortly.
                    </p>
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="card mb-8">
                <h2 className="section-title mb-4">What happens next?</h2>
                <ol className="space-y-4">
                  {[
                    { step: "1", title: "Initial review", desc: "A member of the retailer's team will review your complaint and verify the details you've provided." },
                    { step: "2", title: "Investigation", desc: "The team will investigate your complaint, reviewing any evidence and checking order history." },
                    { step: "3", title: "Decision", desc: "A decision will be made and communicated to you through this platform with a clear explanation." },
                    { step: "4", title: "Resolution", desc: "If approved, your preferred resolution (refund, replacement or repair) will be actioned." },
                  ].map((item) => (
                    <li key={item.step} className="flex gap-4">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal text-xs font-bold">
                        {item.step}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-ink">{item.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={`/track-case?ref=${complaint.id}&email=${encodeURIComponent(complaint.customerEmail)}`} className="button flex-1 justify-center">
                  Track Your Complaint
                </Link>
                <Link href="/" className="button-secondary flex-1 justify-center">
                  Return to Home
                </Link>
              </div>
            </>
          ) : (
            /* No complaint found state */
            <div className="card text-center py-12">
              <p className="text-slate-500 mb-4">No complaint details found. This can happen if you navigated directly to this page.</p>
              <Link href="/report-issue" className="button">
                Submit a Complaint
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
