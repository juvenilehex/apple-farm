import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "사과농장 — 스마트 과수원 플랫폼",
  description: "사과 품종 도감, 월별 작업 캘린더, 자동 과수원 설계, 기상 정보, 경매 시세, 수익 시뮬레이션.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('apple-farm-theme');if(t)document.documentElement.setAttribute('data-theme',t);var s=localStorage.getItem('apple-farm-text-size');if(s==='large')document.documentElement.classList.add('text-large');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Sidebar />
        <main className="min-h-screen pt-12 lg:pt-0 lg:ml-[240px] pb-20 lg:pb-0">
          <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
