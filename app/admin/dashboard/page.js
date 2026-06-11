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

  useEffect(() => {
    const level = localStorage.getItem('adminAuth');
    if (!level) {
      router.push('/admin/login');
    } else {
      setAuthLevel(level);
      // Fetch real data from Firebase
      const fetchData = async () => {
        try {
          const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          
          const q = query(collection(db, 'teacher_association_forms'), orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              ...d,
              createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : new Date().toISOString()
            };
          });
          setForms(data);
          setIsLoading(false);
        } catch (err) {
          console.error(err);
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [router]);

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
          <h3>高階管理功能：學年度管理</h3>
          <div className="flex gap-1 mt-1">
            <input type="text" className="form-input" placeholder="新增學年度 (例如: 114學年度)" />
            <button className="btn btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={() => alert('尚未實作 API')}>新增並啟用</button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-1 gap-1">
        <div className="flex gap-1 flex-1">
          <input 
            type="text" 
            className="form-input" 
            placeholder="依姓名或單位搜尋..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto', minWidth: '150px' }}>
            <option value="ALL">全部名單</option>
            <option value="UNPAID">未繳費名單</option>
            <option value="HAISHAN">海山校教師會</option>
            <option value="NFEU">全教產</option>
            <option value="NTA">全教總</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={handleExport}>匯出 CSV</button>
      </div>

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
                {authLevel === 'super' && <th>對帳完成</th>}
              </tr>
            </thead>
            <tbody>
              {filteredForms.map(form => (
                <tr key={form.id}>
                  <td>{form.year?.name}</td>
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
                      <input 
                        type="checkbox" 
                        checked={form.isReconciled || false} 
                        onChange={() => handleToggleReconcile(form.id, form.isReconciled)}
                        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', accentColor: 'var(--success)' }}
                        title="標記為已對帳"
                      />
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
