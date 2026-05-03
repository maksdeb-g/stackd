import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Stackd – Study Buddy",
  description: "Your unified learning resource platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-cream font-body antialiased">
        <Nav />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
      </body>
    </html>
  );
}
