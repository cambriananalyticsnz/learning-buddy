import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Learning Buddy",
  description: "AI-powered learning assistant for Cambridge CIE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-black text-zinc-100">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
