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
    { label: 'Doanh thu hôm nay', value: formatCurrency(data?.doanhThuHomNay ?? 0), icon: TrendingUp, color: 'bg-emerald-500' },
    { label: 'Doanh thu tháng', value: formatCurrency(data?.doanhThuThang ?? 0), icon: Calendar, color: 'bg-blue-500' },
    { label: 'Tổng đơn hàng', value: tongDonHang, icon: ShoppingCart, color: 'bg-violet-500' },
    { label: 'Khách hàng', value: data?.tongKhachHang ?? 0, icon: Users, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Tổng quan</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">{c.label}</span>
              <div className={`${c.color} p-2 rounded-lg`}>
                <c.icon className="w-5 h-5 text-white" />
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

      {/* Order status breakdown */}
      {data?.thongKeTrangThai && Object.keys(data.thongKeTrangThai).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Đơn hàng theo trạng thái</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(data.thongKeTrangThai).map(([key, count]) => {
              const info = trangThaiDonHangLabel[key] || { label: key, color: 'gray' };
              return (
                <div key={key} className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className={`text-xs font-medium mt-1 text-${info.color}-600`}>{info.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
