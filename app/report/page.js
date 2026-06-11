'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ReportPage() {
  const [formData, setFormData] = useState({
    name: '',
    paidAmount: '',
    accountLastFive: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!formData.name) {
      return alert('請先輸入姓名再進行查詢');
    }
    setIsSearching(true);
    setSearchResult(null);
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const q = query(collection(db, 'teacher_association_forms'), where('name', '==', formData.name));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('找不到該姓名的登記資料，請確認您輸入的姓名無誤，若姓名無誤，表示您尚未登記您要加入的教師會，請至表單登記網頁登記，謝謝!');
      } else {
        const userData = querySnapshot.docs[0].data();
        
        let associations = [];
        if (userData.joinHaishan) associations.push('海山校教師會');
        if (userData.joinNFEU) associations.push('全教產');
        if (userData.joinNTA) associations.push('全教總');
        if (userData.joinNone) associations.push('不加入任何教師會');

        setSearchResult({
          unit: userData.unit,
          associations: associations.join('、 '),
          totalFee: userData.totalFee
        });
      }
    } catch (error) {
      console.error(error);
      alert('網路錯誤，請稍後再試。');
    }
    setIsSearching(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.paidAmount || !formData.accountLastFive) {
      return alert('請填寫完整資訊');
    }
    
    setIsSubmitting(true);
    try {
      const { collection, query, where, getDocs, updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      // Find the user by name
      const q = query(collection(db, 'teacher_association_forms'), where('name', '==', formData.name));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('找不到該姓名的登記資料，請確認您輸入的姓名無誤，若姓名無誤，表示您尚未登記您要加入的教師會，請至表單登記網頁登記，謝謝!');
        setIsSubmitting(false);
        return;
      }

      // Update the first matching document (assuming name is unique enough for this simple app)
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Check if the paid amount matches the registered total fee
      if (parseInt(formData.paidAmount) !== userData.totalFee) {
        alert('您的繳費金額與您之前登記的金額不同，請確認您的資料無誤。');
        setIsSubmitting(false);
        return;
      }

      await updateDoc(doc(db, 'teacher_association_forms', userDoc.id), {
        paidAmount: parseInt(formData.paidAmount),
        accountLastFive: formData.accountLastFive
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('網路錯誤，請稍後再試。');
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="container text-center">
        <h2>回報成功！</h2>
        <div className="alert alert-success mt-1 mb-2">
          您已成功回報繳費資訊，管理員將會進行對帳。
        </div>
        <Link href="/" className="btn btn-primary mt-2" style={{ display: 'inline-block' }}>返回首頁</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="text-center">回報繳費資訊</h1>
      <div className="mb-2" style={{ opacity: 0.8, lineHeight: '1.8', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px' }}>
        <p style={{ margin: 0 }}>1. 如不確定您上次填寫的內容，請輸入姓名，按「查詢登記資訊」。</p>
        <p style={{ margin: 0 }}>2. 如已確定您上次填寫內容，請輸入姓名後，直接填寫金額與帳號後五碼，按「送出回報」。</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">姓名</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
            <input 
              type="text" 
              name="name" 
              className="form-input" 
              placeholder="請輸入您登記的真實姓名"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ flex: 1 }}
            />
            <button type="button" onClick={handleSearch} className="btn" style={{ width: 'auto', flex: '0 0 auto', padding: '0 1rem', whiteSpace: 'nowrap', backgroundColor: '#e2e8f0', color: '#1e293b' }} disabled={isSearching}>
              {isSearching ? '查詢中...' : '查詢登記資訊'}
            </button>
          </div>
        </div>

        {searchResult && (
          <div className="alert mt-1 mb-1" style={{ backgroundColor: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.1rem' }}>您的登記資訊</h3>
            <p style={{ margin: '0.2rem 0' }}><strong>單位：</strong>{searchResult.unit}</p>
            <p style={{ margin: '0.2rem 0' }}><strong>參加教師會：</strong>{searchResult.associations}</p>
            <p style={{ margin: '0.2rem 0' }}><strong>應繳交金額：</strong>{searchResult.totalFee} 元</p>
            <hr style={{ margin: '0.5rem 0', borderColor: '#bae6fd', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#dc2626' }}>※ 如內容有誤請洽教師會</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1 mt-1">
          <div className="form-group">
            <label className="form-label">已繳金額</label>
            <input 
              type="number" 
              name="paidAmount" 
              className="form-input" 
              placeholder="例如：1400"
              value={formData.paidAmount}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">匯款帳號後五碼</label>
            <input 
              type="text" 
              name="accountLastFive" 
              className="form-input" 
              placeholder="例如：12345"
              maxLength={5}
              value={formData.accountLastFive}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary mt-1" disabled={isSubmitting}>
          {isSubmitting ? '處理中...' : '送出回報'}
        </button>
      </form>
    </div>
  );
}
