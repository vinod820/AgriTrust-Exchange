import "./globals.css";
import type { Metadata } from "next";
import { VoiceProvider } from "@/components/voice/VoiceProvider";

export const metadata: Metadata = {
  title: "KrishiVoice Chain | Farm Meets Future",
  description: "Voice-first agriculture marketplace with AI-powered crop analysis, blockchain traceability, and smart escrow payments.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <VoiceProvider>{children}</VoiceProvider>
      </body>
    </html>
  );
}
