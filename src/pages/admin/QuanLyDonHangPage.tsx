import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, Eye, X } from 'lucide-react';
import { adminApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { DonHang } from '../../services/api';
import { formatCurrency, formatDate, trangThaiDonHangLabel, getImageUrl, handleImgError } from '../../utils/format';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const TRANG_THAI_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'CHO_THANH_TOAN', label: 'Chờ thanh toán' },
  { value: 'CHO_XAC_NHAN', label: 'Chờ xác nhận' },
  { value: 'DA_XAC_NHAN', label: 'Đã xác nhận' },
  { value: 'DANG_XU_LY', label: 'Đang xử lý' },
  { value: 'DANG_GIAO', label: 'Đang giao' },
  { value: 'HOAN_TAT', label: 'Hoàn tất' },
  { value: 'DA_HUY', label: 'Đã hủy' },
];

// Luồng chuyển trạng thái thuận chiều — backend quyết định key thực tế
const CHUYEN_TIEP: Record<string, string> = {
  'CHO_THANH_TOAN': 'CHO_XAC_NHAN', // COD order: initial → awaiting confirmation
  'DA_THANH_TOAN': 'CHO_XAC_NHAN', // VNPay order: paid → awaiting confirmation
  'CHO_XAC_NHAN': 'DA_XAC_NHAN',    // awaiting confirmation → admin confirmed (inventory deducted)
  'DA_XAC_NHAN': 'DANG_XU_LY',     // confirmed → processing
  'DANG_XU_LY': 'DANG_GIAO',      // processing → shipping
  'DANG_GIAO': 'HOAN_TAT',       // shipping → completed
};

// Helper to get status label and color
const getStatusDisplay = (trangThai: string): { label: string; color: string } => {
  return trangThaiDonHangLabel[trangThai] || { label: trangThai, color: 'gray' };
};

