import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/format';

interface PaymentResult {
  status: 'success' | 'error';
  maDonHang: string;
  maGiaoDich?: string;
  tongTienThanhToan?: number;
  message?: string;
}

export default function VNPayReturnPage() {
  const [loading, setLoading] = useState(true);
  const [kq, setKq] = useState<PaymentResult | null>(null);
  const [soGiay, setSoGiay] = useState(10);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Đọc tham số từ URL được VNPay callback trả về
    const layKetQua = () => {
      const params = new URLSearchParams(location.search);
      const status = params.get('status');
      const maDonHang = params.get('maDonHang') || '';
      const maGiaoDich = params.get('maGiaoDich') || '';
      const tongTienStr = params.get('tongTienThanhToan');
      const tongTien = tongTienStr ? parseFloat(tongTienStr) : undefined;
      const message = params.get('message') || '';

      if (status === 'success') {
        setKq({
          status: 'success',
          maDonHang,
          maGiaoDich,
          tongTienThanhToan: tongTien,
          message: message || 'Thanh toán thành công'
        });
      } else {
        setKq({
          status: 'error',
          maDonHang,
          message: message || 'Thanh toán không thành công'
        });
      }

      setLoading(false);
    };

    layKetQua();
  }, [location.search]);

  // Tự động chuyển hướng sau 5 giây nếu thành công
  useEffect(() => {
    if (!kq || kq.status !== 'success') return;

    const timer = setInterval(() => {
      setSoGiay(prev => prev - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      navigate(`/don-hang-cua-toi/${kq.maDonHang}`);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [kq, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
        <LoadingSpinner />
        <h2 className="text-2xl font-bold text-gray-800 mt-6">Đang xác thực thanh toán</h2>
        <p className="text-gray-500 text-sm mt-2 animate-pulse">Vui lòng chờ trong giây lát...</p>
      </div>
    );
  }

  if (!kq) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Lỗi xác thực</h1>
        <p className="text-gray-600 text-center mb-6">Không thể xác định kết quả thanh toán</p>
        <button
          onClick={() => navigate('/don-hang-cua-toi')}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          Quay lại đơn hàng
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {kq.status === 'success' ? (
          // ===== THÀNH CÔNG =====
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Biểu tượng thành công */}
            <div className="mb-6 relative">
              <div className="inline-block relative">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4 text-white">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tiêu đề */}
            <h1 className="text-3xl font-bold text-green-600 mb-2">Thanh toán thành công!</h1>
            <p className="text-gray-600 text-lg mb-8">{kq.message}</p>

            {/* Thông tin đơn hàng */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 text-left">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                  <span className="text-gray-600 font-medium">Mã đơn hàng:</span>
                  <span className="font-bold text-indigo-600 text-lg">{kq.maDonHang}</span>
                </div>
                
                {kq.tongTienThanhToan && (
                  <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                    <span className="text-gray-600 font-medium">Tổng tiền:</span>
                    <span className="font-bold text-green-600 text-lg">
                      {formatCurrency(kq.tongTienThanhToan)}
                    </span>
                  </div>
                )}

                {kq.maGiaoDich && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Mã giao dịch:</span>
                    <span className="text-gray-800 font-mono text-sm">{kq.maGiaoDich}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thông báo */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-8">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">ℹ️</span> Thanh toán đã được xác nhận. Cửa hàng sẽ xác nhận và xử lý đơn hàng của bạn trong thời gian sắp tới. Bạn sẽ nhận được email thông báo khi đơn hàng được gửi.
              </p>
            </div>

            {/* Nút hành động */}
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/don-hang-cua-toi/${kq.maDonHang}`)}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition duration-300"
              >
                Xem chi tiết đơn hàng
              </button>
              <button
                onClick={() => navigate('/don-hang-cua-toi')}
                className="w-full px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition"
              >
                Xem tất cả đơn hàng
              </button>
            </div>

            {/* Countdown */}
            <p className="text-xs text-gray-500 mt-6">
              Tự động chuyển hướng sau <span className="font-bold text-indigo-600">{soGiay}</span> giây...
            </p>
          </div>
        ) : (
          // ===== LỖI / THẤT BẠI =====
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Biểu tượng lỗi */}
            <div className="mb-6">
              <div className="inline-block relative">
                <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-red-400 to-rose-500 rounded-full p-4 text-white">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tiêu đề */}
            <h1 className="text-3xl font-bold text-red-600 mb-2">Thanh toán thất bại</h1>
            <p className="text-gray-600 text-lg mb-8">{kq.message}</p>

            {/* Thông tin đơn hàng */}
            {kq.maDonHang && (
              <div className="bg-red-50 rounded-xl p-6 mb-8 text-left">
                <p className="text-gray-700">
                  <span className="font-medium">Mã đơn hàng:</span>{' '}
                  <span className="text-red-600 font-bold">{kq.maDonHang}</span>
                </p>
              </div>
            )}

            {/* Thông báo hướng dẫn */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-8">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">ℹ️</span> Vui lòng kiểm tra lại thông tin thanh toán hoặc thử lại sau vài phút. Nếu vẫn gặp sự cố, hãy liên hệ với chúng tôi.
              </p>
            </div>

            {/* Nút hành động */}
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/dat-hang`)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition duration-300"
              >
                Quay lại thanh toán
              </button>
              <button
                onClick={() => navigate('/don-hang-cua-toi')}
                className="w-full px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition"
              >
                Xem đơn hàng của tôi
              </button>
            </div>

            {/* Hỗ trợ */}
            <p className="text-xs text-gray-500 mt-6">
              Cần hỗ trợ? <a href="#" className="text-indigo-600 font-medium hover:underline">Liên hệ với chúng tôi</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
