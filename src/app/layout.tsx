import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Web3Provider from '../components/Web3Provider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LiliPad",
  description: "LilyPad NFT Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-blue-500">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Web3Provider>
        {children}
        </Web3Provider>
      </body>
    </html>
  );
}
