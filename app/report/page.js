'use client';

import { useState } from 'react';

export default function ReportPage() {
  const [formData, setFormData] = useState({
    name: '',
    paidAmount: '',
    accountLastFive: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        alert('找不到該姓名的登記資料，請確認姓名是否正確。');
        setIsSubmitting(false);
        return;
      }

      // Update the first matching document (assuming name is unique enough for this simple app)
      const userDoc = querySnapshot.docs[0];
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
        <a href="/" className="btn btn-primary mt-2">返回首頁</a>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="text-center">回報繳費資訊</h1>
      <p className="text-center mb-2" style={{ opacity: 0.8 }}>請填寫您的姓名與匯款資訊，以利我們對帳。</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">姓名</label>
          <input 
            type="text" 
            name="name" 
            className="form-input" 
            placeholder="請輸入您登記的真實姓名"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

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
