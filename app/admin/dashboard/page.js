'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [authLevel, setAuthLevel] = useState(null);
  const router = useRouter();

  const [forms, setForms] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, UNPAID, HAISHAN, NFEU, NTA
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingForm, setEditingForm] = useState(null);

  const [activeYear, setActiveYear] = useState('115學年度');
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [newYearInput, setNewYearInput] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [isAcceptingSubmissions, setIsAcceptingSubmissions] = useState(true);
  const [deadlineDate, setDeadlineDate] = useState('');

  const getFormYear = (f) => typeof f.year === 'object' ? f.year.name : (f.year || '未指定');

  useEffect(() => {
    import('@/lib/firebase').then(({ auth }) => {
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        onAuthStateChanged(auth, (user) => {
          if (!user) {
            router.push('/admin/login');
          } else {
            // Check email to determine auth level
            const email = user.email || '';
            if (email === 'hsps115@hsps.tw') {
              setAuthLevel('view');
            } else {
              setAuthLevel('super');
            }
            
            // Fetch real data from Firebase
            const fetchData = async () => {
        try {
          const { collection, getDocs, orderBy, query, doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          // Fetch settings for active year
          const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
          let currentYear = '115學年度';
          let currentAccepting = true;
          let currentDeadline = '';
          if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data.activeYear) currentYear = data.activeYear;
            if (data.isAcceptingSubmissions !== undefined) currentAccepting = data.isAcceptingSubmissions;
            if (data.deadlineDate) currentDeadline = data.deadlineDate;
          }
          setActiveYear(currentYear);
          setSelectedYear(currentYear);
          setIsAcceptingSubmissions(currentAccepting);
          setDeadlineDate(currentDeadline);
          
          const q = query(collection(db, 'teacher_association_forms'), orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(d => {
            const docData = d.data();
            return {
              id: d.id,
              ...docData,
              createdAt: docData.createdAt ? docData.createdAt.toDate().toISOString() : new Date().toISOString()
            };
          });
          setForms(data);

          const years = [...new Set(data.map(f => typeof f.year === 'object' ? f.year.name : (f.year || '未指定')))];
          if (!years.includes(currentYear)) years.unshift(currentYear);
          setAvailableYears(years);
          
          setIsLoading(false);
        } catch (err) {
          console.error(err);
          setIsLoading(false);
        }
        };
        fetchData();
          }
        });
      });
    });
  }, [router]);

  const handleAddYear = async () => {
    if (!newYearInput) return;
    if (authLevel !== 'super') return;
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await setDoc(doc(db, 'settings', 'general'), { activeYear: newYearInput }, { merge: true });
      setActiveYear(newYearInput);
      setSelectedYear(newYearInput);
      if (!availableYears.includes(newYearInput)) {
        setAvailableYears(prev => [newYearInput, ...prev]);
      }
      setNewYearInput('');
      alert(`已成功設定「${newYearInput}」為目前啟用學年度！\n前台報名將自動切換至此學年度。`);
    } catch (err) {
      console.error(err);
      alert('設定失敗');
    }
  };

  const handleToggleAccepting = async () => {
    if (authLevel !== 'super') return;
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const newValue = !isAcceptingSubmissions;
      await setDoc(doc(db, 'settings', 'general'), { isAcceptingSubmissions: newValue }, { merge: true });
      setIsAcceptingSubmissions(newValue);
      alert(`已${newValue ? '開啟' : '關閉'}表單填寫功能！`);
    } catch (err) {
      console.error(err);
      alert('設定失敗');
    }
  };

  const handleSetDeadline = async () => {
    if (authLevel !== 'super') return;
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await setDoc(doc(db, 'settings', 'general'), { deadlineDate: deadlineDate }, { merge: true });
      alert(`已成功設定自動截止時間為：${deadlineDate ? deadlineDate.replace('T', ' ') : '無(手動)'}`);
    } catch (err) {
      console.error(err);
      alert('設定時間失敗');
    }
  };

  const handleToggleReconcile = async (formId, currentStatus) => {
    if (authLevel !== 'super') return;
    try {
      const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const form = forms.find(f => f.id === formId);
      const updateData = { isReconciled: !currentStatus };
      
      if (!currentStatus) {
        updateData.reconciledAt = serverTimestamp();
        if (!form.accountLastFive) {
          updateData.accountLastFive = '出納收現';
        }
        if (form.paidAmount === null || form.paidAmount === undefined || form.paidAmount === '') {
          updateData.paidAmount = form.totalFee || 0;
          updateData.paymentReportSource = 'ADMIN';
        }
        if (!form.transferDate) {
          const today = new Date();
          const localDateString = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          updateData.transferDate = localDateString;
        }
      } else {
        updateData.reconciledAt = null;
      }
      
      await updateDoc(doc(db, 'teacher_association_forms', formId), updateData);
      setForms(prev => prev.map(f => {
        if (f.id === formId) {
          return { 
            ...f, 
            ...updateData,
            isReconciled: !currentStatus, 
            reconciledAt: !currentStatus ? new Date().toISOString() : null 
          };
        }
        return f;
      }));
    } catch (error) {
      console.error('Error updating reconciliation status:', error);
      alert('更新對帳狀態失敗，請重試。');
    }
  };

  const handleDelete = async (formId) => {
    if (authLevel !== 'super') return;
    if (!window.confirm('確定要刪除這筆資料嗎？刪除後將無法復原！')) return;
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await deleteDoc(doc(db, 'teacher_association_forms', formId));
      setForms(prev => prev.filter(f => f.id !== formId));
    } catch (error) {
      console.error(error);
      alert('刪除失敗');
    }
  };

  const handleEditClick = (form) => {
    if (authLevel !== 'super') return;
    setEditingForm({ ...form });
  };

  const handleSaveEdit = async () => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const originalForm = forms.find(f => f.id === editingForm.id);
      const isPaymentChanged = editingForm.paidAmount !== originalForm.paidAmount || editingForm.accountLastFive !== originalForm.accountLastFive || editingForm.transferDate !== originalForm.transferDate;
      
      let parsedPaid = parseInt(editingForm.paidAmount);
      if (isNaN(parsedPaid)) parsedPaid = null;

      const payload = {
        unit: editingForm.unit || '',
        name: editingForm.name || '',
        joinHaishan: !!editingForm.joinHaishan,
        joinNTA: !!editingForm.joinNTA,
        joinNone: !!editingForm.joinNone,
        totalFee: parseInt(editingForm.totalFee) || 0,
        paidAmount: parsedPaid,
        transferDate: editingForm.transferDate || '',
        accountLastFive: editingForm.accountLastFive || '',
        paymentReportSource: parsedPaid !== null ? (isPaymentChanged ? 'ADMIN' : (editingForm.paymentReportSource || null)) : null
      };

      // 確保沒有 undefined 或 NaN 混入 (Firestore 會報錯)
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || Number.isNaN(payload[key])) {
          payload[key] = null;
        }
      });

      await updateDoc(doc(db, 'teacher_association_forms', editingForm.id), payload);
      setForms(prev => prev.map(f => f.id === editingForm.id ? { ...f, ...payload } : f));
      setEditingForm(null);
    } catch (error) {
      console.error(error);
      alert('儲存失敗：' + error.message);
    }
  };

  const handlePrintBallots = () => {
    const ballotMembers = forms.filter(f => getFormYear(f) === activeYear && f.joinHaishan);
    
    const groups = {
      '行政': [],
      '一年級': [],
      '二年級': [],
      '三年級': [],
      '四年級': [],
      '五年級': [],
      '六年級': [],
      '科任': [],
      '幼兒園': [],
      '職務未定': []
    };

    ballotMembers.forEach(f => {
      const s = f.unit ? f.unit.toString() : '';
      if (/幼兒|附幼|幼稚園|幼教|教保/.test(s)) {
        groups['幼兒園'].push(f);
      } else if (/教務|學務|輔導|總務|人事|會計|校長|行政/.test(s)) {
        groups['行政'].push(f);
      } else if (/未定|職務未定/.test(s) || s.trim() === '') {
        groups['職務未定'].push(f);
      } else if (/([1-6])\d{2}/.test(s)) {
        const matchNum = s.match(/([1-6])\d{2}/);
        const grades = ['一', '二', '三', '四', '五', '六'];
        groups[grades[parseInt(matchNum[1]) - 1] + '年級'].push(f);
      } else if (/六年|6年|^6/.test(s) || s.includes('六')) { groups['六年級'].push(f); }
      else if (/五年|5年|^5/.test(s) || s.includes('五')) { groups['五年級'].push(f); }
      else if (/四年|4年|^4/.test(s) || s.includes('四')) { groups['四年級'].push(f); }
      else if (/三年|3年|^3/.test(s) || s.includes('三')) { groups['三年級'].push(f); }
      else if (/二年|2年|^2/.test(s) || s.includes('二')) { groups['二年級'].push(f); }
      else if (/一年|1年|^1/.test(s) || s.includes('一')) { groups['一年級'].push(f); }
      else {
        groups['科任'].push(f);
      }
    });

    const order = ['行政', '一年級', '二年級', '三年級', '四年級', '五年級', '六年級', '科任', '幼兒園'];
    const groupsHtml = order.map(cat => {
      if (groups[cat].length === 0) return '';
      groups[cat].sort((a, b) => a.unit.localeCompare(b.unit) || a.name.localeCompare(b.name));
      
      const membersHtml = groups[cat].map(f => 
        '<div class="member-item">' +
          '<div class="member-info">' +
            '<span style="font-weight: bold;">' + f.name + '</span>' +
            '<span class="unit-label">' + f.unit + '</span>' +
          '</div>' +
          '<div class="checkbox-group">' +
            '理<div class="checkbox"></div>' +
            '監<div class="checkbox"></div>' +
          '</div>' +
        '</div>'
      ).join('');

      return '<div class="category-box">' +
               '<div class="category-title">' + cat + ' (' + groups[cat].length + '人)</div>' +
               membersHtml +
             '</div>';
    }).join('');

    let bottomRowHtml = '';
    if (groups['職務未定'] && groups['職務未定'].length > 0) {
      groups['職務未定'].sort((a, b) => (a.unit || '').localeCompare(b.unit || '') || a.name.localeCompare(b.name));
      
      const membersHtml = groups['職務未定'].map(f => 
        '<div class="member-item horizontal-item">' +
          '<div class="member-info">' +
            '<span style="font-weight: bold;">' + f.name + '</span>' +
            '<span class="unit-label">' + (f.unit || '未定') + '</span>' +
          '</div>' +
        '</div>'
      ).join('');

      bottomRowHtml = '<div class="category-box bottom-row">' +
                        '<div class="category-title" style="text-align: left; padding-left: 5px;">職務未定 (' + groups['職務未定'].length + '人)</div>' +
                        '<div class="horizontal-members">' + membersHtml + '</div>' +
                      '</div>';
    }

    const htmlContent = '<!DOCTYPE html><html><head><title>' + activeYear + ' 理監事選票</title>' +
      '<style>' +
        'body { font-family: "Microsoft JhengHei", "Inter", sans-serif; padding: 10px; color: #000; font-size: 11px; } ' +
        'h1 { text-align: center; margin-bottom: 5px; font-size: 20px; line-height: 1.2; letter-spacing: 2px; } ' +
        '.subtitle { text-align: center; margin-bottom: 12px; font-size: 14px; font-weight: bold; } ' +
        '.grid-container { column-count: 7; column-gap: 8px; width: 100%; } ' +
        '.category-box { border: 1.5px solid #000; padding: 4px; border-radius: 4px; break-inside: avoid; page-break-inside: avoid; margin-bottom: 8px; } ' +
        '.category-title { font-weight: bold; font-size: 12px; border-bottom: 1.5px solid #000; margin-bottom: 4px; padding-bottom: 2px; text-align: center; } ' +
        '.member-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; border-bottom: 1px dashed #999; padding-bottom: 2px; } ' +
        '.member-info { display: flex; align-items: center; gap: 4px; flex: 1; overflow: hidden; white-space: nowrap; } ' +
        '.checkbox-group { display: flex; align-items: center; gap: 2px; font-size: 10px; font-weight: bold; } ' +
        '.checkbox { width: 12px; height: 12px; border: 1px solid #000; display: inline-block; margin-right: 2px; } ' +
        '.unit-label { font-size: 9px; color: #555; } ' +
        '.horizontal-members { display: flex; flex-wrap: wrap; gap: 10px; padding: 2px 4px; } ' +
        '.horizontal-item { border-bottom: none; margin-bottom: 0; border-right: 1px dashed #999; padding-right: 10px; width: auto; flex: 0 0 auto; } ' +
        '.horizontal-item:last-child { border-right: none; } ' +
        '.bottom-row { margin-top: 5px; page-break-inside: avoid; } ' +
        '@media print { ' +
          '@page { size: A4 landscape; margin: 8mm; } ' +
          'body { margin: 0; padding: 0; } ' +
        '} ' +
      '</style></head><body>' +
      '<h1>' + activeYear + ' 海山國小校教師會理監事選票</h1>' +
      '<div class="subtitle">請在欲票選的候選人右側方格內打勾 (應選理事 11 人、監事 3 人)</div>' +
      '<div class="grid-container">' +
      groupsHtml +
      '</div>' +
      bottomRowHtml +
      '</body></html>';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleExport = () => {
    const headers = ['ID', '學年度', '單位', '姓名', '海山校教師會', '全教總', '不加入', '應繳金額', '已繳金額', '匯款日期', '帳號後五碼', '登記時間'];
    const csvContent = [
      headers.join(','),
      ...filteredForms.map(f => [
        f.id, f.year?.name || f.year || '', f.unit, f.name, 
        f.joinHaishan ? '是' : '否', 
        f.joinNTA ? '是' : '否', 
        (!f.joinHaishan && !f.joinNTA) ? '是' : '否',
        f.totalFee, f.paidAmount || 0, f.transferDate || '', f.accountLastFive || '',
        new Date(f.createdAt).toLocaleString()
      ].join(','))
    ].join('\\n');

    const blob = new Blob(["\\uFEFF"+csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "teacher_association_forms.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!authLevel) return null;

  const filteredForms = forms.filter(f => {
    const formYear = getFormYear(f);
    if (selectedYear !== 'ALL' && formYear !== selectedYear) return false;
    if (filterDate && f.transferDate !== filterDate) return false;

    // Apply type filter
    if (filter === 'UNPAID' && f.totalFee > 0 && (f.paidAmount === null || f.paidAmount < f.totalFee)) return true;
    if (filter === 'HAISHAN' && f.joinHaishan) return true;
    if (filter === 'NTA' && f.joinNTA) return true;
    if (filter !== 'ALL' && filter !== 'UNPAID' && filter !== 'HAISHAN' && filter !== 'NTA') return false;
    
    // Apply search query
    if (searchQuery) {
      return f.name.includes(searchQuery) || f.unit.includes(searchQuery);
    }
    return filter === 'ALL' || (filter === 'UNPAID' && f.totalFee > 0 && (f.paidAmount === null || f.paidAmount < f.totalFee));
  });

  const totalCount = filteredForms.length;
  const paidCount = filteredForms.filter(f => f.paidAmount !== null && f.paidAmount > 0).length;
  const totalExpectedFee = filteredForms.reduce((sum, f) => sum + (f.totalFee || 0), 0);
  const totalPaidFee = filteredForms.reduce((sum, f) => sum + (f.paidAmount || 0), 0);

  const totalUnpaidFee = totalExpectedFee - totalPaidFee;
  const paidRatio = totalExpectedFee === 0 ? 0 : Math.min(100, Math.round((totalPaidFee / totalExpectedFee) * 100));

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div className="flex justify-between items-center mb-2">
        <h1>管理員後台 {authLevel === 'super' ? '(高階權限)' : '(一般權限)'}</h1>
        <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={async () => {
          try {
            const { signOut } = await import('firebase/auth');
            const { auth } = await import('@/lib/firebase');
            await signOut(auth);
            router.push('/admin/login');
          } catch (e) {
            console.error('Logout failed', e);
          }
        }}>登出</button>
      </div>

      {authLevel === 'super' && (
        <div className="alert alert-info mb-2">
          <h3>高階管理功能：目前啟用學年度 [{activeYear}]</h3>
          <div className="flex gap-1 mt-1 items-center justify-between">
            <div className="flex gap-1">
              <input type="text" className="form-input" placeholder="新增學年度 (例如: 115學年度)" value={newYearInput} onChange={e => setNewYearInput(e.target.value)} />
              <button className="btn btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={handleAddYear}>設定並啟用</button>
            </div>
            <div className="flex gap-1 items-center">
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>自動截止時間:</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                value={deadlineDate} 
                onChange={e => setDeadlineDate(e.target.value)} 
                style={{ width: 'auto' }}
              />
              <button className="btn btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={handleSetDeadline}>儲存時間</button>
              
              <button 
                className={`btn ${isAcceptingSubmissions ? 'btn-secondary' : 'btn-primary'}`} 
                style={{ width: 'auto', whiteSpace: 'nowrap', backgroundColor: isAcceptingSubmissions ? 'var(--error)' : 'var(--success)', borderColor: 'transparent', color: 'white', marginLeft: '0.5rem' }}
                onClick={handleToggleAccepting}
              >
                {isAcceptingSubmissions ? '強制停止填寫' : '強制開放填寫'}
              </button>
            </div>
          </div>
          <p className="text-sm mt-1" style={{ opacity: 0.8 }}>提示：設定「自動截止時間」後，時間一到前台將自動關閉。右側按鈕為強制手動開關。</p>
        </div>
      )}

      {/* Stats Dashboard with Pie Chart */}
      <div className="grid grid-cols-2 gap-2 mb-2" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        {/* People Stats */}
        <div className="flex gap-1">
          <div className="alert flex-1 flex flex-col justify-center items-center" style={{ background: '#f8fafc', padding: '1rem 0.5rem', margin: 0 }}>
            <div className="text-sm" style={{ opacity: 0.7 }}>總登記人數</div>
            <div className="text-3xl font-bold">{totalCount} <span className="text-sm font-normal">人</span></div>
          </div>
          <div className="alert flex-1 flex flex-col justify-center items-center" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', margin: 0 }}>
            <div className="text-sm" style={{ opacity: 0.7 }}>已繳費人數</div>
            <div className="text-3xl font-bold" style={{ color: '#166534' }}>{paidCount} <span className="text-sm font-normal">人</span></div>
          </div>
        </div>

        {/* Financial Pie Chart Stats */}
        <div className="alert flex items-center justify-between" style={{ background: '#fffbeb', borderColor: '#fde68a', margin: 0, padding: '1rem 1.5rem' }}>
          <div className="flex items-center gap-2">
            {/* Pie Chart */}
            <div style={{ position: 'relative', width: '90px', height: '90px' }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: `conic-gradient(#3b82f6 ${paidRatio}%, #fca5a5 ${paidRatio}% 100%)`,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}></div>
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: '#fffbeb', borderRadius: '50%', width: '60px', height: '60px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '1rem', color: '#b45309'
              }}>{paidRatio}%</div>
            </div>
            {/* Total Expected Label */}
            <div className="flex flex-col justify-center" style={{ lineHeight: '1.4' }}>
              <div className="text-sm" style={{ opacity: 0.8 }}>應收總金額</div>
              <div className="text-2xl font-bold" style={{ color: '#b45309' }}>$ {totalExpectedFee}</div>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <div>
              <div className="text-xs" style={{ opacity: 0.7 }}>已收金額 <span style={{display:'inline-block', width:'10px', height:'10px', background:'#3b82f6', borderRadius:'2px', marginLeft:'4px'}}></span></div>
              <div className="text-lg font-bold" style={{ color: '#1d4ed8' }}>$ {totalPaidFee}</div>
            </div>
            <div>
              <div className="text-xs" style={{ opacity: 0.7 }}>未收金額 <span style={{display:'inline-block', width:'10px', height:'10px', background:'#fca5a5', borderRadius:'2px', marginLeft:'4px'}}></span></div>
              <div className="text-lg font-bold" style={{ color: '#ef4444' }}>$ {totalUnpaidFee}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-1 gap-1">
        <div className="flex gap-1 flex-1">
          <input 
            type="text" 
            className="form-input" 
            placeholder="依姓名或單位搜尋..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <input 
            type="date" 
            className="form-input" 
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            style={{ width: 'auto' }}
            title="依匯款日期篩選"
          />
          <select className="form-input" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ width: 'auto', minWidth: '130px' }}>
            <option value="ALL">全部學年度</option>
            {availableYears.map(y => <option key={y} value={y}>{y}{y === activeYear ? ' (啟用)' : ''}</option>)}
          </select>
          <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto', minWidth: '130px' }}>
            <option value="ALL">全部名單</option>
            <option value="UNPAID">未繳費名單</option>
            <option value="HAISHAN">海山校教師會</option>
            <option value="NTA">全教總</option>
          </select>
        </div>
        {authLevel === 'super' && (
          <div className="flex gap-1">
            <button className="btn btn-secondary" style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={handlePrintBallots}>列印選票</button>
            <button className="btn btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={handleExport}>匯出 CSV</button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="container" style={{ margin: 0, width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>修改資料</h3>
            <div className="form-group mt-1">
              <label className="form-label">單位</label>
              <input className="form-input" value={editingForm.unit} onChange={e => setEditingForm({...editingForm, unit: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">姓名</label>
              <input className="form-input" value={editingForm.name} onChange={e => setEditingForm({...editingForm, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">參與組織</label>
              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={editingForm.joinHaishan} onChange={e => setEditingForm({...editingForm, joinHaishan: e.target.checked})} style={{ width: '1rem', height: '1rem' }} /> 海山</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={editingForm.joinNTA} onChange={e => setEditingForm({...editingForm, joinNTA: e.target.checked})} style={{ width: '1rem', height: '1rem' }} /> 全教總</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={editingForm.joinNone} onChange={e => setEditingForm({...editingForm, joinNone: e.target.checked})} style={{ width: '1rem', height: '1rem' }} /> 不加入</label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="form-group">
                <label className="form-label">應繳金額</label>
                <input type="number" className="form-input" value={editingForm.totalFee} onChange={e => setEditingForm({...editingForm, totalFee: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">已繳金額</label>
                <input type="number" className="form-input" value={editingForm.paidAmount === null ? '' : editingForm.paidAmount} onChange={e => setEditingForm({...editingForm, paidAmount: e.target.value})} placeholder="尚未繳費" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <div className="form-group">
                <label className="form-label">匯款日期</label>
                <input type="date" className="form-input" value={editingForm.transferDate || ''} onChange={e => setEditingForm({...editingForm, transferDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">帳號後五碼</label>
                <input className="form-input" value={editingForm.accountLastFive || ''} onChange={e => setEditingForm({...editingForm, accountLastFive: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              <button className="btn btn-primary" onClick={handleSaveEdit}>儲存修改</button>
              <button className="btn btn-secondary" onClick={() => setEditingForm(null)}>取消</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        {isLoading ? (
          <p className="text-center mt-2">載入中...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>學年度</th>
                <th>單位</th>
                <th>姓名</th>
                <th>參與組織</th>
                <th>應繳</th>
                <th>已繳</th>
                <th>匯款日期</th>
                <th>後五碼</th>
                {authLevel === 'super' && <th>操作 (對帳/修改/刪除)</th>}
              </tr>
            </thead>
            <tbody>
              {filteredForms.map(form => (
                <tr key={form.id}>
                  <td>{getFormYear(form)}</td>
                  <td>{form.unit}</td>
                  <td>{form.name}</td>
                  <td>
                    <div className="flex gap-1 text-sm">
                      {form.joinHaishan && <span className="alert-info" style={{padding: '2px 6px', borderRadius: '4px'}}>海山</span>}
                      {form.joinNTA && <span className="alert-error" style={{padding: '2px 6px', borderRadius: '4px'}}>全教總</span>}
                      {(!form.joinHaishan && !form.joinNTA) && <span style={{padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)'}}>無</span>}
                    </div>
                  </td>
                  <td>{form.totalFee}</td>
                  <td>
                    {form.paidAmount ? (
                      <div className="flex flex-col items-start gap-1">
                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{form.paidAmount}</span>
                        {form.paymentReportSource === 'USER' && <span style={{fontSize:'10px', color:'#059669', background:'#ecfdf5', padding:'2px 4px', borderRadius:'4px'}}>🙋‍♀️自行回報</span>}
                        {form.paymentReportSource === 'ADMIN' && <span style={{fontSize:'10px', color:'#2563eb', background:'#eff6ff', padding:'2px 4px', borderRadius:'4px'}}>👨‍💻管理員</span>}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--error)' }}>{form.totalFee === 0 ? '-' : '尚未繳費'}</span>
                    )}
                  </td>
                  <td>{form.transferDate || '-'}</td>
                  <td>{form.accountLastFive || '-'}</td>
                  {authLevel === 'super' && (
                    <td style={{ textAlign: 'center' }}>
                      <div className="flex gap-1 items-center justify-center">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', marginRight: '4px' }}>
                          <input 
                            type="checkbox" 
                            checked={form.isReconciled || false} 
                            onChange={() => handleToggleReconcile(form.id, form.isReconciled)}
                            style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--success)' }}
                            title="標記為已對帳"
                          />
                          <span style={{ fontSize: '0.85rem' }}>對帳</span>
                        </label>
                        <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', width: 'auto' }} onClick={() => handleEditClick(form)}>修改</button>
                        <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem', width: 'auto', backgroundColor: 'var(--error)', color: 'white', borderColor: 'var(--error)' }} onClick={() => handleDelete(form.id)}>刪除</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && filteredForms.length === 0 && <p className="text-center mt-2 text-sm" style={{opacity: 0.5}}>無符合條件的資料</p>}
      </div>
    </div>
  );
}
