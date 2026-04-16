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
  title: "EthioGuessr - Discover Ethiopia",
  description: "The ultimate Ethiopian street view guessing game. Explore the beauty of Ethiopia, from the bustling streets of Addis Ababa to historical landmarks.",
  openGraph: {
    title: "EthioGuessr - Discover Ethiopia",
    description: "Explore and guess locations across Ethiopia in this immersive street view game. Can you pinpoint where you are?",
    url: "https://ethioguessr.vercel.app",
    siteName: "EthioGuessr",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EthioGuessr - Discover Ethiopia",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EthioGuessr - Discover Ethiopia",
    description: "Explore and guess locations across Ethiopia in this immersive street view game. Can you pinpoint where you are?",
    images: ["/og-image.png"],
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
