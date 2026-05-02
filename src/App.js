import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Upload, 
  Trash2, 
  RefreshCw, 
  MapPin, 
  Search,
  CheckCircle2,
  AlertCircle,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  Radio,
  Box,
  FileSpreadsheet,
  Lock,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';

/**
 * Cấu hình Supabase
 */
const SUPABASE_URL = "https://etdnpahmxdeurxlcuwcu.supabase.co";
const SUPABASE_KEY = "sb_publishable_vVs25rvLSgZXVkxw9WeT5w_xtaagYYG";

const App = () => {
  // Quản lý Tab: 'address', 'custgroup', 'channel', 'model'
  const [activeTab, setActiveTab] = useState('address');
  
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supabase, setSupabase] = useState(null);
  const [xlsx, setXlsx] = useState(null);
  
  // Quản lý Đăng nhập
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState('1');
  const itemsPerPage = 30;

  // Form Data cho các bảng
  const [addressForm, setAddressForm] = useState({
    address_short: '', code_phuong: '', code_city: '', code_region: '', name_city: ''
  });
  const [custGroupForm, setCustGroupForm] = useState({
    group_name: '', group_code: '', chanel_code: '', group_cha: '', limit_code: ''
  });
  const [channelForm, setChannelForm] = useState({
    chcode: '', chname: ''
  });
  const [modelForm, setModelForm] = useState({
    mdcode: '', mdname: '', chanel_code: ''
  });

  const fileInputRef = useRef(null);

  // 1. Kiểm tra Auth ngay lập tức khi khởi tạo
  useEffect(() => {
    const checkAuth = () => {
      const savedAuth = localStorage.getItem('app_auth');
      const authTimestamp = localStorage.getItem('app_auth_time');
      
      if (savedAuth === 'true' && authTimestamp) {
        const now = new Date().getTime();
        const hourInMs = 60 * 60 * 1000;
        if (now - parseInt(authTimestamp) < hourInMs) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('app_auth');
          localStorage.removeItem('app_auth_time');
        }
      }
    };
    checkAuth();
  }, []);

  // 2. Load thư viện từ CDN
  useEffect(() => {
    const loadScripts = async () => {
      try {
        if (!window.supabase) {
          const supabaseScript = document.createElement('script');
          supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
          document.head.appendChild(supabaseScript);
          await new Promise((resolve) => (supabaseScript.onload = resolve));
        }
        
        if (!window.XLSX) {
          const xlsxScript = document.createElement('script');
          xlsxScript.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
          document.head.appendChild(xlsxScript);
          await new Promise((resolve) => (xlsxScript.onload = resolve));
        }

        const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        setSupabase(sbClient);
        setXlsx(window.XLSX);
        setLoading(false);
      } catch (err) {
        showStatus('error', 'Lỗi khi tải thư viện từ CDN');
      }
    };
    loadScripts();
  }, []);

  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    if (supabase) {
      const delayDebounceFn = setTimeout(() => {
        fetchData();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [supabase, activeTab, currentPage, searchTerm]);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      if (activeTab === 'channel') {
        const { data, error } = await supabase
          .from('ConfigChannel')
          .select('*')
          .order('id', { ascending: false });

        if (error) throw error;
        setData(data || []);
        setTotalCount(data?.length || 0);
      } else {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        
        const tableMap = {
          address: 'ConfigAddress',
          custgroup: 'ConfigCustGroup',
          model: 'ConfigModel'
        };
        const tableName = tableMap[activeTab];

        let query = supabase.from(tableName).select('*', { count: 'exact' });

        if (searchTerm) {
          // FIX: Escape dấu phẩy bằng cách bọc chuỗi tìm kiếm trong dấu ngoặc kép để tránh lỗi logic tree
          const escapedSearch = `"%${searchTerm}%"`;
          
          if (activeTab === 'address') {
            query = query.or(`address_short.ilike.${escapedSearch},name_city.ilike.${escapedSearch},code_phuong.ilike.${escapedSearch}`);
          } else if (activeTab === 'custgroup') {
            query = query.or(`group_name.ilike.${escapedSearch},group_code.ilike.${escapedSearch},chanel_code.ilike.${escapedSearch}`);
          } else if (activeTab === 'model') {
            query = query.or(`mdcode.ilike.${escapedSearch},mdname.ilike.${escapedSearch},chanel_code.ilike.${escapedSearch}`);
          }
        }

        const { data, error, count } = await query
          .order('id', { ascending: false })
          .range(from, to);

        if (error) throw error;
        setData(data || []);
        setTotalCount(count || 0);
      }
    } catch (error) {
      showStatus('error', 'Lỗi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'itmasterht' && loginForm.password === '2026master@') {
      setIsAuthenticated(true);
      setIsLoginModalOpen(false);
      setLoginError('');
      localStorage.setItem('app_auth', 'true');
      localStorage.setItem('app_auth_time', new Date().getTime().toString());
      showStatus('success', 'Đăng nhập thành công!');
    } else {
      setLoginError('Thông tin tài khoản hoặc mật khẩu không chính xác.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('app_auth');
    localStorage.removeItem('app_auth_time');
    showStatus('success', 'Đã đăng xuất.');
  };

  const openActionModal = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const triggerImport = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 5000);
  };

  const cleanValue = (val) => (val === null || val === undefined ? '' : String(val).trim());

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageInputSubmit = (e) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(pageInputValue);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        setCurrentPage(pageNum);
      } else {
        setPageInputValue(currentPage.toString());
      }
    }
  };

  const handleInsert = async (e) => {
    e.preventDefault();
    if (!supabase || !isAuthenticated) return;
    setLoading(true);
    try {
      let tableName = '';
      let payload = {};

      if (activeTab === 'address') {
        tableName = 'ConfigAddress';
        payload = Object.fromEntries(Object.entries(addressForm).map(([k, v]) => [k, cleanValue(v)]));
      } else if (activeTab === 'custgroup') {
        tableName = 'ConfigCustGroup';
        payload = Object.fromEntries(Object.entries(custGroupForm).map(([k, v]) => [k, cleanValue(v)]));
      } else if (activeTab === 'channel') {
        tableName = 'ConfigChannel';
        payload = Object.fromEntries(Object.entries(channelForm).map(([k, v]) => [k, cleanValue(v)]));
      } else if (activeTab === 'model') {
        tableName = 'ConfigModel';
        payload = Object.fromEntries(Object.entries(modelForm).map(([k, v]) => [k, cleanValue(v)]));
      }

      const { error } = await supabase.from(tableName).insert([payload]);
      if (error) throw error;
      
      showStatus('success', 'Thêm bản ghi thành công!');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      showStatus('error', 'Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcel = (e) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    const importAllowed = ['address', 'custgroup'].includes(activeTab);
    if (!xlsx || !supabase || !importAllowed) return;
    
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setLoading(true);
      try {
        const bstr = evt.target.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const dataJson = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        if (dataJson.length === 0) throw new Error('File rỗng hoặc không đúng định dạng');
        
        const tableName = activeTab === 'address' ? 'ConfigAddress' : 'ConfigCustGroup';
        const formattedData = dataJson.map(row => {
          if (activeTab === 'address') {
            return {
              address_short: cleanValue(row.address_short || row['Address_Short'] || row['address short'] || ''),
              code_phuong: cleanValue(row.code_phuong || row['Code_Phuong'] || row['mã phường'] || ''),
              code_city: cleanValue(row.code_city || row['Code_City'] || row['mã tỉnh'] || ''),
              code_region: cleanValue(row.code_region || row['Code_Region'] || row['mã vùng'] || ''),
              name_city: cleanValue(row.name_city || row['Name_City'] || row['tên tỉnh'] || '')
            };
          } else {
            return {
              group_name: cleanValue(row.group_name || row['Group_Name'] || row['tên nhóm'] || ''),
              group_code: cleanValue(row.group_code || row['Group_Code'] || row['mã nhóm'] || ''),
              chanel_code: cleanValue(row.chanel_code || row['Chanel_Code'] || row['mã kênh'] || ''),
              group_cha: cleanValue(row.group_cha || row['Group_Cha'] || row['nhóm cha'] || ''),
              limit_code: cleanValue(row.limit_code || row['Limit_Code'] || row['mã giới hạn'] || '')
            };
          }
        });

        const { error } = await supabase.from(tableName).insert(formattedData);
        if (error) throw error;
        showStatus('success', `Import thành công ${dataJson.length} bản ghi!`);
        fetchData();
      } catch (error) {
        showStatus('error', 'Lỗi: ' + error.message);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = async (id) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!supabase || !window.confirm('Xác nhận xóa bản ghi này?')) return;
    setLoading(true);
    try {
      const tableMap = { address: 'ConfigAddress', custgroup: 'ConfigCustGroup', channel: 'ConfigChannel', model: 'ConfigModel' };
      const tableName = tableMap[activeTab];
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      showStatus('success', 'Xóa thành công');
      fetchData();
    } catch (error) {
      showStatus('error', 'Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = activeTab === 'channel' 
    ? data.filter(item => 
        item.chcode?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.chname?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;

  const getExcelTemplateInfo = () => {
    if (activeTab === 'address') return { title: "Template Address", columns: ["Address_Short", "Code_Phuong", "Code_City", "Code_Region", "Name_City"] };
    if (activeTab === 'custgroup') return { title: "Template CustGroup", columns: ["Group_Name", "Group_Code", "Chanel_Code", "Group_Cha", "Limit_Code"] };
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-1 font-sans text-slate-900 text-[14px] flex flex-col overflow-hidden">
      <div className="max-w-full mx-auto w-full flex-1 flex flex-col overflow-hidden">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-1 gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1 rounded text-white">
               {activeTab === 'address' ? <MapPin size={16} /> : 
                activeTab === 'custgroup' ? <Users size={16} /> : 
                activeTab === 'model' ? <Box size={16} /> :
                <Radio size={16} />}
            </div>
            <div>
              <h1 className="text-[14px] font-bold text-slate-800 leading-none">Data Configurator</h1>
              <p className="text-[10px] text-slate-500 uppercase font-bold mt-0.5 flex items-center gap-1">
                <TableIcon size={10} /> {activeTab} • <span className="text-indigo-600">{totalCount.toLocaleString()} items</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-100 p-0.5 rounded flex">
              {['address', 'custgroup', 'channel', 'model'].map(id => (
                <button 
                  key={id}
                  onClick={() => { setActiveTab(id); setCurrentPage(1); setSearchTerm(''); }}
                  className={`px-2 py-0.5 text-[12px] font-bold rounded transition ${activeTab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 ml-auto">
              {isAuthenticated && (
                <div className="flex items-center gap-2 mr-1 pr-1 border-r border-slate-200">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-bold">
                    <UserIcon size={12} /> itmasterht
                  </div>
                  <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-rose-500 transition" title="Đăng xuất">
                    <LogOut size={14} />
                  </button>
                </div>
              )}

              <button onClick={openActionModal} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-[12px] font-bold transition shadow-sm">
                <Plus size={14} /> Thêm
              </button>
              
              {['address', 'custgroup'].includes(activeTab) && (
                <button onClick={triggerImport} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[12px] font-bold transition shadow-sm">
                  <Upload size={14} /> Import
                  <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
                </button>
              )}
              
              <button onClick={() => fetchData()} className="p-1 bg-white border border-slate-200 rounded hover:bg-slate-50 transition text-slate-600">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Pagination Bar */}
        <div className="flex flex-col md:flex-row gap-2 mb-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder={`Tìm kiếm cụm từ (có dấu phẩy)...`}
              className="w-full pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[14px] focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); if (activeTab !== 'channel') setCurrentPage(1); }}
            />
          </div>

          {activeTab !== 'channel' && totalPages > 1 && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded overflow-hidden">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="p-1.5 hover:bg-white text-slate-600 disabled:opacity-30 border-r border-slate-200"><ChevronLeft size={14} /></button>
                <div className="flex items-center px-2 gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Trang</span>
                  <input type="text" value={pageInputValue} onChange={(e) => setPageInputValue(e.target.value)} onKeyDown={handlePageInputSubmit} className="w-8 h-5 text-center text-[13px] font-bold text-indigo-600 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none" />
                  <span className="text-[11px] font-bold text-slate-400">/ {totalPages}</span>
                </div>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} className="p-1.5 hover:bg-white text-slate-600 disabled:opacity-30 border-l border-slate-200"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>

        {/* Template Info Area */}
        {getExcelTemplateInfo() && (
          <div className="mb-1 bg-white border-l-2 border-emerald-500 px-1.5 py-1 rounded-r shadow-sm flex items-center gap-2">
            <FileSpreadsheet size={12} className="text-emerald-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mr-1">{getExcelTemplateInfo().title}:</span>
            <div className="flex flex-wrap gap-1 items-center">
              {getExcelTemplateInfo().columns.map((col, idx) => (
                <span key={col} className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-1 border border-slate-200 rounded">{idx + 1}.{col}</span>
              ))}
            </div>
          </div>
        )}

        {status.message && (
          <div className={`mb-1 p-1.5 rounded flex items-center gap-2 text-[13px] border shadow-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
            {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span className="font-bold">{status.message}</span>
          </div>
        )}

        {/* Data Table Area */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left border-collapse min-w-[900px] table-fixed">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase tracking-wider w-10 text-center">#</th>
                  {activeTab === 'address' && (<><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-1/4">Address Short</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-28">Phường</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-20">City Code</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-20">Region</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-32">City Name</th></>)}
                  {activeTab === 'custgroup' && (<><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-1/4">Group Name</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-32">Group Code</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-32">Channel</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-32">Parent</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-24">Limit</th></>)}
                  {activeTab === 'channel' && (<><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-32">Mã Kênh</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase">Tên Kênh</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-32">Ngày tạo</th></>)}
                  {activeTab === 'model' && (<><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase">Model Name</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-32">Model Code</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-32">Channel</th><th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-32">Ngày tạo</th></>)}
                  <th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-16 text-center">ID</th>
                  <th className="px-3 py-1 font-bold text-slate-500 text-[11px] uppercase w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="10" className="p-8 text-center text-slate-400 italic text-[14px]"><RefreshCw className="animate-spin inline-block mb-1 text-indigo-500" size={20} /><p>Đang tải dữ liệu...</p></td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan="10" className="p-8 text-center text-slate-400 italic text-[14px]">Không tìm thấy dữ liệu.</td></tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors group">
                      <td className="px-3 py-0.5 text-center text-slate-400 font-mono text-[12px]">{(activeTab === 'channel' ? index + 1 : ((currentPage - 1) * itemsPerPage) + index + 1)}</td>
                      {activeTab === 'address' && (<><td className="px-3 py-0.5 font-bold text-slate-800 text-[14px] truncate">{item.address_short}</td><td className="px-3 py-0.5 text-slate-600 font-mono text-[13px] truncate italic bg-slate-50/50">{item.code_phuong}</td><td className="px-3 py-0.5 text-slate-600 font-mono text-[13px]">{item.code_city}</td><td className="px-3 py-0.5 text-slate-600 font-mono text-[13px]">{item.code_region}</td><td className="px-3 py-0.5"><span className="px-1.5 py-0 bg-indigo-50 text-indigo-700 rounded text-[12px] font-bold border border-indigo-100">{item.name_city}</span></td></>)}
                      {activeTab === 'custgroup' && (<><td className="px-3 py-0.5 font-bold text-slate-800 text-[14px] truncate">{item.group_name}</td><td className="px-3 py-0.5 text-slate-600 font-mono text-[13px]">{item.group_code}</td><td className="px-3 py-0.5 text-slate-600 font-mono text-[13px]">{item.chanel_code}</td><td className="px-3 py-0.5 text-slate-500 font-medium text-[13px] truncate">{item.group_cha}</td><td className="px-3 py-0.5"><span className="px-1.5 py-0 bg-amber-50 text-amber-700 rounded text-[12px] font-bold border border-amber-100">{item.limit_code}</span></td></>)}
                      {activeTab === 'channel' && (<><td className="px-3 py-0.5 text-slate-600 font-mono font-bold text-[13px]">{item.chcode}</td><td className="px-3 py-0.5 font-bold text-slate-800 text-[14px]">{item.chname}</td><td className="px-3 py-0.5 text-slate-400 text-[12px]">{item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '-'}</td></>)}
                      {activeTab === 'model' && (<><td className="px-3 py-0.5 font-bold text-slate-800 text-[14px]">{item.mdname}</td><td className="px-3 py-0.5 text-slate-600 font-mono text-[13px]">{item.mdcode}</td><td className="px-3 py-0.5 text-slate-600 font-mono text-[13px] italic">{item.chanel_code}</td><td className="px-3 py-0.5 text-slate-400 text-[12px]">{item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '-'}</td></>)}
                      <td className="px-3 py-0.5 text-slate-300 text-[11px] font-mono text-center">#{item.id}</td>
                      <td className="px-3 py-0.5 text-center">
                        <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Login */}
        {isLoginModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="bg-indigo-600 p-6 text-white text-center relative">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={32} />
                </div>
                <h2 className="text-xl font-bold">Yêu cầu đăng nhập</h2>
                <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white transition">✕</button>
              </div>
              <form onSubmit={handleLogin} className="p-6 space-y-4">
                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-bold rounded-lg flex gap-2 items-center">
                    <AlertCircle size={14} /> {loginError}
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tài khoản</label>
                  <input autoFocus required type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Mật khẩu</label>
                  <input required type="password" title="password" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[14px] outline-none focus:border-indigo-500" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[14px] font-bold transition shadow-md">Đăng nhập</button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Insert Data */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-[13px] font-bold text-slate-800 uppercase">Thêm mới {activeTab}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <form onSubmit={handleInsert} className="p-4 space-y-3">
                {activeTab === 'address' && (
                  <>
                    <div><label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Address Short</label><input required className="w-full px-3 py-1.5 border border-slate-200 rounded text-[14px] outline-none" value={addressForm.address_short} onChange={e => setAddressForm({...addressForm, address_short: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Mã Phường</label><input className="w-full px-3 py-1.5 border border-slate-200 rounded text-[14px] font-mono" value={addressForm.code_phuong} onChange={e => setAddressForm({...addressForm, code_phuong: e.target.value})} /></div>
                      <div><label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Mã City</label><input className="w-full px-3 py-1.5 border border-slate-200 rounded text-[14px] font-mono" value={addressForm.code_city} onChange={e => setAddressForm({...addressForm, code_city: e.target.value})} /></div>
                    </div>
                    <div><label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tên Tỉnh/Thành phố</label><input required className="w-full px-3 py-1.5 border border-slate-200 rounded text-[14px]" value={addressForm.name_city} onChange={e => setAddressForm({...addressForm, name_city: e.target.value})} /></div>
                  </>
                )}
                {activeTab === 'custgroup' && (
                  <>
                    <div><label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Group Name</label><input required className="w-full px-3 py-1.5 border border-slate-200 rounded text-[14px]" value={custGroupForm.group_name} onChange={e => setCustGroupForm({...custGroupForm, group_name: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Code</label><input required className="w-full px-3 py-1.5 border border-slate-200 rounded text-[14px] font-mono" value={custGroupForm.group_code} onChange={e => setCustGroupForm({...custGroupForm, group_code: e.target.value})} /></div>
                      <div><label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Channel</label><input className="w-full px-3 py-1.5 border border-slate-200 rounded text-[14px] font-mono" value={custGroupForm.chanel_code} onChange={e => setCustGroupForm({...custGroupForm, chanel_code: e.target.value})} /></div>
                    </div>
                  </>
                )}
                <div className="pt-2 flex gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded text-[13px] font-bold hover:bg-slate-50 transition-all">Hủy</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded text-[13px] font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">Lưu</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
