import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { donHangApi } from '../services/api';
import type { DonHang } from '../services/api';
import { formatCurrency, formatDate, trangThaiDonHangLabel, getImageUrl, handleImgError } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import InvoicePrint from '../components/InvoicePrint';

const STEPS_COD = ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_XU_LY', 'DANG_GIAO', 'HOAN_TAT'];
const STEPS_VNPAY = ['CHO_THANH_TOAN', 'DA_THANH_TOAN', 'DANG_XU_LY', 'DANG_GIAO', 'HOAN_TAT'];

export default function ChiTietDonHangPage() {
  const { maDonHang } = useParams<{ maDonHang: string }>();
  const [donHang, setDonHang] = useState<DonHang | null>(null);
  const [loading, setLoading] = useState(true);
  const [huyLoading, setHuyLoading] = useState(false);
  const [xacNhanLoading, setXacNhanLoading] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  const load = () => {
    if (!maDonHang) return;
    setLoading(true);
    donHangApi.chiTiet(maDonHang)
      .then(r => setDonHang(r.data.duLieu))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [maDonHang]);

  const huyDon = async () => {
    if (!donHang || !confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    setHuyLoading(true);
    try {
      await donHangApi.huyDon(donHang.maDonHang);
      toast.success('Đã hủy đơn hàng');
      load();
    } catch {
      toast.error('Không thể hủy đơn hàng');
    } finally {
      setHuyLoading(false);
    }
  };

  const xacNhanNhanHang = async () => {
    if (!donHang) return;
    setXacNhanLoading(true);
    try {
      await donHangApi.xacNhanNhanHang(donHang.maDonHang);
      toast.success('Đã xác nhận nhận hàng');
      load();
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setXacNhanLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!donHang) return <div className="text-center py-20 text-gray-500">Không tìm thấy đơn hàng</div>;

  const tt = trangThaiDonHangLabel[donHang.trangThaiDonHang] || { label: donHang.trangThaiDonHang, color: 'gray' };
  const steps = donHang.phuongThucThanhToan === 'VNPAY' ? STEPS_VNPAY : STEPS_COD;
  const currentStep = steps.indexOf(donHang.trangThaiDonHang);
  const isHuy = donHang.trangThaiDonHang === 'DA_HUY';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/don-hang-cua-toi" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Quay lại đơn hàng
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đơn hàng #{donHang.maDonHang}</h1>
          <p className="text-gray-500 text-sm mt-1">{formatDate(donHang.thoiGianTao)}</p>
        </div>
        <span className={`badge badge-${tt.color} text-sm px-3 py-1`}>{tt.label}</span>
      </div>

      {/* Progress tracker */}
      {/* {!isHuy && currentStep >= 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center">
            {steps.map((step, idx) => {
              const s = trangThaiDonHangLabel[step];
              const done = idx <= currentStep;
              const active = idx === currentStep;
              return (
                <div key={step} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${done ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'} ${active ? 'ring-2 ring-indigo-300' : ''}`}>
                      {done ? '✓' : idx + 1}
                    </div>
                    <span className={`text-xs mt-1 text-center w-16 ${active ? 'text-indigo-600 font-semibold' : done ? 'text-gray-700' : 'text-gray-400'}`}>{s?.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-1 rounded ${idx < currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )} */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left */}
        <div className="md:col-span-2 space-y-6">
          {/* Products */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Sản phẩm</h2>
            <div className="divide-y divide-gray-50">
              {donHang.danhSachChiTiet?.map(ct => {
                const donGia = ct.giaTaiThoiDiemMua || 0;
                const displayThanhTien = ct.thanhTien || donGia * ct.soLuong;
                return (
                  <div key={ct.id} className="py-4 flex items-center gap-4">
                    <img src={getImageUrl(ct.bienThe?.anhChinh)} alt={ct.bienThe?.tenSanPham}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                      onError={handleImgError} />
                    <div className="flex-1">
                      <Link to={ct.bienThe?.duongDanSanPham ? `/san-pham/${ct.bienThe.duongDanSanPham}` : '#'}
                        className="font-medium text-gray-900 text-sm hover:text-indigo-600">
                        {ct.bienThe?.tenSanPham}
                      </Link>
                      <div className="text-gray-500 text-xs mt-0.5 flex gap-2">
                        {ct.bienThe?.tenMauSac && <span>Màu: {ct.bienThe.tenMauSac}</span>}
                        {ct.bienThe?.kichThuoc && <span>Size: {ct.bienThe.kichThuoc}</span>}
                      </div>
                      <p className="text-gray-500 text-xs">SL: {ct.soLuong} × {formatCurrency(donGia)}</p>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(displayThanhTien)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status history */}
          
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Shipping */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Giao hàng
            </h2>
            <p className="text-sm font-medium text-gray-800">{donHang.tenNguoiNhan}</p>
            <p className="text-sm text-gray-500">{donHang.sdtNguoiNhan}</p>
            <p className="text-sm text-gray-500 mt-1">{donHang.diaChiGiaoHang}</p>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Tổng tiền</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{formatCurrency(donHang.tongTienHang)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span>{formatCurrency(donHang.phiVanChuyen || 0)}</span>
              </div>
              {donHang.soTienGiamGia > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(donHang.soTienGiamGia)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-2">
                <span>Thanh toán</span>
                <span className="text-indigo-600">{formatCurrency(donHang.tongTienThanhToan)}</span>
              </div>
            </div>
          
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {(
              donHang.trangThaiDonHang === 'CHO_XAC_NHAN' ||
              donHang.trangThaiDonHang === 'DA_XAC_NHAN' ||
              donHang.trangThaiDonHang === 'DANG_XU_LY'
            ) && (
              <button
                onClick={huyDon}
                disabled={huyLoading}
                className="btn-danger w-full"
              >
                {huyLoading ? 'Đang hủy...' : 'Hủy đơn hàng'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Print invoice modal */}
      {showPrint && donHang && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full h-[90vh] max-w-6xl overflow-hidden flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-b p-6 flex justify-between items-center flex-shrink-0">
              <h2 className="text-2xl font-bold">📋 In hóa đơn #{donHang.maDonHang}</h2>
              <button onClick={() => setShowPrint(false)} className="text-white hover:bg-indigo-500 hover:rounded-full p-2 transition-colors text-3xl leading-none">
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              <div className="bg-white rounded-lg p-8 shadow-lg">
                <InvoicePrint donHang={donHang} onClose={() => setShowPrint(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
