import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupplyLink AI",
  description: "AI-powered B2B marketplace for manufacturers and retailers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
