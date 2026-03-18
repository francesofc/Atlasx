import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { I18nProvider } from "@/contexts/I18nContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atlas X",
  description: "Premium global intelligence dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <I18nProvider>
          <ProfileProvider>{children}</ProfileProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
