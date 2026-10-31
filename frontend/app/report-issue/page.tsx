"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import CustomerNav from "../components/CustomerNav";
import {
  generateComplaintId,
  upsertComplaint,
  IssueType,
  Resolution,
  Complaint,
} from "../lib/mockData";

// ─── Step types ───────────────────────────────────────────────────────────────
interface Step1 {
  fullName: string;
  email: string;
  phone: string;
}
interface Step2 {
  retailerName: string;
  orderNumber: string;
  purchaseDate: string;
  productName: string;
  productCategory: string;
}
interface Step3 {
  issueType: IssueType;
  complaintTitle: string;
  description: string;
  issueDate: string;
  preferredResolution: Resolution;
}
interface Step4 {
  files: string[];
}

const STEPS = ["Your Details", "Purchase Info", "Complaint", "Evidence", "Review"];
const CATEGORIES = ["Electronics", "Clothing", "Footwear", "Home Appliances", "Kitchen Appliances", "Beauty", "Furniture", "Sports & Outdoors", "Toys", "Food & Drink", "Other"];
const ISSUE_TYPES: { value: IssueType; label: string }[] = [
  { value: "damaged_product", label: "Damaged product" },
  { value: "defective_product", label: "Defective product" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "missing_delivery", label: "Missing delivery" },
  { value: "refund_issue", label: "Refund issue" },
  { value: "return_request", label: "Return request" },
  { value: "other", label: "Other" },
];
const RESOLUTIONS: { value: Resolution; label: string }[] = [
  { value: "refund", label: "Refund" },
  { value: "replacement", label: "Replacement" },
  { value: "repair", label: "Repair" },
  { value: "other", label: "Other" },
];

// ─── Validation helpers ───────────────────────────────────────────────────────
function validateStep1(s: Step1) {
  const errs: Record<string, string> = {};
  if (!s.fullName.trim()) errs.fullName = "Full name is required.";
  if (!s.email.trim()) errs.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) errs.email = "Enter a valid email address.";
  return errs;
}
function validateStep2(s: Step2) {
  const errs: Record<string, string> = {};
  if (!s.retailerName.trim()) errs.retailerName = "Retailer name is required.";
  if (!s.orderNumber.trim()) errs.orderNumber = "Order number is required.";
  if (!s.purchaseDate) errs.purchaseDate = "Purchase date is required.";
  if (!s.productName.trim()) errs.productName = "Product name is required.";
  if (!s.productCategory) errs.productCategory = "Product category is required.";
  return errs;
}
function validateStep3(s: Step3) {
  const errs: Record<string, string> = {};
  if (!s.complaintTitle.trim()) errs.complaintTitle = "Complaint title is required.";
  if (!s.description.trim() || s.description.trim().length < 20)
    errs.description = "Please provide at least 20 characters describing the issue.";
  if (!s.issueDate) errs.issueDate = "Date the issue occurred is required.";
  return errs;
}

// ─── Field component ──────────────────────────────────────────────────────────
function Field({ label, id, error, required, children }: {
  label: string; id: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="input-group">
      <label className="label" htmlFor={id}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="error-msg" role="alert">{error}</p>}
    </div>
  );
}

