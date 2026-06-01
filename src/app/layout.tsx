import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";
import "./globals.css";
import { RootSessionProvider } from "@/components/providers/SessionProvider";
import { ServiceWorker } from "@/components/pwa/ServiceWorker";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "FYI - Personal Memory OS",
  description: "FYI is a private memory companion that keeps your context organized.",
  manifest: "/manifest.json",
  themeColor: "#0f0e0b",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
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
      className={`${sora.variable} ${fraunces.variable} dark min-h-dvh`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh font-sans">
        <RootSessionProvider>
          <ServiceWorker />
          {children}
        </RootSessionProvider>
      </body>
    </html>
  );
}
