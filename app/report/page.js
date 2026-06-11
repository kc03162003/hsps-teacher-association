'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ReportPage() {
  const [formData, setFormData] = useState({
    name: '',
    paidAmount: '',
    accountLastFive: '',
    transferDate: new Date().toISOString().split('T')[0],
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
          name: userData.name,
          associations: associations.join('、 '),
          totalFee: userData.totalFee,
          isReconciled: userData.isReconciled || false,
          reconciledAt: userData.reconciledAt ? (userData.reconciledAt.toDate ? userData.reconciledAt.toDate().toLocaleDateString('zh-TW') : new Date(userData.reconciledAt).toLocaleDateString('zh-TW')) : null
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
    if (!formData.name || !formData.paidAmount || !formData.accountLastFive || !formData.transferDate) {
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
        accountLastFive: formData.accountLastFive,
        transferDate: formData.transferDate
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

  const handlePrintReceipt = () => {
    if (!searchResult) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>繳費收據 - ${searchResult.name}</title>
          <style>
            body { font-family: 'Microsoft JhengHei', sans-serif; padding: 40px; color: #333; }
            .receipt-box { border: 2px solid #333; padding: 40px; max-width: 600px; margin: 0 auto; position: relative; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; color: rgba(0,0,0,0.05); z-index: -1; white-space: nowrap; font-weight: bold; }
            h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 30px; letter-spacing: 2px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 1.2rem; }
            .row.single { justify-content: flex-start; gap: 20px; }
            .footer { margin-top: 60px; text-align: right; font-size: 1.1rem; border-top: 1px dashed #ccc; padding-top: 20px; }
            @media print {
              @page { margin: 1cm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="watermark">海山國小教師會</div>
            <h1>海山國小教師會 繳費收據</h1>
            <div class="row">
              <span><strong>單位：</strong> ${searchResult.unit}</span>
              <span><strong>姓名：</strong> ${searchResult.name}</span>
            </div>
            <div class="row single">
              <span><strong>參與組織項目：</strong> ${searchResult.associations}</span>
            </div>
            <div class="row single">
              <span><strong>實收金額：</strong> 新台幣 <span style="font-size:1.5rem; font-weight:bold;">${searchResult.totalFee}</span> 元整</span>
            </div>
            <div class="row single">
              <span><strong>對帳狀態：</strong> ✅ 已由系統核銷對帳 ${searchResult.reconciledAt ? `(對帳日期：${searchResult.reconciledAt})` : ''}</span>
            </div>
            <div class="footer">
              <p>收款單位：海山國小教師會</p>
              <p>列印日期：${new Date().toLocaleDateString('zh-TW')}</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
            <p style={{ margin: '0.2rem 0' }}><strong>單位：</strong>{searchResult.unit} &nbsp;&nbsp; <strong>姓名：</strong>{searchResult.name}</p>
            <p style={{ margin: '0.2rem 0' }}><strong>參加教師會：</strong>{searchResult.associations}</p>
            <p style={{ margin: '0.2rem 0' }}><strong>應繳交金額：</strong>{searchResult.totalFee} 元</p>
            <div style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ margin: 0 }}><strong>目前對帳狀態：</strong> 
                {searchResult.isReconciled ? 
                  <span style={{ color: '#059669', fontWeight: 'bold' }}>✅ 已完成對帳 {searchResult.reconciledAt ? `(${searchResult.reconciledAt})` : ''}</span> : 
                  <span style={{ color: '#ea580c', fontWeight: 'bold' }}>⏳ 尚未對帳 (或處理中)</span>
                }
              </p>
              {searchResult.isReconciled && (
                <button type="button" onClick={handlePrintReceipt} className="btn btn-primary" style={{ width: 'auto', padding: '0.2rem 1rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  🖨️ 下載/列印收據
                </button>
              )}
            </div>
            <hr style={{ margin: '0.5rem 0', borderColor: '#bae6fd', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#dc2626' }}>※ 如內容有誤請洽教師會</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-1 mt-1">
          <div className="form-group">
            <label className="form-label">匯款日期</label>
            <input 
              type="date" 
              name="transferDate" 
              className="form-input" 
              value={formData.transferDate}
              onChange={handleChange}
              required
            />
          </div>
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
