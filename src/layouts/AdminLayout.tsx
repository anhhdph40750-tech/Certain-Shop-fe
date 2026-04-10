import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Tags, Ticket,
  Menu, X, LogOut, Store, ChevronDown, UserCog
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const navItems = [
  { to: '/quan-ly', label: 'Thống kê', icon: LayoutDashboard, end: true },
  { to: '/quan-ly/ban-hang', label: 'Bán hàng', icon: Store },
  { to: '/quan-ly/don-hang', label: 'Quản lý hóa đơn', icon: ShoppingCart },
  { to: '/quan-ly/san-pham', label: 'Quản lý sản phẩm', icon: Package },
  { to: '/quan-ly/thuoc-tinh', label: 'Danh sách thuộc tính', icon: Tags },
  { to: '/quan-ly/voucher', label: 'Quản lý giảm giá', icon: Ticket },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [taiKhoanOpen, setTaiKhoanOpen] = useState(true);
  const { user, logout, isSuperAdmin } = useAuthStore();
  const location = useLocation();

  const isTaiKhoanActive = location.pathname.startsWith('/quan-ly/nguoi-dung')
    || location.pathname.startsWith('/quan-ly/khach-hang')
    || location.pathname.startsWith('/quan-ly/user-admin');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${collapsed ? 'w-16' : 'w-60'} bg-gray-900 flex flex-col transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          {!collapsed && (
            <Link to="/" className="text-white font-bold text-lg">
              Certain<span className="text-indigo-400">Shop</span>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white p-1 rounded">
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          {/* Quản lý tài khoản — có sub-menu */}
          <div>
            <button
              onClick={() => !collapsed && setTaiKhoanOpen(o => !o)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isTaiKhoanActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <UserCog className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Quản lý tài khoản</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${taiKhoanOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {!collapsed && taiKhoanOpen && (
              <div className="ml-8 mt-1 space-y-0.5">
                <NavLink
                  to="/quan-ly/nguoi-dung"
                  end
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'text-white bg-orange-500' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  Nhân viên
                </NavLink>
                <NavLink
                  to="/quan-ly/user-admin"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'text-white bg-orange-500' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  Quản lý admin
                </NavLink>
                <NavLink
                  to="/quan-ly/khach-hang"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'text-white bg-orange-500' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`
                  }
                >
                  Khách hàng
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-700 space-y-1">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors text-sm">
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="font-semibold text-gray-800">Quản lý</h1>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isSuperAdmin() ? 'bg-red-100' : 'bg-indigo-100'
            }`}>
              <span className={`font-semibold text-sm ${
                isSuperAdmin() ? 'text-red-600' : 'text-indigo-600'
              }`}>
                {user?.hoTen?.[0] || 'A'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-700 font-medium">{user?.hoTen}</p>
              <p className={`text-xs ${
                isSuperAdmin() ? 'text-red-500 font-medium' : 'text-gray-400'
              }`}>
                {isSuperAdmin() ? 'Super Admin' : user?.vaiTro === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
