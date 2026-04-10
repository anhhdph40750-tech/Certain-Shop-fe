import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface Props {
  children: React.ReactNode;
  /** Chỉ cho phép ADMIN / NHAN_VIEN */
  requireAdmin?: boolean;
  /** Chỉ cho phép KHACH_HANG — chặn admin/nhân viên dùng luồng khách */
  onlyKhachHang?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false, onlyKhachHang = false }: Props) {
  const { isLoggedIn, isNhanVien } = useAuthStore();

  if (!isLoggedIn()) {
    return <Navigate to="/dang-nhap" replace />;
  }

  if (requireAdmin && !isNhanVien()) {
    return <Navigate to="/" replace />;
  }

  // Admin/Nhân viên không dùng luồng đặt hàng / đơn hàng khách
  if (onlyKhachHang && isNhanVien()) {
    return <Navigate to="/quan-ly" replace />;
  }

  return <>{children}</>;
}
