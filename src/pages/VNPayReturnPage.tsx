import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { donHangApi } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VNPayReturnPage() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const xacThucThanhToan = async () => {
      try {
        // Lấy tất cả query parameters từ URL
        const params = new URLSearchParams(location.search);
        const paramObj: Record<string, string> = {};
        params.forEach((value, key) => {
          paramObj[key] = value;
        });

        // Gọi API backend để xác thực chữ ký và cập nhật đơn hàng
        const res = await donHangApi.xacThucVNPayReturn(paramObj);
        const duLieu = res.data.duLieu as unknown as { maDonHang: string; donHangId?: number };

        toast.success(res.data.thongBao || 'Thanh toán thành công!');
        
        // Chuyển hướng đến trang chi tiết đơn hàng
        setTimeout(() => {
          navigate(`/don-hang-cua-toi/${duLieu.maDonHang}`);
        }, 1500);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { thongBao?: string } } })?.response?.data?.thongBao 
          || 'Xác thực thanh toán thất bại';
        toast.error(msg);
        
        // Về trang đơn hàng của tôi sau 2 giây
        setTimeout(() => {
          navigate('/don-hang-cua-toi');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    xacThucThanhToan();
  }, [location.search, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <LoadingSpinner />
        <h2 className="text-xl font-semibold text-gray-700 mt-6">Đang xác thực thanh toán...</h2>
        <p className="text-gray-500 text-sm mt-2">Vui lòng chờ trong giây lát</p>
      </div>
    );
  }

  return null;
}
