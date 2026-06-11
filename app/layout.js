import './globals.css';

export const metadata = {
  title: '教師會收費',
  description: '教師會費繳交與管理系統',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>
        <nav className="navbar">
          <div className="nav-brand">教師會系統</div>
          <div className="nav-links">
            <a href="/" className="nav-link">表單登記</a>
            <a href="/report" className="nav-link">回報繳費</a>
            <a href="/admin/dashboard" className="nav-link">管理員後台</a>
          </div>
        </nav>
        <main style={{ padding: '0 1rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
