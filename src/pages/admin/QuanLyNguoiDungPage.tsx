import { useState, useEffect, useCallback } from 'react';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';
import { adminApi } from '../../services/api';
import type { NguoiDungAdmin } from '../../services/api';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';

export default function QuanLyNguoiDungPage() {
  const [danhSach, setDanhSach] = useState<NguoiDungAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trang, setTrang] = useState(0);
  const [tongTrang, setTongTrang] = useState(0);
  const [tabVaiTro, setTabVaiTro] = useState<string>('');
  const { isAdmin } = useAuthStore();

  const load = useCallback(() => {
    setLoading(true);
    adminApi.danhSachNguoiDung({ tuKhoa: tuKhoa || undefined, trang, tenVaiTro: tabVaiTro || undefined })
      .then(r => {
        setDanhSach(r.data.duLieu?.nguoiDung || []);
        setTongTrang(r.data.duLieu?.tongTrang || 0);
      })
      .finally(() => setLoading(false));
  }, [tuKhoa, trang, tabVaiTro]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (u: NguoiDungAdmin) => {
    try {
      await adminApi.doiTrangThaiNguoiDung(u.id, !u.dangHoatDong);
      toast.success(u.dangHoatDong ? 'Đã khóa tài khoản' : 'Đã mở khóa');
      load();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const doiVaiTro = async (id: number, vaiTroId: number) => {
    try {
      await adminApi.doiVaiTroNguoiDung(id, vaiTroId);
      toast.success('Đã đổi vai trò');
      load();
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const vaiTroLabel = (vt: NguoiDungAdmin['vaiTro']) => {
    const ten = vt?.tenVaiTro || '';
    if (ten === 'ADMIN') return <span className="badge badge-red text-xs">Admin</span>;
    if (ten === 'NHAN_VIEN') return <span className="badge badge-blue text-xs">Nhân viên</span>;
    if (ten === 'KHACH_HANG') return <span className="badge badge-gray text-xs">Khách hàng</span>;
    return <span className="badge badge-gray text-xs">{ten || 'Không xác định'}</span>;
  };

  const getTenVaiTro = (u: NguoiDungAdmin) => u.vaiTro?.tenVaiTro || '';


  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Quản lý người dùng</h2>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9 text-sm" placeholder="Tìm tên, email, SĐT..."
            value={tuKhoa} onChange={e => { setTuKhoa(e.target.value); setTrang(0); }} />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {[
            { label: 'Tất cả', value: '' },
            { label: 'Khách hàng', value: 'KHACH_HANG' },
            { label: 'Nhân viên', value: 'NHAN_VIEN' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => { setTabVaiTro(tab.value); setTrang(0); }}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                tabVaiTro === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Người dùng</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Liên hệ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Vai trò</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày tạo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                {isAdmin() && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {danhSach.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-semibold text-sm">{u.hoTen?.[0] || '?'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{u.hoTen}</span>
                        <p className="text-xs text-gray-400">@{u.tenDangNhap}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{u.email}</p>
                    <p className="text-gray-400 text-xs">{u.soDienThoai}</p>
                  </td>
                  <td className="px-4 py-3">{vaiTroLabel(u.vaiTro)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(u.thoiGianTao)}</td>
                  <td className="px-4 py-3">
                    {u.dangHoatDong ? (
                      <span className="badge badge-green text-xs">Hoạt động</span>
                    ) : (
                      <span className="badge badge-red text-xs">Bị khóa</span>
                    )}
                  </td>
                  {isAdmin() && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(u)}
                          title={u.dangHoatDong ? 'Khóa tài khoản' : 'Mở khóa'}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors">
                          {u.dangHoatDong ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        {getTenVaiTro(u) === 'KHACH_HANG' && (
                          <button onClick={() => doiVaiTro(u.id, 2)}
                            title="Thăng lên Nhân viên"
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        {getTenVaiTro(u) === 'NHAN_VIEN' && (
                          <button onClick={() => doiVaiTro(u.id, 3)}
                            title="Hạ xuống Khách hàng"
                            className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                            Hạ cấp
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {danhSach.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Không có người dùng</td></tr>
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
