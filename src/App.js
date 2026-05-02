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
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-blue-200 shadow-2xl">
              <TableIcon size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight">Data Configurator</h1>
              <p className="text-base font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 mt-1">
                <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></span>
                {activeTab} • {totalCount.toLocaleString()} items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="bg-gray-200 p-1.5 rounded-xl flex gap-1">
              {['address', 'custgroup', 'channel', 'model'].map(id => (
                <button 
                  key={id}
                  onClick={() => { setActiveTab(id); setCurrentPage(1); setSearchTerm(''); }}
                  className={`px-5 py-2.5 text-sm font-black rounded-lg transition-all ${activeTab === id ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {id.toUpperCase()}
                </button>
              ))}
            </div>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4 border-l pl-4 border-gray-300">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-black border border-blue-100">
                  <UserIcon size={18} /> {loginForm.username || 'itmasterht'}
                </div>
                <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition">
                  <LogOut size={24} />
                </button>
              </div>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-xl text-base font-black hover:bg-black transition shadow-xl">
                <Lock size={20} /> ĐĂNG NHẬP
              </button>
            )}
          </div>
        </div>

        {/* Search & Action Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder={`Tìm kiếm trong ${activeTab}...`}
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-gray-100 rounded-2xl text-lg font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="lg:col-span-4 flex gap-3">
            <button 
              onClick={() => isAuthenticated ? setIsModalOpen(true) : setIsLoginModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-4 rounded-2xl text-base font-black transition shadow-lg shadow-blue-100 active:scale-95"
            >
              <Plus size={24} /> THÊM MỚI
            </button>
            <button onClick={() => fetchData()} className="p-4 bg-white border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition text-gray-600 shadow-sm">
              <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Status Message */}
        {status.message && (
          <div className={`p-5 rounded-2xl flex items-center gap-4 text-base font-bold border-2 animate-in slide-in-from-top-4 ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            {status.message}
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white border-2 border-gray-100 rounded-3xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/50 border-b-2 border-gray-100">
                  <th className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest w-20 text-center">#</th>
                  {activeTab === 'address' && (
                    <>
                      <th className="px-6 py-5 text-sm font-black text-gray-500 uppercase tracking-widest">Địa chỉ rút gọn</th>
                      <th className="px-6 py-5 text-sm font-black text-gray-500 uppercase tracking-widest w-40 text-center">Mã Phường</th>
                      <th className="px-6 py-5 text-sm font-black text-gray-500 uppercase tracking-widest w-48 text-center">Tỉnh/Thành</th>
                    </>
                  )}
                  {activeTab === 'custgroup' && (
                    <>
                      <th className="px-6 py-5 text-sm font-black text-gray-500 uppercase tracking-widest">Tên Nhóm</th>
                      <th className="px-6 py-5 text-sm font-black text-gray-500 uppercase tracking-widest">Mã Nhóm</th>
                      <th className="px-6 py-5 text-sm font-black text-gray-500 uppercase tracking-widest">Kênh</th>
                    </>
                  )}
                  <th className="px-6 py-5 text-sm font-black text-gray-500 uppercase tracking-widest w-32 text-center">ID Hệ Thống</th>
                  <th className="px-1 py-5 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="animate-spin text-blue-600" size={48} />
                        <span className="text-xl font-bold text-gray-400">Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-32 text-center text-gray-400 text-xl font-medium italic">Không tìm thấy bản ghi nào</td>
                  </tr>
                ) : (
                  data.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-5 text-center text-gray-300 font-mono text-base">
                        {idx + 1 + (currentPage - 1) * itemsPerPage}
                      </td>
                      {activeTab === 'address' && (
                        <>
                          <td className="px-6 py-5 text-lg font-bold text-gray-800">{item.address_short}</td>
                          <td className="px-6 py-5 text-center font-mono text-gray-500 text-base italic bg-gray-50/50">{item.code_phuong}</td>
                          <td className="px-6 py-5 text-center">
                            <span className="px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-black border border-blue-200">
                              {item.name_city}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'custgroup' && (
                        <>
                          <td className="px-6 py-5 text-lg font-bold text-gray-800">{item.group_name}</td>
                          <td className="px-6 py-5 font-mono text-gray-600 text-base">{item.group_code}</td>
                          <td className="px-6 py-5 text-base font-bold text-blue-600">{item.chanel_code}</td>
                        </>
                      )}
                      <td className="px-6 py-5 text-center text-gray-300 font-mono text-sm">#{item.id}</td>
                      <td className="px-4 py-5 text-center">
                        <button className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Large Pagination */}
          <div className="bg-gray-50/80 p-6 border-t-2 border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-base font-black text-gray-400">
              HIỂN THỊ <span className="text-gray-800">{data.length}</span> / {totalCount.toLocaleString()} BẢN GHI
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-3 bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:border-blue-500 disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={28} />
              </button>
              
              <div className="flex items-center gap-3 bg-white px-6 py-3 border-2 border-gray-200 rounded-2xl shadow-inner">
                <span className="text-sm font-black text-gray-400 uppercase">Trang</span>
                <input 
                  type="text" 
                  value={pageInputValue} 
                  onChange={e => setPageInputValue(e.target.value)}
                  className="w-12 text-center text-xl font-black text-blue-600 outline-none"
                />
                <span className="text-sm font-black text-gray-400 uppercase">/ {Math.ceil(totalCount / itemsPerPage)}</span>
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / itemsPerPage), p + 1))}
                disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                className="p-3 bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:border-blue-500 disabled:opacity-20 transition-all"
              >
                <ChevronRight size={28} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-blue-600 p-10 text-white text-center relative">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 border-8 border-white/10 shadow-2xl">
                <Lock size={48} />
              </div>
              <h2 className="text-4xl font-black tracking-tighter">XÁC THỰC</h2>
              <p className="text-blue-100 mt-2 text-lg font-medium opacity-80">Hệ thống quản trị nội bộ</p>
            </div>
            
            <form onSubmit={handleLogin} className="p-10 space-y-6">
              {loginError && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-black rounded-2xl flex items-center gap-3 border-2 border-red-100">
                  <AlertCircle size={24} /> {loginError}
                </div>
              )}
              
              <div className="space-y-3">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Tài khoản</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all" 
                  placeholder="Username..."
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                <input 
                  required 
                  type="password" 
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold outline-none focus:border-blue-500 focus:bg-white transition-all" 
                  placeholder="Password..."
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <button type="submit" className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl text-xl font-black shadow-2xl shadow-blue-200 transition-all active:scale-95">
                  VÀO HỆ THỐNG
                </button>
                <button type="button" onClick={() => setIsLoginModalOpen(false)} className="text-gray-400 font-bold hover:text-gray-600 transition-colors">
                  Đóng cửa sổ
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
