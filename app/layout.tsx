import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Islamabad Property Hub | Agent Inventory Platform",
  description:
    "Private property inventory platform for verified real estate agents in Islamabad, Pakistan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ width: "100%", overflowX: "hidden" }}>
      <body className={inter.className} style={{ width: "100%", overflowX: "hidden" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
