import type { Metadata, Viewport } from "next";
import { fontSerif, fontSans } from "@/app/fonts";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F4EFE6",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://witch.pw"),
  title: {
    default: "Witch — website monitoring beyond uptime",
    template: "%s · Witch",
  },
  description:
    "Uptime tells you the site is online. Witch tells you if it still works — HTTP, real browsers, and visual diffs.",
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
    <html lang="en">
      <body className={`antialiased ${fontSerif.variable} ${fontSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
