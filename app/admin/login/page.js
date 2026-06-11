'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'HSPS115' || password === 'c1723') {
      // Dummy check, in a real app use API route with session/cookies
      localStorage.setItem('adminAuth', password === 'c1723' ? 'super' : 'view');
      router.push('/admin/dashboard');
    } else {
      alert('密碼錯誤！');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
      <h1 className="text-center">管理員登入</h1>
      <form onSubmit={handleLogin}>
        <div className="form-group mt-2">
          <label className="form-label">請輸入密碼</label>
          <input 
            type="password" 
            className="form-input" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary mt-1">登入</button>
      </form>
    </div>
  );
}
