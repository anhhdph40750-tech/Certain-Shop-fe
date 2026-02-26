import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { adminApi } from '../../services/api';
import type { DonHang } from '../../services/api';
import { formatCurrency, formatDate, trangThaiDonHangLabel, getImageUrl, handleImgError } from '../../utils/format';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const TRANG_THAI_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'CHO_THANH_TOAN', label: 'Chờ thanh toán' },
  { value: 'CHO_XAC_NHAN',   label: 'Chờ xác nhận' },
  { value: 'DA_XAC_NHAN',    label: 'Đã xác nhận' },
  { value: 'DANG_XU_LY',     label: 'Đang xử lý' },
  { value: 'DANG_GIAO',      label: 'Đang giao' },
  { value: 'DA_GIAO',        label: 'Đã giao' },
  { value: 'HOAN_TAT',       label: 'Hoàn tất' },
  { value: 'HOAN_THANH',     label: 'Hoàn thành' },
  { value: 'DA_HUY',         label: 'Đã hủy' },
];

// Luồng chuyển trạng thái thuận chiều — backend quyết định key thực tế
const CHUYEN_TIEP: Record<string, string> = {
  'CHO_XAC_NHAN': 'DA_XAC_NHAN',
  'DA_XAC_NHAN':  'DANG_XU_LY',
  'DANG_XU_LY':   'DANG_GIAO',
  'DANG_GIAO':    'DA_GIAO',
  'DA_GIAO':      'HOAN_TAT',
};

export default function QuanLyDonHangPage() {
  const [danhSach, setDanhSach] = useState<DonHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [trang, setTrang] = useState(0);
  const [tongTrang, setTongTrang] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chiTietDonHang, setChiTietDonHang] = useState<DonHang | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.danhSachDonHang({ trangThai: trangThai || undefined, tuKhoa: tuKhoa || undefined, trang })
      .then(r => {
        setDanhSach(r.data.duLieu?.danhSach || []);
        setTongTrang(r.data.duLieu?.tongSoTrang || 0);
      })
      .finally(() => setLoading(false));
  }, [trangThai, tuKhoa, trang]);

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

  const chuyenTrangThai = async (maDonHang: string, trangThaiMoi: string, ghiChu = '') => {
    try {
      await adminApi.capNhatTrangThaiDonHang(maDonHang, trangThaiMoi, ghiChu);
      toast.success('Đã cập nhật trạng thái');
      load();
      if (expanded === maDonHang) {
        setExpanded(null);
        setChiTietDonHang(null);
      }
    } catch {
      toast.error('Cập nhật thất bại');
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
                const tt = trangThaiDonHangLabel[dh.trangThaiDonHang] || { label: dh.trangThaiDonHang, color: 'gray' };
                const nextState = CHUYEN_TIEP[dh.trangThaiDonHang];
                const nextLabel = nextState ? trangThaiDonHangLabel[nextState]?.label : null;
                const isExpanded = expanded === dh.maDonHang;
                return (
                  <tr key={dh.maDonHang} className="group hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-gray-900">#{dh.maDonHang}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{dh.tenNguoiNhan}</p>
                      <p className="text-gray-400 text-xs">{dh.sdtNguoiNhan}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(dh.thoiGianTao)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(dh.tongTienThanhToan)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge badge-${tt.color} w-fit`}>{tt.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {nextLabel && (
                          <button
                            onClick={() => chuyenTrangThai(dh.maDonHang, nextState)}
                            className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors whitespace-nowrap">
                            → {nextLabel}
                          </button>
                        )}
                        {dh.trangThaiDonHang === 'CHO_XAC_NHAN' && (
                          <button
                            onClick={() => chuyenTrangThai(dh.maDonHang, 'DA_HUY', 'Admin hủy đơn')}
                            className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors">
                            Hủy
                          </button>
                        )}
                        <button onClick={() => toggleExpand(dh.maDonHang)}
                          className="p-1 text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Expanded detail rows */}
              {danhSach.map(dh => {
                const isExpanded = expanded === dh.maDonHang;
                if (!isExpanded || !chiTietDonHang) return null;
                return (
                  <tr key={`detail-${dh.maDonHang}`}>
                    <td colSpan={6} className="p-0">
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                        <div className="text-xs text-gray-600 space-y-1 mb-3">
                          <p><span className="font-medium">Địa chỉ: </span>{chiTietDonHang.diaChiGiaoHang}</p>
                          <p><span className="font-medium">Ghi chú: </span>{chiTietDonHang.ghiChu || '—'}</p>
                          <p><span className="font-medium">Thanh toán: </span>{chiTietDonHang.phuongThucThanhToan} · {chiTietDonHang.daThanhToan ? '✓ Đã TT' : 'Chưa TT'}</p>
                        </div>
                        <div className="space-y-2">
                          {chiTietDonHang.danhSachChiTiet?.map(ct => (
                            <div key={ct.id} className="flex items-center gap-3 text-xs">
                              <img src={getImageUrl(ct.bienThe?.anhChinh)} alt=""
                                className="w-10 h-10 rounded object-cover bg-white border"
                                onError={handleImgError} />
                              <span className="font-medium text-gray-800 flex-1">{ct.bienThe?.tenSanPham}</span>
                              <span className="text-gray-500">
                                {[ct.bienThe?.tenMauSac, ct.bienThe?.kichThuoc].filter(Boolean).join(' / ')}
                              </span>
                              <span className="text-gray-500">×{ct.soLuong}</span>
                              <span className="font-semibold text-gray-700">{formatCurrency(ct.thanhTien)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {danhSach.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Không có đơn hàng</td></tr>
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
    </div>
  );
}
