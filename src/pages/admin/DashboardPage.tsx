import { useState, useEffect } from 'react';
import { ShoppingCart, Users, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { adminApi } from '../../services/api';
import { formatCurrency, trangThaiDonHangLabel } from '../../utils/format';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ThongKe {
  doanhThuThang: number;
  doanhThuHomNay: number;
  thongKeTrangThai: Record<string, number>;
  tongKhachHang: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<ThongKe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.tongQuan()
      .then(r => setData(r.data.duLieu as unknown as ThongKe))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  const choXacNhan = data?.thongKeTrangThai?.CHO_XAC_NHAN ?? 0;
  const tongDonHang = Object.values(data?.thongKeTrangThai || {}).reduce((a, b) => a + b, 0);

  const cards = [
    { label: 'Doanh thu hôm nay', value: formatCurrency(data?.doanhThuHomNay ?? 0)},
    { label: 'Doanh thu tháng', value: formatCurrency(data?.doanhThuThang ?? 0) },
    { label: 'Tổng đơn hàng', value: tongDonHang },
    { label: 'Khách hàng', value: data?.tongKhachHang ?? 0 },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Tổng quan</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">{c.label}</span>
              <div >
                {/* <c.icon className="w-5 h-5 text-white" /> */}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      {choXacNhan > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-800 text-sm">Có <strong>{choXacNhan}</strong> đơn hàng đang chờ xác nhận.</p>
        </div>
      )}

      
    </div>
  );
}
