import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';

// Customer pages
import TrangChuPage from './pages/TrangChuPage';
import DanhSachSanPhamPage from './pages/DanhSachSanPhamPage';
import ChiTietSanPhamPage from './pages/ChiTietSanPhamPage';
import DanhMucSanPhamPage from './pages/DanhMucSanPhamPage';
import GioHangPage from './pages/GioHangPage';
import DatHangPage from './pages/DatHangPage';
import VNPayReturnPage from './pages/VNPayReturnPage';
import DonHangCuaToiPage from './pages/DonHangCuaToiPage';
import ChiTietDonHangPage from './pages/ChiTietDonHangPage';
import TaiKhoanPage from './pages/TaiKhoanPage';

// Auth pages
import DangNhapPage from './pages/DangNhapPage';
import DangKyPage from './pages/DangKyPage';

// Admin pages
import DashboardPage from './pages/admin/DashboardPage';
import QuanLyDonHangPage from './pages/admin/QuanLyDonHangPage';
import QuanLyNguoiDungPage from './pages/admin/QuanLyNguoiDungPage';
import QuanLySanPhamPage from './pages/admin/QuanLySanPhamPage';
import QuanLyThuocTinhPage from './pages/admin/QuanLyThuocTinhPage';
import QuanLyVoucherPage from './pages/admin/QuanLyVoucherPage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false },
    },
});

function CustomerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    {/* Auth pages - no layout */}
                    <Route path="/dang-nhap" element={<DangNhapPage />} />
                    <Route path="/dang-ky" element={<DangKyPage />} />
                    <Route path="/vnpay-return" element={<VNPayReturnPage />} />

                    {/* Customer pages with Header+Footer */}
                    <Route path="/" element={<CustomerLayout><TrangChuPage /></CustomerLayout>} />
                    <Route path="/san-pham" element={<CustomerLayout><DanhSachSanPhamPage /></CustomerLayout>} />
                    <Route path="/san-pham/:duongDan" element={<CustomerLayout><ChiTietSanPhamPage /></CustomerLayout>} />
                    <Route path="/danh-muc/:duongDan" element={<CustomerLayout><DanhMucSanPhamPage /></CustomerLayout>} />
                    <Route path="/tim-kiem" element={<CustomerLayout><DanhSachSanPhamPage /></CustomerLayout>} />

                    {/* Protected customer pages */}
                    <Route path="/gio-hang" element={<CustomerLayout><ProtectedRoute onlyKhachHang><GioHangPage /></ProtectedRoute></CustomerLayout>} />
                    <Route path="/dat-hang" element={<CustomerLayout><ProtectedRoute onlyKhachHang><DatHangPage /></ProtectedRoute></CustomerLayout>} />
                    <Route path="/don-hang-cua-toi" element={<CustomerLayout><ProtectedRoute onlyKhachHang><DonHangCuaToiPage /></ProtectedRoute></CustomerLayout>} />
                    <Route path="/don-hang-cua-toi/:maDonHang" element={<CustomerLayout><ProtectedRoute onlyKhachHang><ChiTietDonHangPage /></ProtectedRoute></CustomerLayout>} />
                    <Route path="/tai-khoan/*" element={<CustomerLayout><ProtectedRoute><TaiKhoanPage /></ProtectedRoute></CustomerLayout>} />

                    {/* Admin pages */}
                    <Route path="/quan-ly" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
                        <Route index element={<DashboardPage />} />
                        <Route path="san-pham" element={<QuanLySanPhamPage />} />
                        <Route path="don-hang" element={<QuanLyDonHangPage />} />
                        <Route path="nguoi-dung" element={<QuanLyNguoiDungPage />} />
                        <Route path="thuoc-tinh" element={<QuanLyThuocTinhPage />} />
                        <Route path="voucher" element={<QuanLyVoucherPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: { fontSize: '14px', borderRadius: '12px' },
                }}
            />
        </QueryClientProvider>
    );
}
