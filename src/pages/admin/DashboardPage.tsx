import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { adminApi } from '../../services/api';
import { formatCurrency } from '../../utils/format';
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

  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [tongDoanhThu, setTongDoanhThu] = useState<number | null>(null);

  useEffect(() => {
    adminApi.tongQuan()
      .then(r => setData(r.data.duLieu as unknown as ThongKe))
      .finally(() => setLoading(false));
  }, []);

  const xemDoanhThu = () => {
    if (!tuNgay || !denNgay) return;

    adminApi.doanhThu(
      tuNgay + "T00:00:00",
      denNgay + "T23:59:59"
    ).then(res => {
      setTongDoanhThu(res.data.duLieu.tongDoanhThu);
    });
  };

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

      {/* Card thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <span className="text-sm font-medium text-gray-500">{c.label}</span>
            <p className="text-2xl font-bold text-gray-900 mt-2">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Chọn ngày xem doanh thu */}
      <div className="bg-white border rounded-xl p-5 mb-6">
        <h3 className="font-semibold mb-4">Xem doanh thu theo ngày</h3>

        <div className="flex gap-3 items-center">
          <input
            type="date"
            value={tuNgay}
            onChange={e => setTuNgay(e.target.value)}
            className="border rounded px-3 py-2"
          />

          <span>đến</span>

          <input
            type="date"
            value={denNgay}
            onChange={e => setDenNgay(e.target.value)}
            className="border rounded px-3 py-2"
          />

          <button
            onClick={xemDoanhThu}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Xem
          </button>
        </div>

        {tongDoanhThu !== null && (
          <p className="mt-4 text-lg font-semibold">
            Tổng doanh thu: {formatCurrency(tongDoanhThu)}
          </p>
        )}
      </div>

      {/* Cảnh báo đơn chờ */}
      {choXacNhan > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-800 text-sm">
            Có <strong>{choXacNhan}</strong> đơn hàng đang chờ xác nhận.
          </p>
        </div>
      )}

    </div>
  );
}