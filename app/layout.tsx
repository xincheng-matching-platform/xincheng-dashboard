import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 使用最穩定的 Inter 字體，避免 Geist 字體導致的建置錯誤
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "心成職缺儀表板",
  description: "專業職缺媒合管理系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}