'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      
      // Auto-append @hsps.tw if no @ is present
      const emailToLogin = account.includes('@') ? account : `${account}@hsps.tw`;
      
      await signInWithEmailAndPassword(auth, emailToLogin, password);
      // Login successful, auth state observer in dashboard will handle the rest
      router.push('/admin/dashboard');
    } catch (error) {
      console.error(error);
      alert('登入失敗！帳號或密碼錯誤。');
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
      <h1 className="text-center">管理員登入</h1>
      <form onSubmit={handleLogin}>
        <div className="form-group mt-2">
          <label className="form-label">請輸入帳號</label>
          <input 
            type="text" 
            className="form-input" 
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            required
          />
        </div>
        <div className="form-group mt-1">
          <label className="form-label">請輸入密碼</label>
          <input 
            type="password" 
            className="form-input" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary mt-1" disabled={loading}>
          {loading ? '登入中...' : '登入'}
        </button>
      </form>
    </div>
  );
}
