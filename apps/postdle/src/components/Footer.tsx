import Link from 'next/link';

// 회사 정보 (pagedle의 COMPANY 상수와 동일하게 유지)
const COMPANY = {
  name: 'Miraepa Inc.',
  nameKr: '미래파',
  email: 'contact@miraepa.com',
  businessNumber: '375-01-03494',
  copyright: '© Miraepa Inc. All rights reserved.',
} as const;

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-copyright">{COMPANY.copyright}</div>
      <ul className="footer-info">
        <li>E-mail : {COMPANY.email}</li>
        <li>
          {COMPANY.nameKr} ({COMPANY.name}) <span className="sep">·</span> 사업자등록번호{' '}
          {COMPANY.businessNumber}
        </li>
        <li>
          <Link href="/terms">이용약관</Link>
        </li>
        <li>
          <Link href="/privacy">개인정보 처리방침</Link>
        </li>
      </ul>
    </footer>
  );
}
