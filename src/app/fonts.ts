import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

export const fontSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-body",
  display: "swap",
});
