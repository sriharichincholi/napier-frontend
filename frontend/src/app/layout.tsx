import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NAPIER AI v2.0 - Airfare Price Index & Forecasting",
  description: "National Airfare Price Index Engine & Travel Assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
