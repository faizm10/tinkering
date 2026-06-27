import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "RepoPulse",
    template: "%s · RepoPulse",
  },
  description: "GitHub-centered product analytics for every repository.",
  openGraph: {
    title: "RepoPulse",
    description: "GitHub-centered product analytics for every repository.",
    url: appUrl,
    siteName: "RepoPulse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepoPulse",
    description: "GitHub-centered product analytics for every repository.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = (
    <html
      lang="en"
      className={`dark ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return content;

  return (
    <ClerkProvider dynamic>{content}</ClerkProvider>
  );
}
