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
  title: 'Korea Trekking Hub — 전국 트래킹·백패킹 가이드',
  description: '한국 전국의 트래킹·백패킹 코스를 한눈에.',
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