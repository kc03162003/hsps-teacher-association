'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [formData, setFormData] = useState({
    unit: '',
    name: '',
    joinHaishan: false,
    joinNFEU: false,
    joinNTA: false,
    joinNone: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeYear, setActiveYear] = useState('115學年度');

  useEffect(() => {
    import('@/lib/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ doc, getDoc }) => {
        getDoc(doc(db, 'settings', 'general')).then(settingsDoc => {
          if (settingsDoc.exists() && settingsDoc.data().activeYear) {
            setActiveYear(settingsDoc.data().activeYear);
          }
        }).catch(console.error);
      });
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => {
      let newData = { ...prev };
      
      if (type === 'checkbox') {
        if (name === 'joinNone' && checked) {
          newData.joinHaishan = false;
          newData.joinNFEU = false;
          newData.joinNTA = false;
          newData.joinNone = true;
        } else if (name !== 'joinNone' && checked) {
          newData.joinNone = false;
          newData[name] = true;
        } else {
          newData[name] = checked;
        }
      } else {
        newData[name] = value;
      }
      
      // Calculate fee
      let fee = 0;
      if (newData.joinHaishan) fee += 200;
      if (newData.joinNFEU) fee += 1000;
      if (newData.joinNTA) fee += 200;
      setCalculatedFee(fee);
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.unit || !formData.name) return alert('請填寫單位與姓名');
    if (!formData.joinHaishan && !formData.joinNFEU && !formData.joinNTA && !formData.joinNone) {
      return alert('請至少選擇一個選項（加入教師會或不加入）');
    }
    
    setIsSubmitting(true);
    try {
      const { collection, addDoc, serverTimestamp, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      // Duplicate Check
      const q = query(collection(db, 'teacher_association_forms'), 
        where('name', '==', formData.name),
        where('year', '==', activeYear)
      );
      const querySnapshot = await getDocs(q);
      
      const qOld = query(collection(db, 'teacher_association_forms'), 
        where('name', '==', formData.name),
        where('year.name', '==', activeYear)
      );
      const querySnapshotOld = await getDocs(qOld);

      if (!querySnapshot.empty || !querySnapshotOld.empty) {
        alert(`您在「${activeYear}」已經有登記紀錄！\n若有填寫錯誤需要修改，請洽系統管理員。`);
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'teacher_association_forms'), {
        year: activeYear,
        unit: formData.unit,
        name: formData.name,
        joinHaishan: formData.joinHaishan,
        joinNFEU: formData.joinNFEU,
        joinNTA: formData.joinNTA,
        joinNone: formData.joinNone,
        totalFee: calculatedFee,
        paidAmount: null,
        accountLastFive: null,
        createdAt: serverTimestamp()
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('發生錯誤，請稍後再試。');
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="container text-center">
        <h2>登記成功！</h2>
        {calculatedFee > 0 ? (
          <>
            <div className="alert alert-success mt-1 mb-2">
              您應繳交的總費用為：<strong>{calculatedFee} 元</strong>
            </div>
            <div className="alert alert-info">
              <h3>繳費資訊</h3>
              <p className="mt-1">請匯款至以下帳號：</p>
              <p className="font-bold text-2xl">(123) 4567-8901-2345</p>
              <p className="mt-1">戶名：海山校教師會</p>
            </div>
            <p className="mt-2 text-sm" style={{ opacity: 0.8 }}>
              提醒您：繳費完成後，請務必至「回報繳費」頁面填寫您的匯款帳號後五碼，以便對帳。
            </p>
            <Link href="/report" className="btn btn-primary mt-2" style={{ display: 'inline-block' }}>前往回報繳費</Link>
          </>
        ) : (
          <div className="alert alert-success mt-1 mb-2">
            您選擇不加入任何教師會，手續已完成。感謝您的填寫！
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="text-center">{activeYear}教師會入會登記</h1>
      <p className="text-center mb-2" style={{ opacity: 0.8 }}>請填寫以下資料並選擇您要加入的教師會</p>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-1">
          <div className="form-group">
            <label className="form-label">單位</label>
            <input 
              type="text" 
              name="unit" 
              className="form-input" 
              placeholder="例如：教務處、一年級"
              value={formData.unit}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">姓名</label>
            <input 
              type="text" 
              name="name" 
              className="form-input" 
              placeholder="請輸入您的真實姓名"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group mt-1">
          <label className="form-label">選擇加入的教師會（可複選）</label>
          <label className="checkbox-group">
            <input type="checkbox" name="joinHaishan" checked={formData.joinHaishan} onChange={handleChange} />
            <span>海山校教師會 (200元)</span>
          </label>
          <label className="checkbox-group">
            <input type="checkbox" name="joinNFEU" checked={formData.joinNFEU} onChange={handleChange} />
            <span>全教產 (1000元)</span>
          </label>
          <label className="checkbox-group">
            <input type="checkbox" name="joinNTA" checked={formData.joinNTA} onChange={handleChange} />
            <span>全教總 (200元)</span>
          </label>
          <label className="checkbox-group" style={{ marginTop: '0.5rem', borderStyle: 'dashed' }}>
            <input type="checkbox" name="joinNone" checked={formData.joinNone} onChange={handleChange} />
            <span>不加入任何教師會 (0元)</span>
          </label>
        </div>

        <div className="alert alert-info flex justify-between items-center mb-2">
          <span>應繳總費用：</span>
          <span className="text-2xl font-bold">{calculatedFee} 元</span>
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? '處理中...' : '送出登記資料'}
        </button>
      </form>
    </div>
  );
}
