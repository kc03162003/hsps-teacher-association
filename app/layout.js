import './globals.css';

export const metadata = {
  title: '教師會收費',
  description: '教師會費繳交與管理系統',
};

import Link from 'next/link';

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>
        <nav className="navbar">
          <div className="nav-brand">海山國小教師會</div>
          <div className="nav-links">
            <Link href="/" className="nav-link">表單登記</Link>
            <Link href="/report" className="nav-link">回報繳費</Link>
            <Link href="/admin/dashboard" className="nav-link">管理員後台</Link>
          </div>
        </nav>
        <main style={{ padding: '0 1rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