// ─── Progress indicator ───────────────────────────────────────────────────────
function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => (
          <div key={i} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                  i < current
                    ? "step-completed"
                    : i === current
                    ? "step-active ring-4 ring-teal/20"
                    : "step-pending"
                }`}
              >
                {i < current ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`mt-2 hidden text-xs font-medium sm:block ${i === current ? "text-teal" : "text-slate-400"}`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 transition-all duration-300 ${i < current ? "bg-teal" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ReportIssuePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [step1, setStep1] = useState<Step1>({ fullName: "", email: "", phone: "" });
  const [step2, setStep2] = useState<Step2>({
    retailerName: "", orderNumber: "", purchaseDate: "", productName: "", productCategory: "",
  });
  const [step3, setStep3] = useState<Step3>({
    issueType: "damaged_product", complaintTitle: "", description: "", issueDate: "", preferredResolution: "refund",
  });
  const [step4, setStep4] = useState<Step4>({ files: [] });
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function advance() {
    let errs: Record<string, string> = {};
    if (step === 0) errs = validateStep1(step1);
    if (step === 1) errs = validateStep2(step2);
    if (step === 2) errs = validateStep3(step3);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const names = Array.from(fileList).map((f) => f.name);
    setStep4((prev) => ({ files: [...new Set([...prev.files, ...names])] }));
  }

  function removeFile(name: string) {
    setStep4((prev) => ({ files: prev.files.filter((f) => f !== name) }));
  }

  async function handleSubmit() {
    if (!confirmed) { setErrors({ confirm: "Please confirm the information is accurate." }); return; }
    setSubmitting(true);
    // Simulate async delay
    await new Promise((r) => setTimeout(r, 1200));
    const id = generateComplaintId();
    const now = new Date().toISOString();
    const complaint: Complaint = {
      id,
      customerName: step1.fullName,
      customerEmail: step1.email,
      customerPhone: step1.phone || undefined,
      retailerName: step2.retailerName,
      orderNumber: step2.orderNumber,
      purchaseDate: step2.purchaseDate,
      productName: step2.productName,
      productCategory: step2.productCategory,
      issueType: step3.issueType,
      complaintTitle: step3.complaintTitle,
      description: step3.description,
      issueDate: step3.issueDate,
      preferredResolution: step3.preferredResolution,
      status: "submitted",
      priority: "medium",
      submittedAt: now,
      updatedAt: now,
      internalComments: [],
      timeline: [
        {
          id: "t-init",
          timestamp: now,
          actor: step1.fullName,
          actorRole: "customer",
          event: "Complaint submitted",
        },
        {
          id: "t-sys",
          timestamp: now,
          actor: "System",
          actorRole: "system",
          event: "Case created and queued for review",
        },
      ],
      evidenceFiles: step4.files,
    };
    upsertComplaint(complaint);
    // Store last submitted ID for confirmation page
    localStorage.setItem("rp_last_complaint_id", id);
    router.push("/complaint-submitted");
  }

  const summaryLabel = (label: string, value: string) => (
    <div className="flex justify-between gap-4 text-sm py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );

  const issueLabelMap: Record<IssueType, string> = {
    damaged_product: "Damaged product", defective_product: "Defective product", wrong_item: "Wrong item received",
    missing_delivery: "Missing delivery", refund_issue: "Refund issue", return_request: "Return request", other: "Other",
  };
  const resolutionLabelMap: Record<Resolution, string> = {
    refund: "Refund", replacement: "Replacement", repair: "Repair", other: "Other",
  };

  return (
    <div className="min-h-screen bg-sand">
      <CustomerNav active="/report-issue" />

      <main className="shell py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <p className="eyebrow">Customer Portal</p>
            <h1 className="mt-2 page-title">Report an Issue</h1>
            <p className="mt-3 text-slate-600">Complete each step to submit your complaint. All fields marked * are required.</p>
          </div>

          <ProgressSteps current={step} />

          <div className="card animate-fade-in">
            {/* ── Step 0: Customer Info ─────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <p className="eyebrow">Step 1 of 5</p>
                  <h2 className="section-title mt-1">Your details</h2>
                </div>
                <Field label="Full name" id="fullName" error={errors.fullName} required>
                  <input id="fullName" className={`input ${errors.fullName ? "input-error" : ""}`} value={step1.fullName}
                    onChange={(e) => setStep1((p) => ({ ...p, fullName: e.target.value }))} placeholder="e.g. Emma Thompson" />
                </Field>
                <Field label="Email address" id="email" error={errors.email} required>
                  <input id="email" type="email" className={`input ${errors.email ? "input-error" : ""}`} value={step1.email}
                    onChange={(e) => setStep1((p) => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
                </Field>
                <Field label="Phone number" id="phone" error={errors.phone}>
                  <input id="phone" type="tel" className="input" value={step1.phone}
                    onChange={(e) => setStep1((p) => ({ ...p, phone: e.target.value }))} placeholder="Optional" />
                </Field>
              </div>
            )}

            {/* ── Step 1: Purchase Details ──────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <p className="eyebrow">Step 2 of 5</p>
                  <h2 className="section-title mt-1">Purchase details</h2>
                </div>
                <Field label="Retailer name" id="retailerName" error={errors.retailerName} required>
                  <input id="retailerName" className={`input ${errors.retailerName ? "input-error" : ""}`} value={step2.retailerName}
                    onChange={(e) => setStep2((p) => ({ ...p, retailerName: e.target.value }))} placeholder="e.g. TechNova Electronics" />
                </Field>
                <Field label="Order number" id="orderNumber" error={errors.orderNumber} required>
                  <input id="orderNumber" className={`input ${errors.orderNumber ? "input-error" : ""}`} value={step2.orderNumber}
                    onChange={(e) => setStep2((p) => ({ ...p, orderNumber: e.target.value }))} placeholder="e.g. TNE-88421" />
                </Field>
                <Field label="Purchase date" id="purchaseDate" error={errors.purchaseDate} required>
                  <input id="purchaseDate" type="date" className={`input ${errors.purchaseDate ? "input-error" : ""}`} value={step2.purchaseDate}
                    onChange={(e) => setStep2((p) => ({ ...p, purchaseDate: e.target.value }))} max={new Date().toISOString().split("T")[0]} />
                </Field>
                <Field label="Product name" id="productName" error={errors.productName} required>
                  <input id="productName" className={`input ${errors.productName ? "input-error" : ""}`} value={step2.productName}
                    onChange={(e) => setStep2((p) => ({ ...p, productName: e.target.value }))} placeholder="e.g. Sony WH-1000XM5 Headphones" />
                </Field>
                <Field label="Product category" id="productCategory" error={errors.productCategory} required>
                  <select id="productCategory" className={`input ${errors.productCategory ? "input-error" : ""}`} value={step2.productCategory}
                    onChange={(e) => setStep2((p) => ({ ...p, productCategory: e.target.value }))}>
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            )}

            {/* ── Step 2: Complaint Details ─────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="eyebrow">Step 3 of 5</p>
                  <h2 className="section-title mt-1">Complaint details</h2>
                </div>
                <Field label="Issue type" id="issueType" required>
                  <select id="issueType" className="input" value={step3.issueType}
                    onChange={(e) => setStep3((p) => ({ ...p, issueType: e.target.value as IssueType }))}>
                    {ISSUE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Complaint title" id="complaintTitle" error={errors.complaintTitle} required>
                  <input id="complaintTitle" className={`input ${errors.complaintTitle ? "input-error" : ""}`} value={step3.complaintTitle}
                    onChange={(e) => setStep3((p) => ({ ...p, complaintTitle: e.target.value }))} placeholder="Brief summary of your issue" />
                </Field>
                <Field label="Detailed description" id="description" error={errors.description} required>
                  <textarea id="description" rows={5} className={`input min-h-[120px] ${errors.description ? "input-error" : ""}`}
                    value={step3.description} placeholder="Describe what happened in as much detail as possible..."
                    onChange={(e) => setStep3((p) => ({ ...p, description: e.target.value }))} />
                  <p className="text-xs text-slate-400 mt-1">{step3.description.length} / 2000 characters</p>
                </Field>
                <Field label="Date the issue occurred" id="issueDate" error={errors.issueDate} required>
                  <input id="issueDate" type="date" className={`input ${errors.issueDate ? "input-error" : ""}`} value={step3.issueDate}
                    onChange={(e) => setStep3((p) => ({ ...p, issueDate: e.target.value }))} max={new Date().toISOString().split("T")[0]} />
                </Field>
                <Field label="Preferred resolution" id="preferredResolution" required>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {RESOLUTIONS.map((r) => (
                      <button key={r.value} type="button"
                        onClick={() => setStep3((p) => ({ ...p, preferredResolution: r.value }))}
                        className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                          step3.preferredResolution === r.value
                            ? "border-teal bg-pale text-teal"
                            : "border-slate-200 hover:border-teal/40 hover:bg-slate-50"
                        }`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {/* ── Step 3: Evidence Upload ───────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <p className="eyebrow">Step 4 of 5</p>
                  <h2 className="section-title mt-1">Supporting evidence</h2>
                  <p className="text-sm text-slate-500 mt-1">Upload photos or documents to support your complaint. This step is optional.</p>
                </div>

                {/* Drag-and-drop area */}
                <div
                  className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
                    dragOver ? "border-teal bg-pale" : "border-slate-300 hover:border-teal/50 hover:bg-slate-50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                >
                  <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx"
                    className="sr-only" onChange={(e) => addFiles(e.target.files)} />
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal">
                    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="font-semibold text-ink">Drag and drop files here</p>
                  <p className="text-sm text-slate-500 mt-1">or</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="button button-sm mt-3">
                    Browse files
                  </button>
                  <p className="text-xs text-slate-400 mt-3">JPG, PNG, PDF, DOC up to 10MB each</p>
                </div>

                {/* File previews */}
                {step4.files.length > 0 && (
                  <div className="space-y-2">
                    {step4.files.map((name) => (
                      <div key={name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/10 text-teal text-xs font-bold">
                            {name.split(".").pop()?.toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-ink truncate max-w-xs">{name}</span>
                        </div>
                        <button type="button" onClick={() => removeFile(name)}
                          className="ml-3 text-slate-400 hover:text-red-500 transition-colors" aria-label={`Remove ${name}`}>
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 4: Review & Submit ───────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <p className="eyebrow">Step 5 of 5</p>
                  <h2 className="section-title mt-1">Review and submit</h2>
                  <p className="text-sm text-slate-500 mt-1">Check your details carefully before submitting.</p>
                </div>

                {/* Summary sections */}
                <ReviewSection title="Your Details" onEdit={() => setStep(0)}>
                  {summaryLabel("Full name", step1.fullName)}
                  {summaryLabel("Email", step1.email)}
                  {summaryLabel("Phone", step1.phone || "Not provided")}
                </ReviewSection>

                <ReviewSection title="Purchase Details" onEdit={() => setStep(1)}>
                  {summaryLabel("Retailer", step2.retailerName)}
                  {summaryLabel("Order number", step2.orderNumber)}
                  {summaryLabel("Purchase date", step2.purchaseDate)}
                  {summaryLabel("Product", step2.productName)}
                  {summaryLabel("Category", step2.productCategory)}
                </ReviewSection>

                <ReviewSection title="Complaint Details" onEdit={() => setStep(2)}>
                  {summaryLabel("Issue type", issueLabelMap[step3.issueType])}
                  {summaryLabel("Title", step3.complaintTitle)}
                  {summaryLabel("Issue date", step3.issueDate)}
                  {summaryLabel("Preferred resolution", resolutionLabelMap[step3.preferredResolution])}
                  <div className="text-sm py-2">
                    <span className="text-slate-500 block mb-1">Description</span>
                    <span className="font-medium">{step3.description}</span>
                  </div>
                </ReviewSection>

                <ReviewSection title="Evidence" onEdit={() => setStep(3)}>
                  {step4.files.length === 0
                    ? <p className="text-sm text-slate-500 py-2">No files uploaded.</p>
                    : step4.files.map((f) => <div key={f} className="text-sm py-1.5 border-b border-slate-100 last:border-0">{f}</div>)
                  }
                </ReviewSection>

                {/* Confirmation checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-teal" />
                  <span className="text-sm text-slate-700 leading-relaxed">
                    I confirm that the information provided above is accurate and complete to the best of my knowledge.
                  </span>
                </label>
                {errors.confirm && <p className="error-msg">{errors.confirm}</p>}
              </div>
            )}

            {/* ── Navigation buttons ────────────────────────────────────── */}
            <div className={`mt-8 flex gap-3 ${step === 0 ? "justify-end" : "justify-between"}`}>
              {step > 0 && (
                <button type="button" onClick={() => { setErrors({}); setStep((s) => s - 1); }} className="button-secondary">
                  ← Previous
                </button>
              )}
              {step < 4 ? (
                <button type="button" onClick={advance} className="button">
                  Next →
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting} className="button">
                  {submitting ? (
                    <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Submitting…</>
                  ) : "Submit Complaint"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
        <span className="text-sm font-bold text-ink">{title}</span>
        <button type="button" onClick={onEdit}
          className="text-xs font-semibold text-teal hover:underline">Edit</button>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}
