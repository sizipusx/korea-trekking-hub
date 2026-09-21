import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-noto',
});

export const metadata: Metadata = {
  title: 'Korea Outdoor Hub — 전국 라이딩·백패킹·캠핑·트레킹 가이드',
  description: '전국의 자전거길, 백패킹 장소, 캠핑장, 트레킹 코스를 한눈에.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body className="bg-slate-950 text-slate-200 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}