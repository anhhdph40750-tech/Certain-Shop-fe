import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload, X, User } from 'lucide-react';
import { adminApi, diaChiApi } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';

// Routes that use this component:
//   /quan-ly/nguoi-dung/them-nhan-vien  → add NV (vaiTroId=2)
//   /quan-ly/nguoi-dung/them-khach-hang → add KH (vaiTroId=3)
//   /quan-ly/nguoi-dung/sua/:id         → edit existing (NV or KH)

type PageMode = 'them-nv' | 'them-kh' | 'sua';

interface FormState {
  hoTen: string;
  soDienThoai: string;
  cccd: string;
  email: string;
  tenDangNhap: string;
  matKhau: string;
  ngaySinh: string;
  gioiTinh: 'true' | 'false' | '';
  maTinhGHN: number | null;
  tinhThanh: string;
  maHuyenGHN: number | null;
  quanHuyen: string;
  maXaGHN: string;
  phuongXa: string;
  diaChiCuThe: string;
}

const blankForm: FormState = {
  hoTen: '', soDienThoai: '', cccd: '', email: '',
  tenDangNhap: '', matKhau: '',
  ngaySinh: '', gioiTinh: 'true',
  maTinhGHN: null, tinhThanh: '',
  maHuyenGHN: null, quanHuyen: '',
  maXaGHN: '', phuongXa: '', diaChiCuThe: '',
};

