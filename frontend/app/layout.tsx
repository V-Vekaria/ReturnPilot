import type { Metadata } from "next";
import CustomerNav from "./components/CustomerNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReturnPilot — Returns and complaints, made simple.",
  description: "ReturnPilot helps customers submit complaints and track returns. Retailers manage, investigate and resolve cases in one professional platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
