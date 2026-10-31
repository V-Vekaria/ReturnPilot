import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "ReturnPilot", description: "Evidence-led dispute resolution demo" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <header className="border-b border-slate-200 bg-white"><div className="shell flex flex-wrap items-center justify-between gap-4 py-5">
      <Link href="/" className="text-xl font-black tracking-tight text-ink">Return<span className="text-teal">Pilot</span><span className="ml-2 rounded bg-pale px-2 py-1 align-middle text-[10px] font-bold uppercase tracking-wider text-teal">Demo</span></Link>
      <nav className="flex gap-5 text-sm font-semibold"><Link className="hover:text-teal" href="/">Customer Portal</Link><Link className="hover:text-teal" href="/retailer">Retailer Dashboard</Link></nav>
    </div></header>{children}
    <footer className="shell py-10 text-xs text-slate-500">Fictional orders and merchant policy · Simulated refunds only · Staff approval required</footer>
  </body></html>;
}
