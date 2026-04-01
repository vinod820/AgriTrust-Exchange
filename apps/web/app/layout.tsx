import "./globals.css";
import type { Metadata } from "next";
import { AppShell } from "@/components/dashboard/AppShell";

export const metadata: Metadata = {
  title: "AgriTrust Exchange",
  description: "Voice-first agriculture marketplace with AI analysis, escrow, traceability, and live buyer verification."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