export default function ThemNhanVienPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const { isSuperAdmin } = useAuthStore();

  const pageMode: PageMode = id
    ? 'sua'
    : location.pathname.includes('them-khach-hang') ? 'them-kh' : 'them-nv';

  const isEdit = pageMode === 'sua';

  const [editVaiTro, setEditVaiTro] = useState<'SUPER_ADMIN' | 'ADMIN' | 'NHAN_VIEN' | 'KHACH_HANG'>('NHAN_VIEN');
  const isKhachHang = pageMode === 'them-kh' || (isEdit && editVaiTro === 'KHACH_HANG');
  const tenLoaiVN = isKhachHang ? 'Khách hàng' : 'Nhân viên';
  const backUrl = isKhachHang ? '/quan-ly/khach-hang' : '/quan-ly/nguoi-dung';
  const vaiTroId = editVaiTro === 'KHACH_HANG' ? 3 : editVaiTro === 'NHAN_VIEN' ? 2 : editVaiTro === 'ADMIN' ? 4 : 1;

  const [form, setForm] = useState<FormState>(blankForm);
  const [anhPreview, setAnhPreview] = useState<string | null>(null);
  const [currentAnhUrl, setCurrentAnhUrl] = useState<string | undefined>();
  const [anhFile, setAnhFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingUser, setLoadingUser] = useState(isEdit);

  const [danhSachTinh, setDanhSachTinh] = useState<{ ProvinceID: number; ProvinceName: string }[]>([]);
  const [danhSachHuyen, setDanhSachHuyen] = useState<{ DistrictID: number; DistrictName: string }[]>([]);
  const [danhSachXa, setDanhSachXa] = useState<{ WardCode: string; WardName: string }[]>([]);

  // Always load provinces (both add and edit mode)
  useEffect(() => {
    diaChiApi.layDanhSachTinh().then(r => setDanhSachTinh(r.data.duLieu || []));
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoadingUser(true);
    adminApi.chiTietNguoiDung(Number(id))
      .then(async r => {
        const u = r.data.duLieu;
        if (!u) return;
        const vaiTro = u.vaiTro?.tenVaiTro;
        setEditVaiTro(vaiTro as 'SUPER_ADMIN' | 'ADMIN' | 'NHAN_VIEN' | 'KHACH_HANG');
        const diaChi = u.danhSachDiaChi?.find((d: any) => d.laMacDinh) ?? u.danhSachDiaChi?.[0];
        const maTinh = diaChi?.maTinhGHN || null;
        const maHuyen = diaChi?.maHuyenGHN || null;
        const maXa = diaChi?.maXaGHN || '';
        setForm({
          hoTen: u.hoTen || '',
          soDienThoai: u.soDienThoai || '',
          cccd: u.cccd || '',
          email: u.email || '',
          tenDangNhap: u.tenDangNhap || '',
          matKhau: '',
          ngaySinh: u.ngaySinh ? String(u.ngaySinh).substring(0, 10) : '',
          gioiTinh: u.gioiTinh === true ? 'true' : u.gioiTinh === false ? 'false' : '',
          maTinhGHN: maTinh,
          tinhThanh: diaChi?.tinhThanh || '',
          maHuyenGHN: maHuyen,
          quanHuyen: diaChi?.quanHuyen || '',
          maXaGHN: maXa,
          phuongXa: diaChi?.phuongXa || '',
          diaChiCuThe: diaChi?.diaChiDong1 || '',
        });
        // Pre-load district/ward lists for existing GHN codes
        if (maTinh) {
          diaChiApi.layDanhSachHuyen(maTinh).then(rh => setDanhSachHuyen(rh.data.duLieu || []));
        }
        if (maHuyen) {
          diaChiApi.layDanhSachXa(maHuyen).then(rx => setDanhSachXa(rx.data.duLieu || []));
        }
        if (u.anhDaiDien) { setAnhPreview(u.anhDaiDien); setCurrentAnhUrl(u.anhDaiDien); }
      })
      .catch(() => toast.error('Không thể tải thông tin người dùng'))
      .finally(() => setLoadingUser(false));
  }, [isEdit, id]);

  const handleTinhChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const maTinh = Number(e.target.value);
    const tenTinh = danhSachTinh.find(t => t.ProvinceID === maTinh)?.ProvinceName || '';
    setForm(f => ({ ...f, maTinhGHN: maTinh || null, tinhThanh: tenTinh, maHuyenGHN: null, quanHuyen: '', maXaGHN: '', phuongXa: '' }));
    setDanhSachHuyen([]); setDanhSachXa([]);
    if (maTinh) diaChiApi.layDanhSachHuyen(maTinh).then(r => setDanhSachHuyen(r.data.duLieu || []));
  };

  const handleHuyenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const maHuyen = Number(e.target.value);
    const tenHuyen = danhSachHuyen.find(h => h.DistrictID === maHuyen)?.DistrictName || '';
    setForm(f => ({ ...f, maHuyenGHN: maHuyen || null, quanHuyen: tenHuyen, maXaGHN: '', phuongXa: '' }));
    setDanhSachXa([]);
    if (maHuyen) diaChiApi.layDanhSachXa(maHuyen).then(r => setDanhSachXa(r.data.duLieu || []));
  };

  const handleXaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const maXa = e.target.value;
    const tenXa = danhSachXa.find(x => x.WardCode === maXa)?.WardName || '';
    setForm(f => ({ ...f, maXaGHN: maXa, phuongXa: tenXa }));
  };

  const handleAnh = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) { toast.error('Chỉ chấp nhận PNG, JPG, JPEG'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh không được vượt quá 5MB'); return; }
    setAnhFile(file);
    setAnhPreview(URL.createObjectURL(file));
  };

  const clearAnh = () => { setAnhPreview(null); setAnhFile(null); setCurrentAnhUrl(undefined); if (fileRef.current) fileRef.current.value = ''; };

  const handleSubmit = async () => {
    if (!form.hoTen.trim()) { toast.error(`Vui lòng nhập tên ${tenLoaiVN.toLowerCase()}`); return; }
    if (!form.email.trim()) { toast.error('Vui lòng nhập email'); return; }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { toast.error('Email không đúng định dạng'); return; }
    if (form.soDienThoai.trim() && !/^\d{10,11}$/.test(form.soDienThoai.trim())) { toast.error('Số điện thoại phải là 10-11 chữ số'); return; }
    if (form.cccd.trim() && !/^\d{12,15}$/.test(form.cccd.trim())) { toast.error('CCCD phải là 12-15 chữ số'); return; }
    if (!isEdit) {
      if (!form.tenDangNhap.trim()) { toast.error('Vui lòng nhập tên đăng nhập'); return; }
      if (!form.matKhau || form.matKhau.length < 6) { toast.error('Mật khẩu tối thiểu 6 ký tự'); return; }
    }
    setSubmitting(true);
    try {
      let anhDaiDien: string | undefined = isEdit ? currentAnhUrl : undefined;
      if (anhFile) {
        try { const up = await adminApi.uploadAnhDaiDien(anhFile); anhDaiDien = up.data.duLieu?.duongDan; } catch { /* non-fatal */ }
      }
      const base = {
        hoTen: form.hoTen.trim(), email: form.email.trim(),
        soDienThoai: form.soDienThoai.trim() || undefined,
        cccd: form.cccd.trim() || undefined,
        ngaySinh: form.ngaySinh || undefined,
        gioiTinh: form.gioiTinh === '' ? null : form.gioiTinh === 'true',
        anhDaiDien,
        tinhThanh: form.tinhThanh || undefined, quanHuyen: form.quanHuyen || undefined,
        phuongXa: form.phuongXa || undefined, diaChiCuThe: form.diaChiCuThe.trim() || undefined,
        maTinhGHN: form.maTinhGHN ?? undefined, maHuyenGHN: form.maHuyenGHN ?? undefined,
        maXaGHN: form.maXaGHN || undefined,
        ...(isSuperAdmin() ? { vaiTroId } : {}),
      };
      if (isEdit && id) {
        await adminApi.capNhatNguoiDung(Number(id), base);
        toast.success(`Cập nhật ${tenLoaiVN.toLowerCase()} thành công!`);
      } else {
        await adminApi.taoNhanVien({ ...base, tenDangNhap: form.tenDangNhap.trim(), matKhau: form.matKhau, vaiTroId });
        toast.success(`Thêm ${tenLoaiVN.toLowerCase()} thành công!`);
      }
      navigate(backUrl);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { thongBao?: string } } })?.response?.data?.thongBao;
      toast.error(msg || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const setF = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  if (loadingUser) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {isEdit ? `Chỉnh sửa ${tenLoaiVN}` : `Thêm ${tenLoaiVN}`}
        </h2>
        <button onClick={() => navigate(backUrl)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {anhPreview ? (
              <>
                <img src={anhPreview} alt="Ảnh đại diện" className="w-24 h-24 rounded-full object-cover border-2 border-indigo-200" />
                <button title="Xóa ảnh" onClick={clearAnh}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <button title="Tải lên ảnh đại diện" onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-full bg-indigo-50 border-2 border-dashed border-indigo-300 flex flex-col items-center justify-center hover:bg-indigo-100 transition-colors cursor-pointer">
                <User className="w-8 h-8 text-indigo-400" />
                <Upload className="w-4 h-4 text-indigo-400 mt-1" />
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" title="Chọn ảnh đại diện" accept=".png,.jpg,.jpeg" className="hidden" onChange={handleAnh} />
          <p className="text-xs text-gray-400 mt-2">PNG, JPG, JPEG tối đa 5MB</p>
        </div>

        {/* Form 2-column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên {tenLoaiVN} <span className="text-red-500">*</span>
            </label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Nguyễn Văn A" value={form.hoTen} onChange={setF('hoTen')} />
          </div>

          {/* Vai trò - chỉ SUPER_ADMIN mới có thể set */}
          {isSuperAdmin() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                value={editVaiTro}
                onChange={(e) => setEditVaiTro(e.target.value as 'SUPER_ADMIN' | 'ADMIN' | 'NHAN_VIEN' | 'KHACH_HANG')}
              >
                <option value="KHACH_HANG">Khách hàng</option>
                <option value="NHAN_VIEN">Nhân viên</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="0912345678" value={form.soDienThoai} onChange={setF('soDienThoai')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CCCD</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="012345678901" value={form.cccd} onChange={setF('cccd')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="email@example.com" value={form.email} onChange={setF('email')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên đăng nhập {!isEdit && <span className="text-red-500">*</span>}
            </label>
            {isEdit ? (
              <>
                <input disabled title="Tên đăng nhập" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" value={form.tenDangNhap} />
                <p className="text-xs text-gray-400 mt-1">Tên đăng nhập không thể thay đổi</p>
              </>
            ) : (
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="nhanvien01" value={form.tenDangNhap} onChange={setF('tenDangNhap')}
                autoComplete="off" name="tenDangNhap_new" />
            )}
          </div>

          {!isEdit ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Tối thiểu 6 ký tự" value={form.matKhau} onChange={setF('matKhau')}
                autoComplete="new-password" name="matKhau_new" />
            </div>
          ) : <div />}

          {/* Address — GHN dropdowns for both add and edit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                <select title="Chọn tỉnh/thành phố"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.maTinhGHN ?? ''} onChange={handleTinhChange}>
                  <option value="">-- Chọn tỉnh/thành --</option>
                  {danhSachTinh.map(t => <option key={t.ProvinceID} value={t.ProvinceID}>{t.ProvinceName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                <select title="Chọn quận/huyện"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.maHuyenGHN ?? ''} onChange={handleHuyenChange} disabled={!form.maTinhGHN}>
                  <option value="">-- Chọn quận/huyện --</option>
                  {danhSachHuyen.map(h => <option key={h.DistrictID} value={h.DistrictID}>{h.DistrictName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xã/Phường</label>
                <select title="Chọn xã/phường"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.maXaGHN} onChange={handleXaChange} disabled={!form.maHuyenGHN}>
                  <option value="">-- Chọn xã/phường --</option>
                  {danhSachXa.map(x => <option key={x.WardCode} value={x.WardCode}>{x.WardName}</option>)}
                </select>
              </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cụ thể</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Số nhà, tên đường..." value={form.diaChiCuThe} onChange={setF('diaChiCuThe')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
            <input type="date" title="Ngày sinh"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.ngaySinh} onChange={setF('ngaySinh')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
            <div className="flex items-center gap-5 mt-1">
              {([['true', 'Nam'], ['false', 'Nữ'], ['', 'Khác']] as const).map(([val, label]) => (
                <label key={val} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
                  <input type="radio" name="gioiTinh" value={val} checked={form.gioiTinh === val}
                    onChange={() => setForm(f => ({ ...f, gioiTinh: val }))} className="accent-indigo-600" />
                  {label}
                </label>
              ))}
            </div>
          </div>

        </div>

        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
          <button onClick={() => navigate(backUrl)}
            className="px-6 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-6 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
            {submitting ? 'Đang lưu...' : isEdit ? `Cập nhật ${tenLoaiVN}` : `Lưu ${tenLoaiVN}`}
          </button>
        </div>
      </div>
    </div>
  );
}
