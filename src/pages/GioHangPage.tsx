import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft, Minus, Plus } from 'lucide-react';
import { gioHangApi } from '../services/api';
import type { GioHang } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { formatCurrency, getImageUrl, handleImgError, PLACEHOLDER_IMG } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function GioHangPage() {
  const [gioHang, setGioHang] = useState<GioHang | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const { isLoggedIn } = useAuthStore();
  const { setCount } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/dang-nhap');
      return;
    }
    fetchCart();
  }, [isLoggedIn, navigate]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await gioHangApi.lay();
      setGioHang(res.data.duLieu);
      setCount(res.data.duLieu?.danhSachChiTiet?.length || 0);
    } catch {
      toast.error('Không thể tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleCapNhat = async (chiTietId: number, soLuong: number) => {
    if (soLuong < 1) return;
    setUpdating(chiTietId);
    try {
      const res = await gioHangApi.capNhat(chiTietId, soLuong);
      setGioHang(res.data.duLieu);
      setCount(res.data.duLieu?.danhSachChiTiet?.length || 0);
    } catch {
      toast.error('Có lỗi khi cập nhật');
    } finally {
      setUpdating(null);
    }
  };

  const handleXoa = async (chiTietId: number) => {
    setUpdating(chiTietId);
    try {
      await gioHangApi.xoa(chiTietId);
      await fetchCart();
      toast.success('Đã xóa khỏi giỏ hàng');
    } catch {
      toast.error('Có lỗi khi xóa');
    } finally {
      setUpdating(null);
    }
  };

  // fallback when server returns zero price
  const getDonGia = (ct: GioHang['danhSachChiTiet'][0]) => ct.donGia || ct.bienThe?.gia || 0;
  const getThanhTien = (ct: GioHang['danhSachChiTiet'][0]) => getDonGia(ct) * ct.soLuong;
  const tongTien =
    gioHang?.danhSachChiTiet?.reduce((sum, ct) => sum + getThanhTien(ct), 0) || 0;

  if (loading) return <LoadingSpinner fullPage />;

  if (!gioHang?.danhSachChiTiet?.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-20 h-20 text-gray-200 mx-auto mb-6" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-500 mb-8">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
        <Link to="/san-pham" className="btn-primary inline-flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" /> Mua sắm ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/san-pham" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Giỏ hàng ({gioHang.danhSachChiTiet.length} sản phẩm)
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {gioHang.danhSachChiTiet.map(ct => {
            const bt = ct.bienThe;
            const donGia = getDonGia(ct);
            const thanhTien = getThanhTien(ct);
            return (
              <div key={ct.id} className="bg-white rounded-xl p-4 border border-gray-100 flex gap-4">
                <Link to={bt?.duongDanSanPham ? `/san-pham/${bt.duongDanSanPham}` : '#'} className="shrink-0">
                  <img
                    src={bt?.anhChinh ? getImageUrl(bt.anhChinh) : PLACEHOLDER_IMG}
                    alt={bt?.tenSanPham}
                    className="w-20 h-20 object-cover rounded-lg bg-gray-50"
                    onError={handleImgError}
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={bt?.duongDanSanPham ? `/san-pham/${bt.duongDanSanPham}` : '#'}
                    className="font-medium text-gray-900 hover:text-indigo-600 line-clamp-2 text-sm">
                    {bt?.tenSanPham || 'Sản phẩm'}
                  </Link>
                  <div className="flex gap-2 mt-1 text-xs text-gray-500">
                    {bt?.tenMauSac && <span>Màu: {bt.tenMauSac}</span>}
                    {bt?.kichThuoc && <span>• Size: {bt.kichThuoc}</span>}
                  </div>
                  <p className="text-indigo-600 font-semibold text-sm mt-1">{formatCurrency(donGia)}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button
                        onClick={() => handleCapNhat(ct.id, ct.soLuong - 1)}
                        disabled={ct.soLuong <= 1 || updating === ct.id}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">
                        {updating === ct.id ? '...' : ct.soLuong}
                      </span>
                      <button
                        onClick={() => handleCapNhat(ct.id, ct.soLuong + 1)}
                        disabled={updating === ct.id}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900 text-sm">{formatCurrency(thanhTien)}</span>
                      <button onClick={() => handleXoa(ct.id)} disabled={updating === ct.id}
                        className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4 pb-4 border-b">Tóm tắt đơn hàng</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({gioHang.danhSachChiTiet.length} sản phẩm)</span>
                <span>{formatCurrency(tongTien)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="text-green-600">Tính khi thanh toán</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>Tổng tiền</span>
                <span className="text-indigo-600">{formatCurrency(tongTien)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/dat-hang')}
              className="btn-primary w-full py-3 mt-6 text-sm font-semibold">
              Tiến hành đặt hàng
            </button>

            <Link to="/san-pham" className="block text-center text-indigo-600 text-sm mt-4 hover:underline">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
