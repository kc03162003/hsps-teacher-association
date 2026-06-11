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

  const getFormYear = (f) => typeof f.year === 'object' ? f.year.name : (f.year || '未指定');

  useEffect(() => {
    const level = localStorage.getItem('adminAuth');
    if (!level) {
      router.push('/admin/login');
    } else {
      setAuthLevel(level);
      // Fetch real data from Firebase
      const fetchData = async () => {
        try {
          const { collection, getDocs, orderBy, query, doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          // Fetch settings for active year
          const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
          let currentYear = '115學年度';
          if (settingsDoc.exists() && settingsDoc.data().activeYear) {
            currentYear = settingsDoc.data().activeYear;
          }
          setActiveYear(currentYear);
          setSelectedYear(currentYear);
          
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

  const handleToggleReconcile = async (formId, currentStatus) => {
    if (authLevel !== 'super') return;
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await updateDoc(doc(db, 'teacher_association_forms', formId), {
        isReconciled: !currentStatus
      });
      setForms(prev => prev.map(f => f.id === formId ? { ...f, isReconciled: !currentStatus } : f));
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
      
      const payload = {
        unit: editingForm.unit,
        name: editingForm.name,
        joinHaishan: editingForm.joinHaishan,
        joinNFEU: editingForm.joinNFEU,
        joinNTA: editingForm.joinNTA,
        joinNone: editingForm.joinNone,
        totalFee: parseInt(editingForm.totalFee) || 0,
        paidAmount: editingForm.paidAmount === '' || editingForm.paidAmount === null ? null : parseInt(editingForm.paidAmount),
        accountLastFive: editingForm.accountLastFive || ''
      };

      await updateDoc(doc(db, 'teacher_association_forms', editingForm.id), payload);
      setForms(prev => prev.map(f => f.id === editingForm.id ? { ...f, ...payload } : f));
      setEditingForm(null);
    } catch (error) {
      console.error(error);
      alert('儲存失敗');
    }
  };

  const handleExport = () => {
    const headers = ['ID', '學年度', '單位', '姓名', '海山校教師會', '全教產', '全教總', '不加入', '應繳金額', '已繳金額', '帳號後五碼', '登記時間'];
    const csvContent = [
      headers.join(','),
      ...filteredForms.map(f => [
        f.id, f.year?.name || '', f.unit, f.name, 
        f.joinHaishan ? '是' : '否', 
        f.joinNFEU ? '是' : '否', 
        f.joinNTA ? '是' : '否', 
        (!f.joinHaishan && !f.joinNFEU && !f.joinNTA) ? '是' : '否',
        f.totalFee, f.paidAmount || 0, f.accountLastFive || '',
        new Date(f.createdAt).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF"+csvContent], { type: 'text/csv;charset=utf-8;' });
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

    // Apply type filter
    if (filter === 'UNPAID' && (f.paidAmount === null || f.paidAmount < f.totalFee)) return true;
    if (filter === 'HAISHAN' && f.joinHaishan) return true;
    if (filter === 'NFEU' && f.joinNFEU) return true;
    if (filter === 'NTA' && f.joinNTA) return true;
    if (filter !== 'ALL' && filter !== 'UNPAID' && filter !== 'HAISHAN' && filter !== 'NFEU' && filter !== 'NTA') return false;
    
    // Apply search query
    if (searchQuery) {
      return f.name.includes(searchQuery) || f.unit.includes(searchQuery);
    }
    return filter === 'ALL' || (filter === 'UNPAID' && (f.paidAmount === null || f.paidAmount < f.totalFee));
  });

  const totalCount = filteredForms.length;
  const paidCount = filteredForms.filter(f => f.paidAmount !== null && f.paidAmount > 0).length;
  const totalExpectedFee = filteredForms.reduce((sum, f) => sum + (f.totalFee || 0), 0);
  const totalPaidFee = filteredForms.reduce((sum, f) => sum + (f.paidAmount || 0), 0);

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div className="flex justify-between items-center mb-2">
        <h1>管理員後台 {authLevel === 'super' ? '(高階權限)' : '(一般權限)'}</h1>
        <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => {
          localStorage.removeItem('adminAuth');
          router.push('/admin/login');
        }}>登出</button>
      </div>

      {authLevel === 'super' && (
        <div className="alert alert-info mb-2">
          <h3>高階管理功能：目前啟用學年度 [{activeYear}]</h3>
          <div className="flex gap-1 mt-1">
            <input type="text" className="form-input" placeholder="新增學年度 (例如: 115學年度)" value={newYearInput} onChange={e => setNewYearInput(e.target.value)} />
            <button className="btn btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={handleAddYear}>設定並啟用</button>
          </div>
          <p className="text-sm mt-1" style={{ opacity: 0.8 }}>設定後，前台表單將自動儲存為此學年度。</p>
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-4 gap-1 mb-2" style={{ textAlign: 'center' }}>
        <div className="alert" style={{ background: '#f8fafc', padding: '1rem 0.5rem' }}>
          <div className="text-sm" style={{ opacity: 0.7 }}>總登記人數</div>
          <div className="text-2xl font-bold">{totalCount} 人</div>
        </div>
        <div className="alert" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', padding: '1rem 0.5rem' }}>
          <div className="text-sm" style={{ opacity: 0.7 }}>已繳費人數</div>
          <div className="text-2xl font-bold" style={{ color: '#166534' }}>{paidCount} 人</div>
        </div>
        <div className="alert" style={{ background: '#fffbeb', borderColor: '#fde68a', padding: '1rem 0.5rem' }}>
          <div className="text-sm" style={{ opacity: 0.7 }}>總應收金額</div>
          <div className="text-2xl font-bold" style={{ color: '#b45309' }}>$ {totalExpectedFee}</div>
        </div>
        <div className="alert" style={{ background: '#eff6ff', borderColor: '#bfdbfe', padding: '1rem 0.5rem' }}>
          <div className="text-sm" style={{ opacity: 0.7 }}>總已收金額</div>
          <div className="text-2xl font-bold" style={{ color: '#1d4ed8' }}>$ {totalPaidFee}</div>
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
          <select className="form-input" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ width: 'auto', minWidth: '130px' }}>
            <option value="ALL">全部學年度</option>
            {availableYears.map(y => <option key={y} value={y}>{y}{y === activeYear ? ' (啟用)' : ''}</option>)}
          </select>
          <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto', minWidth: '130px' }}>
            <option value="ALL">全部名單</option>
            <option value="UNPAID">未繳費名單</option>
            <option value="HAISHAN">海山校教師會</option>
            <option value="NFEU">全教產</option>
            <option value="NTA">全教總</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={handleExport}>匯出 CSV</button>
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={editingForm.joinNFEU} onChange={e => setEditingForm({...editingForm, joinNFEU: e.target.checked})} style={{ width: '1rem', height: '1rem' }} /> 全教產</label>
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
            <div className="form-group">
              <label className="form-label">帳號後五碼</label>
              <input className="form-input" value={editingForm.accountLastFive || ''} onChange={e => setEditingForm({...editingForm, accountLastFive: e.target.value})} />
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
                      {form.joinNFEU && <span className="alert-success" style={{padding: '2px 6px', borderRadius: '4px'}}>全教產</span>}
                      {form.joinNTA && <span className="alert-error" style={{padding: '2px 6px', borderRadius: '4px'}}>全教總</span>}
                      {(!form.joinHaishan && !form.joinNFEU && !form.joinNTA) && <span style={{padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)'}}>無</span>}
                    </div>
                  </td>
                  <td>{form.totalFee}</td>
                  <td>
                    {form.paidAmount ? (
                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{form.paidAmount}</span>
                    ) : (
                      <span style={{ color: 'var(--error)' }}>{form.totalFee === 0 ? '-' : '尚未繳費'}</span>
                    )}
                  </td>
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
