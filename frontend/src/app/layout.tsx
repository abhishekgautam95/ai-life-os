import type { Metadata } from "next";

import { AppFrame } from "@/components/app-frame";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI Life OS",
  description: "Simple personal productivity MVP built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
