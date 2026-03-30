import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, UserCheck, UserX, Trash2, Filter, RefreshCw, UserPlus, Download, Shield, Pencil } from 'lucide-react';
import { adminApi } from '../../services/api';
import type { NguoiDungAdmin } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';

type Mode = 'NHAN_VIEN' | 'KHACH_HANG';

function getDiaChiDaiDien(u: NguoiDungAdmin): string {
  if (!u.danhSachDiaChi || u.danhSachDiaChi.length === 0) return '—';
  const mac = u.danhSachDiaChi.find(d => d.laMacDinh) ?? u.danhSachDiaChi[0];
  const parts = [mac.diaChiDong1, mac.phuongXa, mac.quanHuyen, mac.tinhThanh].filter(Boolean);
  return parts.join(', ') || '—';
}

interface Props {
  defaultMode?: Mode;
}

export default function QuanLyNguoiDungPage({ defaultMode = 'NHAN_VIEN' }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuthStore();

  // Đồng bộ mode với URL: /quan-ly/khach-hang → KHACH_HANG, /quan-ly/nguoi-dung → NHAN_VIEN
  const modeFromUrl: Mode = location.pathname.includes('khach-hang') ? 'KHACH_HANG' : defaultMode;
  const [mode, setMode] = useState<Mode>(modeFromUrl);

  useEffect(() => {
    setMode(modeFromUrl);
  }, [modeFromUrl]);
  const [danhSach, setDanhSach] = useState<NguoiDungAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [tuKhoa, setTuKhoa] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('');
  const [trang, setTrang] = useState(0);
  const [tongTrang, setTongTrang] = useState(0);
  const [tongSo, setTongSo] = useState(0);

  // Xác nhận xóa
  const [xoaId, setXoaId] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi.danhSachNguoiDung({
      tuKhoa: tuKhoa || undefined,
      trang,
      tenVaiTro: mode,
    })
      .then(r => {
        if (cancelled) return;
        let ds: NguoiDungAdmin[] = r.data.duLieu?.nguoiDung || [];
        if (filterTrangThai === 'HOAT_DONG') ds = ds.filter(u => u.dangHoatDong && u.trangThai !== 'DA_XOA');
        else if (filterTrangThai === 'BI_KHOA') ds = ds.filter(u => !u.dangHoatDong);
        ds = ds.filter(u => u.trangThai !== 'DA_XOA');
        setDanhSach(ds);
        setTongTrang(r.data.duLieu?.tongTrang || 0);
        setTongSo(r.data.duLieu?.tongSo || 0);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tuKhoa, trang, mode, filterTrangThai, tick]);

  const resetFilter = () => {
    setTuKhoa('');
    setFilterTrangThai('');
    setTrang(0);
  };

  const toggleActive = async (u: NguoiDungAdmin) => {
    try {
      await adminApi.doiTrangThaiNguoiDung(u.id, !u.dangHoatDong);
      toast.success(u.dangHoatDong ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      reload();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const doiVaiTro = async (id: number, vaiTroId: number) => {
    try {
      await adminApi.doiVaiTroNguoiDung(id, vaiTroId);
      toast.success('Đã đổi vai trò');
      reload();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleXoa = async (id: number) => {
    try {
      await adminApi.xoaNguoiDung(id);
      toast.success('Đã xóa tài khoản');
      setXoaId(null);
      reload();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { thongBao?: string } } })?.response?.data?.thongBao;
      toast.error(msg || 'Không thể xóa tài khoản này');
      setXoaId(null);
    }
  };

  const xuatExcel = () => {
    // Xuất CSV đơn giản từ dữ liệu hiện tại
    const header = mode === 'KHACH_HANG'
      ? ['STT', 'Mã khách', 'Tên khách hàng', 'Email', 'SĐT', 'Địa chỉ', 'Trạng thái']
      : ['STT', 'Mã nhân viên', 'Tên nhân viên', 'Email', 'SĐT', 'Địa chỉ', 'Trạng thái'];
    const rows = danhSach.map((u, i) => [
      i + 1,
      u.maNguoiDung || '',
      u.hoTen || '',
      u.email || '',
      u.soDienThoai || '',
      getDiaChiDaiDien(u),
      u.dangHoatDong ? 'Hoạt động' : 'Bị khóa',
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mode === 'KHACH_HANG' ? 'khach-hang' : 'nhan-vien'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isKH = mode === 'KHACH_HANG';
  const tenMode = isKH ? 'Khách hàng' : 'Nhân viên';

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-gray-900">Quản lý {tenMode}</h2>
        <span className="text-sm text-gray-500">
          Tổng số {tenMode.toLowerCase()}: <strong>{tongSo}</strong>
        </span>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5">
        {(['NHAN_VIEN', 'KHACH_HANG'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => {
              setTrang(0);
              // Điều hướng URL để sidebar cập nhật active state
              navigate(m === 'KHACH_HANG' ? '/quan-ly/khach-hang' : '/quan-ly/nguoi-dung');
            }}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {m === 'NHAN_VIEN' ? 'Nhân viên' : 'Khách hàng'}
          </button>
        ))}
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-medium text-sm">
          <Filter className="w-4 h-4" />
          Bộ Lọc {tenMode}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder={`Tìm theo tên, mã ${tenMode.toLowerCase()} hoặc email`}
                value={tuKhoa}
                onChange={e => { setTuKhoa(e.target.value); setTrang(0); }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái</label>
            <select
              title="Lọc theo trạng thái"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={filterTrangThai}
              onChange={e => { setFilterTrangThai(e.target.value); setTrang(0); }}
            >
              <option value="">Tất cả</option>
              <option value="HOAT_DONG">Hoạt động</option>
              <option value="BI_KHOA">Bị khóa</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={resetFilter} className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            Đặt lại bộ lọc
          </button>
          <button onClick={xuatExcel} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Xuất excel
          </button>
          {isAdmin() && mode === 'NHAN_VIEN' && (
            <button
              onClick={() => navigate('/quan-ly/nguoi-dung/them-nhan-vien')}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors ml-auto"
            >
              <UserPlus className="w-4 h-4" />
              Thêm nhân viên
            </button>
          )}
          {isAdmin() && mode === 'KHACH_HANG' && (
            <button
              onClick={() => navigate('/quan-ly/nguoi-dung/them-khach-hang')}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors ml-auto"
            >
              <UserPlus className="w-4 h-4" />
              Thêm khách hàng
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-50 border-b border-orange-100">
                <tr>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700 w-12">STT</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    {isKH ? 'Mã khách' : 'Mã NV'}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    {isKH ? 'Tên khách hàng' : 'Tên nhân viên'}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">SĐT</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Địa chỉ</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                  {isAdmin() && (
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">Hành động</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {danhSach.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center text-gray-500">{trang * 20 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-orange-600 text-xs bg-orange-50 px-2 py-0.5 rounded">
                        {u.maNguoiDung || `ND${String(u.id).padStart(5, '0')}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          {u.anhDaiDien ? (
                            <img src={u.anhDaiDien} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <span className="text-indigo-600 font-semibold text-xs">{u.hoTen?.[0] || '?'}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{u.hoTen}</p>
                          <p className="text-xs text-gray-400">@{u.tenDangNhap}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{u.soDienThoai || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate" title={getDiaChiDaiDien(u)}>
                      {getDiaChiDaiDien(u)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.dangHoatDong ? (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Hoạt động</span>
                      ) : (
                        <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Bị khóa</span>
                      )}
                    </td>
                    {isAdmin() && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {/* Toggle khoá */}
                          <button
                            onClick={() => toggleActive(u)}
                            title={u.dangHoatDong ? 'Khóa' : 'Mở khóa'}
                            className={`relative w-10 h-5 rounded-full transition-colors ${u.dangHoatDong ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${u.dangHoatDong ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>                          {/* Sửa thông tin */}
                          {u.id !== 1 && (
                            <button
                              onClick={() => navigate(`/quan-ly/nguoi-dung/sua/${u.id}`)}
                              title="Sửa thông tin"
                              className="p-1.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}                          {/* Thăng / hạ vai trò */}
                          {mode === 'KHACH_HANG' && (
                            <button
                              onClick={() => doiVaiTro(u.id, 2)}
                              title="Thăng lên Nhân viên"
                              className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {mode === 'NHAN_VIEN' && u.id !== 1 && (
                            <button
                              onClick={() => doiVaiTro(u.id, 3)}
                              title="Hạ xuống Khách hàng"
                              className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors text-xs font-medium"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Xóa */}
                          {u.id !== 1 && (
                            <button
                              onClick={() => setXoaId(u.id)}
                              title="Xóa tài khoản"
                              className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Khóa/mở icon fallback */}
                          {!u.dangHoatDong && <UserCheck className="hidden" />}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {danhSach.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin() ? 8 : 7} className="text-center py-12 text-gray-400">
                      Không có {tenMode.toLowerCase()} nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {tongTrang > 1 && (
            <div className="flex items-center justify-center gap-1.5 p-4 border-t border-gray-100 text-sm">
              <button
                disabled={trang === 0}
                onClick={() => setTrang(t => t - 1)}
                className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &lt; Prev
              </button>
              {Array.from({ length: tongTrang }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setTrang(i)}
                  className={`w-8 h-8 rounded flex items-center justify-center font-medium transition-colors ${
                    i === trang ? 'bg-orange-500 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={trang >= tongTrang - 1}
                onClick={() => setTrang(t => t + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next &gt;
              </button>
              <span className="ml-2 text-gray-500">Trang {trang + 1}/{tongTrang}</span>
            </div>
          )}
        </div>
      )}

      {/* Dialog xác nhận xóa */}
      {xoaId !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-6">
              Tài khoản sẽ bị vô hiệu hóa và không thể đăng nhập. Dữ liệu đơn hàng vẫn được giữ lại.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setXoaId(null)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={() => handleXoa(xoaId)} className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

