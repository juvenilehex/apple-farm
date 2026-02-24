import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/polish.css";
import Sidebar from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";

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
        {/* Microsoft Clarity - 60대 사용자 행동 분석 (rage click, dead click, session recording) */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${process.env.NEXT_PUBLIC_CLARITY_ID}");`,
            }}
          />
        )}
        {/* Skip-to-content — keyboard accessibility for screen readers & Tab navigation */}
        <a href="#main-content" className="skip-to-content">
          본문으로 건너뛰기
        </a>
        <AnalyticsProvider>
          <ToastProvider>
            <Sidebar />
            <main id="main-content" className="min-h-screen pt-12 lg:pt-0 lg:ml-[240px] pb-20 lg:pb-0">
              <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {children}
              </div>
            </main>
          </ToastProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
