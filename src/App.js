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

// Tự động nạp Tailwind CSS để tránh lỗi vỡ giao diện khi deploy
if (typeof document !== 'undefined' && !document.getElementById('tailwind-inject')) {
  const link = document.createElement('link');
  link.id = 'tailwind-inject';
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
  document.head.appendChild(link);
}

const App = () => {
  const [activeTab, setActiveTab] = useState('address');
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supabase, setSupabase] = useState(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState('1');
  const itemsPerPage = 30;

  const fileInputRef = useRef(null);

  // Khôi phục trạng thái đăng nhập khi F5
  useEffect(() => {
    const checkAuth = () => {
      const savedAuth = localStorage.getItem('app_auth');
      const authTimestamp = localStorage.getItem('app_auth_time');
      if (savedAuth === 'true' && authTimestamp) {
        const now = new Date().getTime();
        if (now - parseInt(authTimestamp) < 60 * 60 * 1000) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('app_auth');
          localStorage.removeItem('app_auth_time');
        }
      }
    };
    checkAuth();
  }, []);

  // Khởi tạo Supabase
  useEffect(() => {
    const initSupabase = async () => {
      try {
        if (!window.supabase) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
          document.head.appendChild(script);
          script.onload = () => {
            const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            setSupabase(client);
          };
        } else {
          const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
          setSupabase(client);
        }
      } catch (err) {
        setStatus({ type: 'error', message: 'Không thể kết nối cơ sở dữ liệu' });
      }
    };
    initSupabase();
  }, []);

  useEffect(() => {
    if (supabase) {
      fetchData();
    }
  }, [supabase, activeTab, currentPage, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tableMap = { 
        address: 'ConfigAddress', 
        custgroup: 'ConfigCustGroup', 
        channel: 'ConfigChannel', 
        model: 'ConfigModel' 
      };
      const tableName = tableMap[activeTab];
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase.from(tableName).select('*', { count: 'exact' });

      if (searchTerm) {
        if (activeTab === 'address') {
          query = query.or(`address_short.ilike.%${searchTerm}%,name_city.ilike.%${searchTerm}%`);
        } else if (activeTab === 'custgroup') {
          query = query.or(`group_name.ilike.%${searchTerm}%,group_code.ilike.%${searchTerm}%`);
        } else if (activeTab === 'model') {
          query = query.or(`mdcode.ilike.%${searchTerm}%,mdname.ilike.%${searchTerm}%`);
        }
      }

      const { data, error, count } = await query
        .order('id', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setData(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'itmasterht' && loginForm.password === '2026master@') {
      setIsAuthenticated(true);
      setIsLoginModalOpen(false);
      localStorage.setItem('app_auth', 'true');
      localStorage.setItem('app_auth_time', new Date().getTime().toString());
      setStatus({ type: 'success', message: 'Đăng nhập thành công!' });
    } else {
      setLoginError('Tài khoản hoặc mật khẩu không đúng');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('app_auth');
    localStorage.removeItem('app_auth_time');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-3 font-sans text-gray-900 text-[14px]">
      <div className="max-w-full mx-auto space-y-3">
        
        {/* Header Section - Thu gọn padding */}
        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
              <TableIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-800 tracking-tight leading-none">Data Configurator</h1>
              <p className="text-[12px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                {activeTab} • {totalCount.toLocaleString()} items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="bg-gray-100 p-1 rounded-lg flex gap-0.5">
              {['address', 'custgroup', 'channel', 'model'].map(id => (
                <button 
                  key={id}
                  onClick={() => { setActiveTab(id); setCurrentPage(1); setSearchTerm(''); }}
                  className={`px-3 py-1.5 text-[13px] font-bold rounded-md transition-all ${activeTab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {id.toUpperCase()}
                </button>
              ))}
            </div>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-3 border-l pl-3 border-gray-300">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-[13px] font-bold border border-blue-100">
                  <UserIcon size={14} /> {loginForm.username || 'itmasterht'}
                </div>
                <button onClick={handleLogout} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-1.5 rounded-lg text-[13px] font-black hover:bg-black transition shadow-sm">
                <Lock size={14} /> ĐĂNG NHẬP
              </button>
            )}
          </div>
        </div>

        {/* Search & Action Bar - Thu gọn chiều cao */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          <div className="lg:col-span-9 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={`Tìm kiếm trong ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[14px] focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="lg:col-span-3 flex gap-2">
            <button 
              onClick={() => isAuthenticated ? setIsModalOpen(true) : setIsLoginModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-[14px] font-bold transition shadow-sm active:scale-95"
            >
              <Plus size={18} /> THÊM
            </button>
            <button onClick={() => fetchData()} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600 shadow-sm">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Status Message */}
        {status.message && (
          <div className={`p-3 rounded-lg flex items-center gap-3 text-[13px] font-bold border animate-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.message}
          </div>
        )}

        {/* Data Table - Tối ưu padding dòng để hiển thị nhiều dòng hơn */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-220px)] overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-3 py-2 text-[12px] font-black text-gray-500 uppercase tracking-tighter w-12 text-center">#</th>
                  {activeTab === 'address' && (
                    <>
                      <th className="px-3 py-2 text-[12px] font-black text-gray-600 uppercase">Địa chỉ rút gọn</th>
                      <th className="px-3 py-2 text-[12px] font-black text-gray-600 uppercase w-32 text-center">Mã Phường</th>
                      <th className="px-3 py-2 text-[12px] font-black text-gray-600 uppercase w-40 text-center">Tỉnh/Thành</th>
                    </>
                  )}
                  {activeTab === 'custgroup' && (
                    <>
                      <th className="px-3 py-2 text-[12px] font-black text-gray-600 uppercase">Tên Nhóm</th>
                      <th className="px-3 py-2 text-[12px] font-black text-gray-600 uppercase">Mã Nhóm</th>
                      <th className="px-3 py-2 text-[12px] font-black text-gray-600 uppercase">Kênh</th>
                    </>
                  )}
                  <th className="px-3 py-2 text-[12px] font-black text-gray-500 uppercase w-24 text-center">ID</th>
                  <th className="px-1 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="animate-spin text-blue-600" size={32} />
                        <span className="text-[14px] font-bold text-gray-400">Đang tải...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-20 text-center text-gray-400 text-[14px] italic">Không tìm thấy bản ghi nào</td>
                  </tr>
                ) : (
                  data.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-3 py-1.5 text-center text-gray-400 font-mono text-[13px]">
                        {idx + 1 + (currentPage - 1) * itemsPerPage}
                      </td>
                      {activeTab === 'address' && (
                        <>
                          <td className="px-3 py-1.5 text-[14px] font-bold text-gray-800">{item.address_short}</td>
                          <td className="px-3 py-1.5 text-center font-mono text-gray-500 text-[13px] bg-gray-50/30">{item.code_phuong}</td>
                          <td className="px-3 py-1.5 text-center">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[12px] font-bold border border-blue-100">
                              {item.name_city}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'custgroup' && (
                        <>
                          <td className="px-3 py-1.5 text-[14px] font-bold text-gray-800">{item.group_name}</td>
                          <td className="px-3 py-1.5 font-mono text-gray-600 text-[13px]">{item.group_code}</td>
                          <td className="px-3 py-1.5 text-[13px] font-bold text-blue-600">{item.chanel_code}</td>
                        </>
                      )}
                      <td className="px-3 py-1.5 text-center text-gray-300 font-mono text-[12px]">#{item.id}</td>
                      <td className="px-1 py-1.5 text-center">
                        <button className="p-1 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Nhỏ gọn */}
          <div className="bg-gray-50 p-3 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-[13px] font-bold text-gray-400">
              {data.length} / {totalCount.toLocaleString()} ITEMS
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white border border-gray-300 rounded hover:border-blue-500 disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-2 bg-white px-3 py-1 border border-gray-300 rounded shadow-inner">
                <input 
                  type="text" 
                  value={pageInputValue} 
                  onChange={e => setPageInputValue(e.target.value)}
                  className="w-8 text-center text-[14px] font-black text-blue-600 outline-none"
                />
                <span className="text-[12px] font-black text-gray-400">/ {Math.ceil(totalCount / itemsPerPage)}</span>
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / itemsPerPage), p + 1))}
                disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                className="p-1.5 bg-white border border-gray-300 rounded hover:border-blue-500 disabled:opacity-20 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-blue-600 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white/10 shadow-lg">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-black tracking-tight">XÁC THỰC</h2>
              <p className="text-blue-100 text-[13px] opacity-80">Quản trị hệ thống nội bộ</p>
            </div>
            
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {loginError && (
                <div className="p-2.5 bg-red-50 text-red-600 text-[12px] font-bold rounded-lg flex items-center gap-2 border border-red-100">
                  <AlertCircle size={16} /> {loginError}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase ml-1">Tài khoản</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[14px] font-bold outline-none focus:border-blue-500 focus:bg-white transition-all" 
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase ml-1">Mật khẩu</label>
                <input 
                  required 
                  type="password" 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[14px] font-bold outline-none focus:border-blue-500 focus:bg-white transition-all" 
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[15px] font-black shadow-md transition-all">
                  ĐĂNG NHẬP
                </button>
                <button type="button" onClick={() => setIsLoginModalOpen(false)} className="text-gray-400 text-[13px] font-bold hover:text-gray-600 py-1">
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
