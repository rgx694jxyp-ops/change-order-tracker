import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Change Order Tracker",
  description:
    "A simple change order and job cost tracker for small specialty contractors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}