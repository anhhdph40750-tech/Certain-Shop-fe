import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, UserCheck, Trash2, Filter, RefreshCw, UserPlus, Download, Pencil, X, User, ShoppingBag, Package, DollarSign, TrendingUp, CreditCard, BarChart3 } from 'lucide-react';
import { adminApi } from '../../services/api';
import type { NguoiDungAdmin } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';

type Mode = 'NHAN_VIEN' | 'KHACH_HANG' | 'ADMIN';

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
  const { isAdmin, isSuperAdmin, user: currentUser } = useAuthStore();

  console.log('Current user:', currentUser);
  console.log('Is admin:', isAdmin());
  console.log('Is super admin:', isSuperAdmin());

  // Đồng bộ mode với URL: /quan-ly/khach-hang → KHACH_HANG, /quan-ly/user-admin → USER_ADMIN, /quan-ly/nguoi-dung → NHAN_VIEN
  const modeFromUrl: Mode = location.pathname.includes('khach-hang')
    ? 'KHACH_HANG'
    : location.pathname.includes('user-admin')
      ? 'ADMIN'
      : defaultMode;
  const [mode, setMode] = useState<Mode>(modeFromUrl);

  useEffect(() => {
    setMode(modeFromUrl);
  }, [modeFromUrl]);
  const [danhSach, setDanhSach] = useState<NguoiDungAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [tuKhoa, setTuKhoa] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('');
  const [tongSo, setTongSo] = useState(0);
  const [selectedUser, setSelectedUser] = useState<NguoiDungAdmin | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);

  // Xác nhận xóa
  const [xoaId, setXoaId] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);

  const openUserDialog = async (u: NguoiDungAdmin) => {
    setSelectedUser(u);
    setLoadingUserDetail(true);
    try {
      const [detailRes, statsRes] = await Promise.all([
        adminApi.chiTietNguoiDung(u.id),
        adminApi.thongKeNguoiDung(u.id)
      ]);
      const userDetail = detailRes.data.duLieu;
      const stats = statsRes.data.duLieu?.thongKemuaHang;
      setSelectedUser({
        ...userDetail,
        thongKemuaHang: stats
      });
    } catch (error) {
      console.error('Failed to load user detail', error);
      toast.error('Không thể tải chi tiết người dùng');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // Loading states cho các actions
  const [togglingUsers, setTogglingUsers] = useState<Set<number>>(new Set());
  const [changingRoleUsers, setChangingRoleUsers] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchAllUsers = async () => {
      const allUsers: NguoiDungAdmin[] = [];
      const baseParams: Record<string, any> = {
        tuKhoa: tuKhoa || undefined,
      };
      if (mode === 'NHAN_VIEN' || mode === 'KHACH_HANG') {
        baseParams.tenVaiTro = mode;
      }

      let page = 0;
      let totalPages = 1;

      while (page < totalPages) {
        if (cancelled) break;
        const params = { ...baseParams, trang: page };
        const r = await adminApi.danhSachNguoiDung(params);
        if (cancelled) break;
        const pageUsers: NguoiDungAdmin[] = r.data.duLieu?.nguoiDung || [];
        const visibleUsers = pageUsers.filter(u => u.trangThai !== 'DA_XOA');
        if (mode === 'ADMIN') {
          allUsers.push(...visibleUsers.filter(u => u.vaiTro?.tenVaiTro === 'ADMIN' || u.vaiTro?.tenVaiTro === 'SUPER_ADMIN'));
        } else {
          allUsers.push(...visibleUsers);
        }

        totalPages = r.data.duLieu?.tongTrang || 1;
        page += 1;
      }

      let finalUsers = allUsers;
      if (filterTrangThai === 'HOAT_DONG') finalUsers = finalUsers.filter(u => u.dangHoatDong);
      else if (filterTrangThai === 'BI_KHOA') finalUsers = finalUsers.filter(u => !u.dangHoatDong);

      if (!cancelled) {
        console.log('Fetched users:', finalUsers);
        setDanhSach(finalUsers);
        setTongSo(finalUsers.length);
      }
    };

    fetchAllUsers().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tuKhoa, mode, filterTrangThai, tick]);

  const resetFilter = () => {
    setTuKhoa('');
    setFilterTrangThai('');
  };

  const toggleActive = async (u: NguoiDungAdmin) => {
    if (togglingUsers.has(u.id)) return; // Prevent multiple clicks

    console.log('Toggling user:', u.id, 'from', u.dangHoatDong, 'to', !u.dangHoatDong);
    setTogglingUsers(prev => new Set(prev).add(u.id));
    try {
      await adminApi.doiTrangThaiNguoiDung(u.id, !u.dangHoatDong);
      toast.success(u.dangHoatDong ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      reload();
    } catch (error: any) {
      console.error('Toggle active error:', error);
      const errorMessage = error?.response?.data?.thongBao || error?.message || 'Có lỗi xảy ra khi thay đổi trạng thái';
      toast.error(errorMessage);
    } finally {
      setTogglingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(u.id);
        return newSet;
      });
    }
  };

  const doiVaiTro = async (id: number, vaiTro: string) => {
    if (changingRoleUsers.has(id)) return; // Prevent multiple clicks

    const vaiTroIdMap: Record<string, number> = {
      'KHACH_HANG': 3,
      'NHAN_VIEN': 2,
      'ADMIN': 1,
      'SUPER_ADMIN': 4,
    };
    const vaiTroId = vaiTroIdMap[vaiTro];
    if (!vaiTroId) return;

    setChangingRoleUsers(prev => new Set(prev).add(id));
    try {
      await adminApi.doiVaiTroNguoiDung(id, vaiTroId);
      toast.success('Đã đổi vai trò');
      reload();
    } catch (error: any) {
      console.error('Change role error:', error);
      const errorMessage = error?.response?.data?.thongBao || 'Có lỗi xảy ra khi thay đổi vai trò';
      toast.error(errorMessage);
    } finally {
      setChangingRoleUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
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
      : mode === 'ADMIN'
        ? ['STT', 'Mã Admin', 'Tên Admin', 'Email', 'SĐT', 'Địa chỉ', 'Trạng thái']
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
    a.download = `${mode === 'KHACH_HANG' ? 'khach-hang' : mode === 'ADMIN' ? 'admin' : 'nhan-vien'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isKH = mode === 'KHACH_HANG';
  const isUserAdmin = mode === 'ADMIN';
  const tenMode = isKH ? 'Khách hàng' : isUserAdmin ? 'Admin' : 'Nhân viên';

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
              // Điều hướng URL để sidebar cập nhật active state
              navigate(m === 'KHACH_HANG' ? '/quan-ly/khach-hang' : '/quan-ly/nguoi-dung');
            }}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                onChange={e => { setTuKhoa(e.target.value); }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái</label>
            <select
              title="Lọc theo trạng thái"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={filterTrangThai}
              onChange={e => { setFilterTrangThai(e.target.value); }}
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
                    {isKH ? 'Mã khách' : isUserAdmin ? 'Mã Admin' : 'Mã NV'}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    {isKH ? 'Tên khách hàng' : isUserAdmin ? 'Tên quản trị viên' : 'Tên nhân viên'}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">SĐT</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Địa chỉ</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Vai trò</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                  {isAdmin() && (
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">Hành động</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {danhSach.map((u, idx) => (
                  <tr key={u.id} onClick={() => isKH && openUserDialog(u)} className={`hover:bg-gray-50 transition-colors ${isKH ? 'cursor-pointer' : ''}`}>
                    <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
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
                    <td className="px-4 py-3 text-gray-600 text-sm max-w-[150px] truncate" title={getDiaChiDaiDien(u)}>
                      {getDiaChiDaiDien(u)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.vaiTro?.tenVaiTro === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                        u.vaiTro?.tenVaiTro === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                          u.vaiTro?.tenVaiTro === 'NHAN_VIEN' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {u.vaiTro?.tenVaiTro === 'SUPER_ADMIN' ? 'Super Admin' :
                          u.vaiTro?.tenVaiTro === 'ADMIN' ? 'Admin' :
                            u.vaiTro?.tenVaiTro === 'NHAN_VIEN' ? 'Nhân viên' :
                              'Khách hàng'}
                      </span>
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
                        {(() => {
                          const isCurrentUser = u.id === currentUser?.id;
                          const targetRole = u.vaiTro?.tenVaiTro;

                          // --- LOGIC PHÂN QUYỀN ---
                          // 1. Quyền Khóa/Mở khóa: Admin có quyền khóa Admin khác (nhưng không được khóa Super Admin)
                          const canLock = isSuperAdmin() || 
                                          (isAdmin() && !isSuperAdmin() && targetRole !== 'SUPER_ADMIN');

                          // 2. Quyền Sửa/Xóa: Admin KHÔNG được sửa/xóa Admin khác và Super Admin
                          const canEditOrDelete = isSuperAdmin() || 
                                                  (isAdmin() && !isSuperAdmin() && targetRole !== 'SUPER_ADMIN' && targetRole !== 'ADMIN');

                          return (
                            <div className="flex items-center justify-center gap-2">

                              {/* 1. Toggle khoá - Cần có quyền canModify */}
                              {canLock && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleActive(u); }}
                                  disabled={togglingUsers.has(u.id) || isCurrentUser}
                                  title={u.dangHoatDong ? 'Khóa' : 'Mở khóa'}
                                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${u.dangHoatDong ? 'bg-green-500' : 'bg-gray-300'
                                    }`}
                                >
                                  {togglingUsers.has(u.id) ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  ) : (
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${u.dangHoatDong ? 'translate-x-6' : 'translate-x-0'
                                      }`} />
                                  )}
                                </button>
                              )}

                              {/* 2. Sửa thông tin - Cần có quyền canModify */}
                              {(canEditOrDelete && u.id) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/quan-ly/nguoi-dung/sua/${u.id}`); }}
                                  title="Sửa thông tin"
                                  className="p-1.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* 3. Thay đổi vai trò */}
                              {(() => {
                                const options: Array<{ value: string; label: string }> = [];

                                if (isSuperAdmin()) {
                                  // Super Admin có thể đổi quyền của mọi người
                                  if (targetRole === 'ADMIN') {
                                    options.push(
                                      { value: 'ADMIN', label: 'Admin' },
                                      { value: 'SUPER_ADMIN', label: 'Super Admin' },
                                      { value: 'NHAN_VIEN', label: 'Nhân viên' }
                                    );
                                  } else if (targetRole === 'NHAN_VIEN') {
                                    options.push(
                                      { value: 'NHAN_VIEN', label: 'Nhân viên' },
                                      { value: 'ADMIN', label: 'Admin' }
                                    );
                                  } else if (targetRole === 'KHACH_HANG') {
                                    options.push(
                                      { value: 'KHACH_HANG', label: 'Khách hàng' },
                                      { value: 'NHAN_VIEN', label: 'Nhân viên' }
                                    );
                                  }
                                } else if (isAdmin() && !isSuperAdmin()) {
                                  // Admin chỉ có thể đổi quyền của Nhân viên (và không được chạm vào Admin/SuperAdmin)
                                  if (targetRole === 'NHAN_VIEN') {
                                    options.push(
                                      { value: 'NHAN_VIEN', label: 'Nhân viên' },
                                      { value: 'ADMIN', label: 'Admin' } // Tuỳ nghiệp vụ có cho Admin thăng cấp người khác lên Admin không
                                    );
                                  }
                                  // Đã loại bỏ logic cho đổi role targetRole === 'ADMIN' vì Admin không có quyền này
                                }

                                const canChangeRole = mode !== 'KHACH_HANG' && !isCurrentUser && targetRole !== 'SUPER_ADMIN' && options.length > 1;

                                return canChangeRole ? (
                                  <select
                                    value={targetRole}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => doiVaiTro(u.id, e.target.value)}
                                    disabled={changingRoleUsers.has(u.id)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Thay đổi vai trò"
                                  >
                                    {changingRoleUsers.has(u.id) ? (
                                      <option>Đang xử lý...</option>
                                    ) : (
                                      options.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))
                                    )}
                                  </select>
                                ) : null;
                              })()}

                              {/* 4. Xóa - Cần có quyền canModify và không được tự xóa chính mình */}
                              {(canEditOrDelete && !isCurrentUser && u.id) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setXoaId(u.id); }}
                                  title="Xóa tài khoản"
                                  className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Khóa/mở icon fallback */}
                              {!u.dangHoatDong && <UserCheck className="hidden" />}
                            </div>
                          );
                        })()}
                      </td>
                    )}
                  </tr>
                ))}
                {danhSach.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin() ? 9 : 8} className="text-center py-12 text-gray-400">
                      Không có {tenMode.toLowerCase()} nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {/* {tongTrang > 1 && (
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
          )} */}
        </div>
      )}

      {/* Dialog chi tiết người dùng */}
     

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

