import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { donHangApi } from '../services/api';
import type { DonHang } from '../services/api';
import { formatCurrency, formatDate, trangThaiDonHangLabel } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DonHangCuaToiPage() {
  const [danhSach, setDanhSach] = useState<DonHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [trang, setTrang] = useState(0);
  const [tongTrang, setTongTrang] = useState(0);

  useEffect(() => {
    setLoading(true);
    donHangApi.danhSachCuaToi(trang)
      .then(r => {
        setDanhSach(r.data.duLieu?.danhSach || []);
        setTongTrang(r.data.duLieu?.tongSoTrang || 0);
      })
      .finally(() => setLoading(false));
  }, [trang]);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Đơn hàng của tôi</h1>

      {danhSach.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">Bạn chưa có đơn hàng nào</p>
          <Link to="/san-pham" className="btn-primary">Mua sắm ngay</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {danhSach.map(dh => {
            const tt = trangThaiDonHangLabel[dh.trangThaiDonHang] || { label: dh.trangThaiDonHang, color: 'gray' };
            return (
              <Link key={dh.id} to={`/don-hang-cua-toi/${dh.maDonHang}`}
                className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-indigo-100 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-gray-900">#{dh.maDonHang}</span>
                    <span className="text-gray-400 text-sm ml-3">{formatDate(dh.thoiGianTao)}</span>
                  </div>
                  <span className={`badge badge-${tt.color}`}>{tt.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{dh.soMatHang} sản phẩm</p>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-indigo-600">{formatCurrency(dh.tongTienThanhToan)}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            );
          })}

          {tongTrang > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button disabled={trang === 0} onClick={() => setTrang(t => t - 1)} className="btn-secondary text-sm">Trước</button>
              <span className="px-4 py-2 text-sm text-gray-600">{trang + 1} / {tongTrang}</span>
              <button disabled={trang >= tongTrang - 1} onClick={() => setTrang(t => t + 1)} className="btn-secondary text-sm">Sau</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
