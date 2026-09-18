import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://witch.pw"),
  title: {
    default: "Witch — website monitoring beyond uptime",
    template: "%s · Witch",
  },
  description:
    "Uptime tells you the site is online. Witch tells you if it still works.",
  icons: { icon: "/mark.svg" },
  openGraph: {
    title: "Witch",
    description: "Website monitoring beyond uptime.",
    url: "https://witch.pw",
    siteName: "Witch",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
