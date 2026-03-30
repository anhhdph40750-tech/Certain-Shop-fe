import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Check, X, Percent, BadgeDollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

import { voucherApi } from '../../services/api';
import type { Voucher } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

type LoaiGiam = 'PERCENT' | 'FIXED';

interface VoucherFormState {
  maVoucher: string;
  moTa: string;
  trangThai: boolean;
  ngayBatDau: string;
  ngayKetThuc: string;
  giaTriToiThieu: string;
  loaiGiam: LoaiGiam;
  giaTriGiam: string;
  giaTriGiamToiDa: string;
  soLuongToiDa: string;
}

const EMPTY_FORM: VoucherFormState = {
  maVoucher: '',
  moTa: '',
  trangThai: true,
  ngayBatDau: '',
  ngayKetThuc: '',
  giaTriToiThieu: '',
  loaiGiam: 'PERCENT',
  giaTriGiam: '',
  giaTriGiamToiDa: '',
  soLuongToiDa: '',
};

export default function QuanLyVoucherPage() {
  const [list, setList] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [form, setForm] = useState<VoucherFormState>({ ...EMPTY_FORM });
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const load = useCallback(() => {
    setLoading(true);
    voucherApi.danhSachTatCa()
      .then(r => setList(r.data.duLieu || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (v: Voucher) => {
    setEditing(v);
    setForm({
      maVoucher: v.maVoucher,
      moTa: v.moTa || '',
      trangThai: v.trangThai,
      ngayBatDau: v.ngayBatDau?.slice(0, 16) || '',
      ngayKetThuc: v.ngayKetThuc?.slice(0, 16) || '',
      giaTriToiThieu: v.giaTriToiThieu != null ? String(v.giaTriToiThieu) : '',
      loaiGiam: (v.loaiGiam as LoaiGiam) || 'PERCENT',
      giaTriGiam: String(v.giaTriGiam ?? ''),
      giaTriGiamToiDa: String(v.giaTriGiamToiDa ?? ''),
      soLuongToiDa: v.soLuongToiDa != null ? String(v.soLuongToiDa) : '',
    });
    setShowForm(true);
  };

  const parseNumber = (value: string) => {
    if (!value.trim()) return null;
    const n = Number(value);
    return Number.isNaN(n) || !Number.isFinite(n) ? null : n;
  };

  const save = async () => {
    const maVoucherTrim = form.maVoucher.trim();
    if (!maVoucherTrim) {
      toast.error('Nhập mã voucher');
      return;
    }
    if (maVoucherTrim.length > 50) {
      toast.error('Mã voucher không được vượt quá 50 ký tự');
      return;
    }
    if (!form.ngayBatDau || !form.ngayKetThuc) {
      toast.error('Chọn ngày bắt đầu và kết thúc');
      return;
    }
    const ngayBatDauTs = new Date(form.ngayBatDau).getTime();
    const ngayKetThucTs = new Date(form.ngayKetThuc).getTime();
    if (!Number.isFinite(ngayBatDauTs) || !Number.isFinite(ngayKetThucTs) || ngayBatDauTs >= ngayKetThucTs) {
      toast.error('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }
    if (ngayKetThucTs <= Date.now()) {
      toast.error('Ngày kết thúc không được ở quá khứ');
      return;
    }

    const giaTriToiThieu = parseNumber(form.giaTriToiThieu);
    const giaTriGiam = parseNumber(form.giaTriGiam);
    const giaTriGiamToiDa = parseNumber(form.giaTriGiamToiDa);
    const soLuongToiDa = parseNumber(form.soLuongToiDa);

    // Validate inputs that are provided but not parseable/finite
    if (form.giaTriToiThieu.trim() && giaTriToiThieu == null) {
      toast.error('Giá trị đơn hàng tối thiểu không hợp lệ');
      return;
    }
    if (form.loaiGiam === 'PERCENT' && form.giaTriGiam.trim() && giaTriGiam == null) {
      toast.error('Giá trị giảm không hợp lệ');
      return;
    }
    if (form.giaTriGiamToiDa.trim() && giaTriGiamToiDa == null) {
      toast.error('Giá trị giảm tối đa (đ) không hợp lệ');
      return;
    }
    if (form.soLuongToiDa.trim() && soLuongToiDa == null) {
      toast.error('Số lần sử dụng tối đa không hợp lệ');
      return;
    }

    // Disallow negative values
    if (giaTriToiThieu != null && giaTriToiThieu < 0) {
      toast.error('Giá trị đơn hàng tối thiểu không được âm');
      return;
    }
    if (soLuongToiDa != null && soLuongToiDa < 0) {
      toast.error('Số lần sử dụng tối đa không được âm');
      return;
    }
    if (soLuongToiDa != null && !Number.isInteger(soLuongToiDa)) {
      toast.error('Số lần sử dụng tối đa phải là số nguyên');
      return;
    }
    if (form.loaiGiam === 'PERCENT' && giaTriGiam != null && giaTriGiam < 0) {
      toast.error('Giá trị giảm không được âm');
      return;
    }
    if (giaTriGiamToiDa != null && giaTriGiamToiDa < 0) {
      toast.error('Giá trị giảm tối đa không được âm');
      return;
    }

    // Validate by type + fix mapping for FIXED
    let giaTriGiamFinal: number | null = giaTriGiam;
    let giaTriGiamToiDaFinal: number | null = giaTriGiamToiDa;
    if (form.loaiGiam === 'PERCENT') {
      if (giaTriGiamFinal == null) {
        toast.error('Nhập giá trị giảm (%)');
        return;
      }
      if (giaTriGiamToiDaFinal == null) {
        toast.error('Nhập giá trị giảm tối đa (đ)');
        return;
      }
      if (giaTriGiamToiDaFinal <= 0) {
        toast.error('Giá trị giảm tối đa (đ) phải lớn hơn 0');
        return;
      }
      if (giaTriGiamFinal <= 0 || giaTriGiamFinal > 100) {
        toast.error('Giá trị giảm (%) phải từ 1 đến 100');
        return;
      }
    } else {
      // FIXED: lấy số tiền cố định từ ô "Giá trị giảm tối đa (đ)"
      if (giaTriGiamToiDaFinal == null) {
        toast.error('Nhập giá trị giảm tối đa (đ)');
        return;
      }
      if (giaTriGiamToiDaFinal <= 0) {
        toast.error('Giá trị giảm (đ) phải lớn hơn 0');
        return;
      }
      giaTriGiamFinal = giaTriGiamToiDaFinal;
    }

    const payload = {
      maVoucher: maVoucherTrim,
      moTa: form.moTa.trim(),
      trangThai: form.trangThai,
      ngayBatDau: form.ngayBatDau,
      ngayKetThuc: form.ngayKetThuc,
      giaTriToiThieu,
      loaiGiam: form.loaiGiam,
      giaTriGiam: giaTriGiamFinal ?? 0,
      giaTriGiamToiDa: giaTriGiamToiDaFinal ?? 0,
      soLuongToiDa,
    };

    try {
      if (editing) {
        await voucherApi.capNhatVoucher(editing.id, payload);
        toast.success('Đã cập nhật voucher');
      } else {
        await voucherApi.taoVoucher(payload);
        toast.success('Đã tạo voucher mới');
      }
      setShowForm(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { thongBao?: string; message?: string } } })?.response?.data;
      toast.error((msg as any)?.thongBao || (msg as any)?.message || 'Có lỗi xảy ra');
    }
  };

  const toggleTrangThai = async (v: Voucher) => {
    setConfirmModal({
      isOpen: true,
      title: v.trangThai ? 'Tạm dừng voucher' : 'Kích hoạt voucher',
      message: `Bạn có chắc muốn ${v.trangThai ? 'tạm dừng' : 'kích hoạt'} voucher này?`,
      onConfirm: async () => {
        try {
          const payload = {
            maVoucher: v.maVoucher,
            moTa: v.moTa || '',
            trangThai: !v.trangThai,
            ngayBatDau: v.ngayBatDau?.slice(0, 16) || '',
            ngayKetThuc: v.ngayKetThuc?.slice(0, 16) || '',
            giaTriToiThieu: v.giaTriToiThieu ?? null,
            loaiGiam: v.loaiGiam,
            giaTriGiam: v.giaTriGiam,
            giaTriGiamToiDa: v.giaTriGiamToiDa,
            soLuongToiDa: v.soLuongToiDa ?? null,
          };
          await voucherApi.capNhatVoucher(v.id, payload);
          toast.success(`Đã ${!v.trangThai ? 'kích hoạt' : 'tạm dừng'} voucher`);
          load();
        } catch {
          toast.error('Không thể cập nhật trạng thái');
        }
      }
    });
  };

  const xoa = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa voucher',
      message: 'Bạn có chắc chắn muốn xóa (vô hiệu hóa) voucher này?',
      onConfirm: async () => {
        try {
          await voucherApi.xoaVoucher(id);
          toast.success('Đã xóa voucher');
          load();
        } catch {
          toast.error('Không thể xóa voucher');
        }
      }
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quản lý voucher</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tạo và quản lý mã giảm giá áp dụng cho đơn hàng.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm voucher
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
          <h3 className="font-semibold text-gray-900 mb-4">
            {editing ? 'Sửa voucher' : 'Thêm voucher mới'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã voucher *
              </label>
              <input
                className="input-field uppercase"
                placeholder="VD: SALE10"
                value={form.maVoucher}
                onChange={e => setForm(f => ({ ...f, maVoucher: e.target.value.toUpperCase() }))}
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.trangThai}
                  onChange={e => setForm(f => ({ ...f, trangThai: e.target.checked }))}
                />
                Đang hoạt động
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <input
                className="input-field"
                placeholder="Ví dụ: Giảm 10% tối đa 50k cho đơn từ 300k"
                value={form.moTa}
                onChange={e => setForm(f => ({ ...f, moTa: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu *
              </label>
              <input
                type="datetime-local"
                className="input-field"
                value={form.ngayBatDau}
                onChange={e => setForm(f => ({ ...f, ngayBatDau: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc *
              </label>
              <input
                type="datetime-local"
                className="input-field"
                value={form.ngayKetThuc}
                onChange={e => setForm(f => ({ ...f, ngayKetThuc: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị đơn hàng tối thiểu (đ)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="Ví dụ: 300000"
                value={form.giaTriToiThieu}
                onChange={e => setForm(f => ({ ...f, giaTriToiThieu: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số lần sử dụng tối đa
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="Để trống nếu không giới hạn"
                value={form.soLuongToiDa}
                onChange={e => setForm(f => ({ ...f, soLuongToiDa: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại giảm giá *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, loaiGiam: 'PERCENT' }))}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                    form.loaiGiam === 'PERCENT'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Percent className="w-4 h-4" />
                  % phần trăm
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, loaiGiam: 'FIXED' }))}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                    form.loaiGiam === 'FIXED'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <BadgeDollarSign className="w-4 h-4" />
                  Số tiền cố định
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị giảm {form.loaiGiam === 'PERCENT' ? '(%)' : '(đ)'} *
              </label>
              <input
                type="number"
                className="input-field"
                placeholder={form.loaiGiam === 'PERCENT' ? 'Ví dụ: 10' : 'Ví dụ: 50000'}
                value={form.loaiGiam === 'FIXED' ? form.giaTriGiamToiDa : form.giaTriGiam}
                disabled={form.loaiGiam === 'FIXED'}
                onChange={e => setForm(f => ({ ...f, giaTriGiam: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị giảm tối đa (đ) *
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="Ví dụ: 50000"
                value={form.giaTriGiamToiDa}
                onChange={e => setForm(f => ({ ...f, giaTriGiamToiDa: e.target.value }))}
              />
            </div>
            {editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đã sử dụng
                </label>
                <div className="input-field bg-gray-50">
                  {editing.soLuongSuDung ?? 0} / {editing.soLuongToiDa ?? '∞'}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-5">
            <button
              onClick={save}
              className="btn-primary text-sm flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              Lưu
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn-secondary text-sm flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Mã</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Mô tả</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Thời gian</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Điều kiện</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Giảm</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Sử dụng</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
              <th className="px-4 py-3 w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map(v => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-semibold text-gray-900">
                  {v.maVoucher}
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-xs">
                  {v.moTa || '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  <div>Bắt đầu: {v.ngayBatDau?.replace('T', ' ')}</div>
                  <div>Kết thúc: {v.ngayKetThuc?.replace('T', ' ')}</div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  <div>
                    ĐH tối thiểu:{' '}
                    <span className="font-medium">
                      {v.giaTriToiThieu != null ? v.giaTriToiThieu.toLocaleString('vi-VN') : '—'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  <div>
                    Loại:{' '}
                    <span className="font-medium">
                      {v.loaiGiam === 'PERCENT' ? 'Phần trăm' : 'Cố định'}
                    </span>
                  </div>
                  <div>
                    Giá trị:{' '}
                    <span className="font-medium">
                      {v.loaiGiam === 'PERCENT'
                        ? `${v.giaTriGiam}%`
                        : `${v.giaTriGiam.toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>
                  <div>
                    Tối đa:{' '}
                    <span className="font-medium">
                      {v.giaTriGiamToiDa.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {v.soLuongSuDung ?? 0} / {v.soLuongToiDa ?? '∞'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 flex items-center gap-1.5 rounded-full text-xs font-medium border ${
                        new Date(v.ngayKetThuc).getTime() < Date.now()
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : v.soLuongToiDa != null && v.soLuongSuDung >= v.soLuongToiDa
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : !v.trangThai
                          ? 'bg-gray-50 text-gray-600 border-gray-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        new Date(v.ngayKetThuc).getTime() < Date.now() ? 'bg-red-500' :
                        v.soLuongToiDa != null && v.soLuongSuDung >= v.soLuongToiDa ? 'bg-amber-500' :
                        !v.trangThai ? 'bg-gray-400' : 'bg-emerald-500'
                      }`}></span>
                      {new Date(v.ngayKetThuc).getTime() < Date.now()
                        ? 'Hết hạn'
                        : v.soLuongToiDa != null && v.soLuongSuDung >= v.soLuongToiDa
                        ? 'Đã dùng hết'
                        : v.trangThai
                        ? 'Đang hoạt động'
                        : 'Ngừng hoạt động'}
                    </span>
                    <button
                      onClick={() => toggleTrangThai(v)}
                      disabled={new Date(v.ngayKetThuc).getTime() < Date.now() || (v.soLuongToiDa != null && v.soLuongSuDung >= v.soLuongToiDa)}
                      className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors border ${
                        new Date(v.ngayKetThuc).getTime() < Date.now() || (v.soLuongToiDa != null && v.soLuongSuDung >= v.soLuongToiDa)
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-transparent'
                          : v.trangThai 
                            ? 'text-red-600 border-transparent hover:bg-red-50 hover:border-red-200' 
                            : 'text-indigo-600 border-transparent hover:bg-indigo-50 hover:border-indigo-200'
                      }`}
                      title={v.trangThai ? 'Tạm dừng voucher' : 'Kích hoạt voucher'}
                    >
                      {v.trangThai ? 'Tạm dừng' : 'Kích hoạt'}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => openEdit(v)}
                      className="p-1.5 text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => xoa(v.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-10 text-gray-400 text-sm"
                >
                  Chưa có voucher nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900">{confirmModal.title}</h3>
              <p className="text-sm text-gray-500 mt-2">{confirmModal.message}</p>
            </div>
            <div className="flex bg-gray-50 p-3 gap-2 justify-end">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

