import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { gioHangApi, sanPhamApi } from '../services/api';
import type { DanhMuc } from '../services/api';

export default function Header() {
  const { user, logout, isLoggedIn, isNhanVien } = useAuthStore();
  const { count, setCount } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [danhMuc, setDanhMuc] = useState<DanhMuc[]>([]);
  const [tuKhoa, setTuKhoa] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sanPhamApi.danhMuc().then(r => setDanhMuc(r.data.duLieu || [])).catch(() => {});
  }, []);

  // Re-sync cart count from server on every route change so badge is always accurate
  // (e.g. after placing an order, after deleting items from another tab, etc.)
  useEffect(() => {
    if (!isLoggedIn() || isNhanVien()) {
      setCount(0);
      return;
    }
    gioHangApi.lay().then(r => {
      const items = r.data.duLieu?.danhSachChiTiet;
      const totalQuantity = items ? items.reduce((sum, ct) => sum + ct.soLuong, 0) : 0;
      setCount(totalQuantity);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/dang-nhap');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tuKhoa.trim()) {
      navigate(`/tim-kiem?q=${encodeURIComponent(tuKhoa.trim())}`);
      setTuKhoa('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main header */}
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:block">CertainShop</span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={tuKhoa}
                onChange={e => setTuKhoa(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Cart */}
            <Link to="/gio-hang" className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            {/* User menu */}
            {isLoggedIn() ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-sm">
                    {(user?.hoTen || user?.tenDangNhap || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-24 truncate">
                    {user?.hoTen || user?.tenDangNhap}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <Link to="/tai-khoan/thong-tin"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}>
                      <User className="w-4 h-4" /> Tài khoản của tôi
                    </Link>
                    {!isNhanVien() && (
                      <Link to="/don-hang-cua-toi"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}>
                        📦 Đơn hàng của tôi
                      </Link>
                    )}
                    {isNhanVien() && (
                      <Link to="/quan-ly"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}>
                        ⚙️ Quản lý
                      </Link>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/dang-nhap" className="text-sm text-gray-600 hover:text-indigo-600 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  Đăng nhập
                </Link>
                <Link to="/dang-ky" className="btn-primary text-sm py-2 px-4 hidden sm:block">
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button className="lg:hidden p-2 text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Category nav */}
        <nav className="hidden lg:flex items-center gap-1 border-t border-gray-100 py-2">
          <Link to="/" className="px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            Trang chủ
          </Link>
          <Link to="/san-pham" className="px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium">
            Tất cả sản phẩm
          </Link>
          {danhMuc.slice(0, 6).map(dm => (
            <Link key={dm.id} to={`/danh-muc/${dm.duongDan}`}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              {dm.tenDanhMuc}
            </Link>
          ))}
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="lg:hidden border-t border-gray-100 py-3 flex flex-col gap-1">
            <Link to="/" className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>Trang chủ</Link>
            <Link to="/san-pham" className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>Tất cả sản phẩm</Link>
            {danhMuc.map(dm => (
              <Link key={dm.id} to={`/danh-muc/${dm.duongDan}`}
                className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMenuOpen(false)}>
                {dm.tenDanhMuc}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
