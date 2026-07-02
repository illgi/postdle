import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/config';
import SearchBox from '@/components/SearchBox';
import AuthNav from '@/components/AuthNav';
import '@repo/post-editor/style.css';
import './globals.css';

export const metadata: Metadata = {
  title: `${BRAND.name} ${BRAND.nameKr} — 글 발행 플랫폼`,
  description: 'pagedle 계정으로 로그인해 나만의 글을 발행하세요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="inner">
            <Link href="/" className="brand" aria-label={BRAND.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt={BRAND.name} className="brand-logo" />
            </Link>
            <div className="header-search">
              <SearchBox />
            </div>
            <AuthNav />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