export default function QuanLyDonHangPage() {
  const [danhSach, setDanhSach] = useState<DonHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [trang, setTrang] = useState(0);
const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const [tongTrang, setTongTrang] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chiTietDonHang, setChiTietDonHang] = useState<DonHang | null>(null);
  const [modalDonHang, setModalDonHang] = useState<DonHang | null>(null);
   const [xacNhanHuy, setXacNhanHuy] = useState<DonHang | null>(null);


  // Confirm dialog state for Staff transition
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; maDonHang: string; trangThaiMoi: string; ghiChu: string }>({
    show: false, maDonHang: '', trangThaiMoi: '', ghiChu: ''
  });

  const { isAdmin } = useAuthStore();

  const load = useCallback(() => {
    setLoading(true);
    adminApi.danhSachDonHang({ 
  trangThai: trangThai || undefined, 
  tuKhoa: tuKhoa || undefined, 
  trang,
   sort
})
      .then(r => {
        setDanhSach(r.data.duLieu?.danhSach || []);
        setTongTrang(r.data.duLieu?.tongSoTrang || 0);
      })
      .finally(() => setLoading(false));
  }, [trangThai, tuKhoa, trang, sort]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (maDonHang: string) => {
    if (expanded === maDonHang) {
      setExpanded(null);
      setChiTietDonHang(null);
      return;
    }
    try {
      const r = await adminApi.chiTietDonHang(maDonHang);
      setChiTietDonHang(r.data.duLieu);
      setExpanded(maDonHang);
    } catch {
      toast.error('Không thể tải chi tiết');
    }
  };

  const xemChiTiet = async (maDonHang: string) => {
    try {
      const r = await adminApi.chiTietDonHang(maDonHang);
      setModalDonHang(r.data.duLieu);
    } catch {
      toast.error('Không thể tải chi tiết đơn hàng');
    }
  };

  const chuyenTrangThai = async (maDonHang: string, trangThaiMoi: string, ghiChu = '') => {
    // Staff phải confirm, Admin không cần
    if (!isAdmin()) {
      setConfirmDialog({ show: true, maDonHang, trangThaiMoi, ghiChu });
      return;
    }

    // Admin không cần confirm, execute ngay
    await executeChuyenTrangThai(maDonHang, trangThaiMoi, ghiChu);
  };

  const executeChuyenTrangThai = async (maDonHang: string, trangThaiMoi: string, ghiChu = '') => {
    try {
      await adminApi.capNhatTrangThaiDonHang(maDonHang, trangThaiMoi, ghiChu);
      toast.success('Đã cập nhật trạng thái');
      load();
      if (expanded === maDonHang) {
        setExpanded(null);
        setChiTietDonHang(null);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.thongBao || 'Cập nhật thất bại';
      toast.error(errorMessage);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Quản lý đơn hàng</h2>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9 text-sm" placeholder="Tìm mã đơn, người nhận..."
            value={tuKhoa} onChange={e => { setTuKhoa(e.target.value); setTrang(0); }} />
        </div>
        <select
  className="input-field w-40 text-sm"
  value={sort}
  onChange={(e) => {
    setSort(e.target.value as 'asc' | 'desc');
    setTrang(0);
  }}
>
  <option value="desc">Mới nhất</option>
  <option value="asc">Cũ nhất</option>
</select>
        <select className="input-field w-44 text-sm" value={trangThai}
          onChange={e => { setTrangThai(e.target.value); setTrang(0); }}>
          {TRANG_THAI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mã đơn</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Người nhận</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày đặt</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tổng tiền</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {danhSach.map(dh => {
                const tt = getStatusDisplay(dh.trangThaiDonHang);
                const nextState = CHUYEN_TIEP[dh.trangThaiDonHang];
                const nextLabel = nextState ? getStatusDisplay(nextState).label : null;

                return (
                  <tr key={dh.maDonHang} className="group hover:bg-gray-50">
                    {/* Mã đơn */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-gray-900">
                        #{dh.maDonHang}
                      </span>
                    </td>

                    {/* Người nhận */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {dh.tenNguoiNhan}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {dh.sdtNguoiNhan}
                      </p>
                    </td>

                    {/* Ngày đặt */}
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(dh.thoiGianTao)}
                    </td>

                    {/* Tổng tiền */}
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatCurrency(dh.tongTienThanhToan)}
                    </td>

                    {/* ✅ TRẠNG THÁI + NÚT CHUYỂN */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge badge-${tt.color} w-fit`}>
                          {tt.label}
                        </span>

                        {nextLabel && (
                          <button
                            onClick={() =>
                              chuyenTrangThai(dh.maDonHang, nextState)
                            }
                            className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors whitespace-nowrap"
                          >
                            → {nextLabel}
                          </button>
                        )}

                         {[
                          "CHO_XAC_NHAN",
                          "DA_XAC_NHAN",
                          "DANG_XU_LY",
                          "DANG_GIAO",
                        ].includes(dh.trangThaiDonHang) && (
                          <button
                            onClick={() => setXacNhanHuy(dh)}
                            className="text-xs px-3 py-1 bg-red-50 text-red-500 rounded hover:bg-red-100"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </td>

                    {/* ✅ ICON XEM CHI TIẾT */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => xemChiTiet(dh.maDonHang)}
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {danhSach.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Không có đơn hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {tongTrang > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
              <button disabled={trang === 0} onClick={() => setTrang(t => t - 1)} className="btn-secondary text-sm">Trước</button>
              <span className="px-3 py-2 text-sm text-gray-600">{trang + 1}/{tongTrang}</span>
              <button disabled={trang >= tongTrang - 1} onClick={() => setTrang(t => t + 1)} className="btn-secondary text-sm">Sau</button>
            </div>
          )}
        </div>
      )}

      {/* Modal Chi Tiết Đơn Hàng - Popup ở giữa màn hình */}
      {modalDonHang && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center border-b">
              <div>
                <h2 className="text-lg font-bold text-white">Chi tiết đơn hàng</h2>
                <p className="text-sm text-indigo-100">#{modalDonHang.maDonHang}</p>
              </div>
              <button
                onClick={() => setModalDonHang(null)}
                className="p-1 hover:bg-indigo-500 rounded transition-colors text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Thông tin khách hàng */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">👤 Thông tin khách hàng</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p><span className="font-medium text-gray-700">Tên:</span> <span className="text-gray-900">{modalDonHang.tenNguoiNhan}</span></p>
                  <p><span className="font-medium text-gray-700">SĐT:</span> <span className="text-gray-900">{modalDonHang.sdtNguoiNhan}</span></p>
                  <p><span className="font-medium text-gray-700">Địa chỉ:</span> <span className="text-gray-900">{modalDonHang.diaChiGiaoHang}</span></p>
                  <p><span className="font-medium text-gray-700">Ngày đặt:</span> <span className="text-gray-900">{formatDate(modalDonHang.thoiGianTao)}</span></p>
                </div>
              </div>

              {/* Thông tin thanh toán */}
              <div className="grid grid-cols-2 gap-4">
                {/* Payment Status */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">💳 Thanh toán</h3>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 space-y-2 text-sm border border-blue-200">
                    <p><span className="font-medium text-gray-700">Phương thức:</span> <span className="text-gray-900 font-semibold">{modalDonHang.phuongThucThanhToan}</span></p>
                    <p>
                      <span className="font-medium text-gray-700">Tình trạng:</span>
                      <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${modalDonHang.daThanhToan ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
                        {modalDonHang.daThanhToan ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Order Processing Status */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">📦 Xử lý</h3>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 space-y-2 text-sm border border-indigo-200">
                    <p>
                      <span className="font-medium text-gray-700">Trạng thái:</span>
                    </p>
                    <p>
                      {(() => {
                        const tt = trangThaiDonHangLabel[modalDonHang.trangThaiDonHang] || { label: modalDonHang.trangThaiDonHang, color: 'gray' };
                        return <span className={`badge badge-${tt.color} inline-block px-3 py-1 rounded-full font-bold`}>{tt.label}</span>;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              {modalDonHang.ghiChu && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">📝 Ghi chú</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
                    {modalDonHang.ghiChu}
                  </div>
                </div>
              )}

              {/* Danh sách sản phẩm */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">📦 Sản phẩm</h3>
                <div className="space-y-3">
                  {modalDonHang.danhSachChiTiet?.map(ct => {
                    const donGia = ct.giaTaiThoiDiemMua || 0;
                    const displayThanhTien = ct.thanhTien || donGia * ct.soLuong;
                    return (
                      <div key={ct.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={getImageUrl(ct.bienThe?.anhChinh)}
                          alt=""
                          className="w-16 h-16 rounded object-cover bg-white border border-gray-200"
                          onError={handleImgError}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{ct.bienThe?.tenSanPham}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {[ct.bienThe?.tenMauSac, ct.bienThe?.kichThuoc].filter(Boolean).join(' / ')}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatCurrency(donGia)} × {ct.soLuong}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(displayThanhTien)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tóm tắt chi phí */}
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="space-y-2 text-sm">

                  {/* Tiền sản phẩm */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiền sản phẩm:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(modalDonHang.tongTienHang || 0)}
                    </span>
                  </div>

                  {/* Phí ship */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(modalDonHang.phiVanChuyen || 0)}
                    </span>
                  </div>

                  {/* Giảm giá */}
                  {modalDonHang.soTienGiamGia > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá:</span>
                      <span>-{formatCurrency(modalDonHang.soTienGiamGia)}</span>
                    </div>
                  )}

                  {/* Tổng cộng */}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Tổng cộng:</span>
                    <span className="text-indigo-600">
                      {formatCurrency(modalDonHang.tongTienThanhToan || 0)}
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* Footer - Action Buttons */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setModalDonHang(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Confirm Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Xác nhận chuyển trạng thái</h3>
            <p className="text-gray-600 mb-2">Bạn có chắc muốn chuyển trạng thái đơn hàng này?</p>
            <p className="text-sm text-gray-500 mb-6">Đơn: <span className="font-medium">{confirmDialog.maDonHang}</span> → <span className="font-medium">{getStatusDisplay(confirmDialog.trangThaiMoi).label}</span></p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog({ show: false, maDonHang: '', trangThaiMoi: '', ghiChu: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Hủy
              </button>
              <button
                onClick={async () => {
                  await executeChuyenTrangThai(confirmDialog.maDonHang, confirmDialog.trangThaiMoi, confirmDialog.ghiChu);
                  setConfirmDialog({ show: false, maDonHang: '', trangThaiMoi: '', ghiChu: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HỦY */}
      {xacNhanHuy && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-xl p-6 w-96">

            <h3 className="text-lg font-semibold mb-3">
              Xác nhận hủy đơn
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc muốn hủy đơn hàng #
              {xacNhanHuy.maDonHang} ?
            </p>

            <div className="flex justify-end gap-3">

              <button
                onClick={() => setXacNhanHuy(null)}
                className="px-4 py-2 text-sm border rounded"
              >
                Quay lại
              </button>

              <button
  onClick={async () => {
    try {

      await adminApi.huyDonHang(
        xacNhanHuy.maDonHang
      );

      toast.success("Đã hủy đơn hàng");

      load();

    } catch (err: any) {

      toast.error(
        err?.response?.data?.thongBao || "Hủy đơn thất bại"
      );

    }

    setXacNhanHuy(null);
  }}
  className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
>
  Xác nhận hủy
</button>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}