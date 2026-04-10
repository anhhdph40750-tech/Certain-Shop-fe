import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { adminApi } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';


interface ThongKe {
  doanhThuThang: number;
  doanhThuHomNay: number;
  thongKeTrangThai: Record<string, number>;
  tongKhachHang: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<ThongKe | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [tongDoanhThu, setTongDoanhThu] = useState<number | null>(null);
  const [sanPhamBanChay, setSanPhamBanChay] = useState<any[]>([]);
  
//  {Để sẵn mặc định select đầu tháng đến ngày hôm nay}

//   useEffect(() => {
//   const today = new Date();
//   const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

//   const formatDate = (date: Date) => date.toISOString().split("T")[0];

//   const tu = formatDate(firstDay);
//   const den = formatDate(today);

//   setTuNgay(tu);
//   setDenNgay(den);

//   adminApi.doanhThu(tu + "T00:00:00", den + "T23:59:59").then(res => {
//     const chiTiet = res.data.duLieu.chiTiet;

//     const data = chiTiet.map((item: any) => ({
//       ngay: item[0],
//       doanhThu: item[1]
//     }));

//     setChartData(data);
//     setTongDoanhThu(res.data.duLieu.tongDoanhThu);
//   });
// }, []);

  useEffect(() => {
  adminApi.sanPhamBanChay().then(res => {

    const data = res.data.duLieu.map((item: any) => ({
      tenSanPham: item[1],
      soLuong: item[2]
    }));

    setSanPhamBanChay(data);

  });
}, []);

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

    const chiTiet = res.data.duLieu.chiTiet;

    const data = chiTiet.map((item: any) => ({
      ngay: item[0],
      doanhThu: item[1]
    }));

    setChartData(data);
    setTongDoanhThu(res.data.duLieu.tongDoanhThu);
  });
};

  if (loading) return <LoadingSpinner fullPage />;

  const choXacNhan = data?.thongKeTrangThai?.CHO_XAC_NHAN ?? 0;

  const cards = [
    { label: 'Doanh thu hôm nay', value: formatCurrency(data?.doanhThuHomNay ?? 0)},
    { label: 'Doanh thu tháng', value: formatCurrency(data?.doanhThuThang ?? 0) },
    // { label: 'Tổng đơn hàng', value: tongDonHang },
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


        {chartData.length > 0 && (
  <div className="mt-6 h-80">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="ngay" />

        <YAxis />

        <Tooltip
          formatter={(value: any) => typeof value === 'number' ? formatCurrency(value) : value}
        />

        <Line
          type="monotone"
          dataKey="doanhThu"
          stroke="#3b82f6"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>

  
)}
      </div>

      <div className="bg-white border rounded-xl p-5 mb-6">
  <h3 className="font-semibold mb-4">Sản phẩm bán chạy</h3>

  <div className="h-80">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={sanPhamBanChay}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="tenSanPham" />

        <YAxis />

        <Tooltip />

        <Bar
          dataKey="soLuong"
          fill="#3b82f6"
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
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
