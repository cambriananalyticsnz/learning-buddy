import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import NavBar from "@/components/NavBar";

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
        <AuthGuard>
          <div className="h-full flex flex-col">
            <main className="flex-1 overflow-hidden">{children}</main>
            <NavBar />
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}
