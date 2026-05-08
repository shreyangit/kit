import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

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
    default: "kit — 60 Browser Tools",
    template: "%s — kit",
  },
  description:
    "60 free, instant browser tools — image converter, PDF merger, regex tester, JSON formatter, barcode generator, and more. No uploads, no tracking, 100% private.",
  metadataBase: new URL("https://kit.shreyannarula.com"),
  keywords: [
    "browser tools", "online tools", "free tools", "developer tools",
    "image converter", "pdf tools", "json formatter", "regex tester",
    "barcode generator", "password generator", "no upload", "privacy",
  ],
  authors: [{ name: "Shreyan Narula", url: "https://shreyannarula.com" }],
  creator: "Shreyan Narula",
  openGraph: {
    type: "website",
    url: "https://kit.shreyannarula.com",
    siteName: "kit",
    title: "kit — 60 Instant Browser Tools",
    description:
      "60 free browser tools: image, PDF, text, dev, design and more. Zero uploads. Zero tracking. Works offline.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "kit — 60 instant browser tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@shreyannarula",
    creator: "@shreyannarula",
    title: "kit — 60 Instant Browser Tools",
    description:
      "60 free browser tools: image, PDF, text, dev, design and more. No uploads, no tracking.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
