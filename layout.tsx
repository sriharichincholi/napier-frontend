import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NAPIER v2.0 - Airfare Price Index & Live Fares",
  description: "National Airfare Price Index Engine: live one-way fares, forecasts and index trends",
};

// Runs before paint so the saved theme (default: dark) applies without a flash.
const themeScript = `try{var t=localStorage.getItem("napier-theme");document.documentElement.classList.toggle("dark",t?t==="dark":true)}catch(e){document.documentElement.classList.add("dark")}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
