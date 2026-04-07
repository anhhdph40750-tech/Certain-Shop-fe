// Trang quản lý Khách hàng — wrapper của QuanLyNguoiDungPage với mode cố định KHACH_HANG
import QuanLyNguoiDungPage from './QuanLyNguoiDungPage';

export default function QuanLyKhachHangPage() {
  return <QuanLyNguoiDungPage defaultMode="KHACH_HANG" />;
}
