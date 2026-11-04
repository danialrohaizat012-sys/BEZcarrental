import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BEZ Car Rental — Demo Prototype",
  description:
    "Independent sales prototype of a car rental website and booking management system, prepared by BinaLab. Not affiliated with or endorsed by BEZ Car Rental.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0e4d57",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
