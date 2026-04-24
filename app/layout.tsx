import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OmniStream - Premium Streaming CMS",
    template: "%s | OmniStream",
  },
  description: "Advanced Content Management System for live TV channels and Video-On-Demand. Generate JSON feeds for Roku Direct Publisher autonomously.",
  keywords: ["CMS", "Streaming", "VOD", "Live TV", "Roku", "Direct Publisher", "JSON Feed"],
  authors: [{ name: "OmniStream Team" }],
  creator: "OmniStream",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://omnistream.app",
    title: "OmniStream - Premium Streaming CMS",
    description: "Advanced Content Management System for live TV channels and Video-On-Demand.",
    siteName: "OmniStream",
  },
  twitter: {
    card: "summary_large_image",
    title: "OmniStream - Premium Streaming CMS",
    description: "Advanced Content Management System for live TV channels and Video-On-Demand.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
