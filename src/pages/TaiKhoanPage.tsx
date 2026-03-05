import { useState, useEffect } from 'react';
import { User, MapPin, Lock, Plus, Edit2, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { taiKhoanApi, diaChiApi } from '../services/api';
import type { DiaChi, User as UserType } from '../services/api';
import { useAuthStore } from '../stores/authStore';

type Tab = 'profile' | 'addresses' | 'password';

// Validation helpers
const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone) return true; // optional
  return /^(\+84|0)[0-9]{9,10}$/.test(phone.replace(/\s/g, ''));
};

const isValidEmail = (email: string): boolean => {
  if (!email) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function TaiKhoanPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { user, setAuth } = useAuthStore();

  const tabs = [
    { id: 'profile' as Tab, label: 'Thông tin', icon: User },
    { id: 'addresses' as Tab, label: 'Địa chỉ', icon: MapPin },
    { id: 'password' as Tab, label: 'Mật khẩu', icon: Lock },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tài khoản của tôi</h1>
      <div className="flex gap-6">
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex-1">
          {activeTab === 'profile' && <ProfileTab user={user} setAuth={setAuth} />}
          {activeTab === 'addresses' && <AddressesTab />}
          {activeTab === 'password' && <PasswordTab />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ setAuth }: { user: UserType | null; setAuth: (token: string, user: UserType) => void }) {
  const { token } = useAuthStore();
  const [form, setForm] = useState({ hoTen: '', email: '', soDienThoai: '', ngaySinh: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    taiKhoanApi.layThongTin().then(r => {
      const u = r.data.duLieu;
      setForm({
        hoTen: u.hoTen || '',
        email: u.email || '',
        soDienThoai: u.soDienThoai || '',
        ngaySinh: u.ngaySinh ? u.ngaySinh.substring(0, 10) : '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate email if provided
    if (form.email && !isValidEmail(form.email)) {
      toast.error('Email không hợp lệ');
      return;
    }
    // Validate phone if provided
    if (form.soDienThoai && !isValidPhoneNumber(form.soDienThoai)) {
      toast.error('Số điện thoại không hợp lệ (10-11 chữ số)');
      return;
    }
    // Validate name
    if (form.hoTen.trim().length < 3) {
      toast.error('Họ tên phải có ít nhất 3 ký tự');
      return;
    }
    setSaving(true);
    try {
      const r = await taiKhoanApi.capNhatThongTin(form);
      const updated = r.data.duLieu;
      if (token) setAuth(token, updated);
      toast.success('Cập nhật thành công');
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Đang tải...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-6">Thông tin cá nhân</h2>
      <form onSubmit={save} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
          <input className={`input-field ${form.hoTen && form.hoTen.trim().length < 3 ? 'border-red-400' : ''}`} value={form.hoTen} onChange={e => setForm({ ...form, hoTen: e.target.value })} required />
          {form.hoTen && form.hoTen.trim().length < 3 && (
            <p className="text-xs text-red-500 mt-1">Ít nhất 3 ký tự</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input className={`input-field ${form.email && !isValidEmail(form.email) ? 'border-red-400' : ''}`} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          {form.email && !isValidEmail(form.email) && (
            <p className="text-xs text-red-500 mt-1">Email không hợp lệ</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
          <input className={`input-field ${form.soDienThoai && !isValidPhoneNumber(form.soDienThoai) ? 'border-red-400' : ''}`} value={form.soDienThoai} onChange={e => setForm({ ...form, soDienThoai: e.target.value })} />
          {form.soDienThoai && !isValidPhoneNumber(form.soDienThoai) && (
            <p className="text-xs text-red-500 mt-1">Số điện thoại không hợp lệ (10-11 chữ số)</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
          <input className="input-field" type="date" value={form.ngaySinh} onChange={e => setForm({ ...form, ngaySinh: e.target.value })} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </form>
    </div>
  );
}

function AddressesTab() {
  const [danhSach, setDanhSach] = useState<DiaChi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DiaChi | null>(null);

  const load = () => {
    taiKhoanApi.danhSachDiaChi().then(r => setDanhSach(r.data.duLieu || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const xoa = async (id: number) => {
    if (!confirm('Xóa địa chỉ này?')) return;
    await taiKhoanApi.xoaDiaChi(id);
    toast.success('Đã xóa địa chỉ');
    load();
  };

  const macDinh = async (id: number) => {
    await taiKhoanApi.datLamMacDinh(id);
    toast.success('Đã đặt làm mặc định');
    load();
  };

  if (loading) return <div className="text-center py-10 text-gray-400">Đang tải...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-gray-900">Sổ địa chỉ</h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Thêm địa chỉ
        </button>
      </div>

      {showForm && (
        <AddressForm
          initial={editing}
          onSave={() => { setShowForm(false); load(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-3">
        {danhSach.map(dc => (
          <div key={dc.id} className={`p-4 rounded-lg border ${dc.laMacDinh ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">{dc.hoTen}</p>
                  {dc.laMacDinh && <span className="badge badge-blue text-xs">Mặc định</span>}
                </div>
                <p className="text-gray-500 text-sm">{dc.soDienThoai}</p>
                <p className="text-gray-500 text-sm">{dc.diaChiDong1}, {dc.phuongXa}, {dc.quanHuyen}, {dc.tinhThanh}</p>
              </div>
              <div className="flex items-center gap-2">
                {!dc.laMacDinh && (
                  <button onClick={() => macDinh(dc.id!)} title="Đặt mặc định"
                    className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => { setEditing(dc); setShowForm(true); }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => xoa(dc.id!)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {danhSach.length === 0 && !showForm && (
          <p className="text-center text-gray-400 py-6">Chưa có địa chỉ nào</p>
        )}
      </div>
    </div>
  );
}

function AddressForm({ initial, onSave, onCancel }: { initial: DiaChi | null; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    hoTen: initial?.hoTen || '',
    soDienThoai: initial?.soDienThoai || '',
    tinhThanh: initial?.tinhThanh || '',
    maTinhGHN: initial?.maTinhGHN || 0,
    quanHuyen: initial?.quanHuyen || '',
    maHuyenGHN: initial?.maHuyenGHN || 0,
    phuongXa: initial?.phuongXa || '',
    maXaGHN: initial?.maXaGHN || '',
    diaChiDong1: initial?.diaChiDong1 || '',
    laMacDinh: initial?.laMacDinh || false,
  });
  const [saving, setSaving] = useState(false);
  const [provinceList, setProvinceList] = useState<{ ProvinceID: number; ProvinceName: string }[]>([]);
  const [districtList, setDistrictList] = useState<{ DistrictID: number; DistrictName: string }[]>([]);
  const [wardList, setWardList] = useState<{ WardCode: string; WardName: string }[]>([]);
  const [loadingGHN, setLoadingGHN] = useState(false);

  useEffect(() => {
    diaChiApi.layDanhSachTinh()
      .then(r => setProvinceList(r.data.duLieu || []))
      .catch(err => console.error('Lỗi load tỉnh:', err));
  }, []);

  useEffect(() => {
    if (!form.maTinhGHN) {
      setDistrictList([]);
      setWardList([]);
      return;
    }
    setLoadingGHN(true);
    diaChiApi.layDanhSachHuyen(form.maTinhGHN)
      .then(r => {
        setDistrictList(r.data.duLieu || []);
        setWardList([]);
        setForm(prev => ({ ...prev, maHuyenGHN: 0, phuongXa: '', maXaGHN: '' }));
      })
      .catch(err => console.error('Lỗi load huyện:', err))
      .finally(() => setLoadingGHN(false));
  }, [form.maTinhGHN]);

  useEffect(() => {
    if (!form.maHuyenGHN) {
      setWardList([]);
      return;
    }
    setLoadingGHN(true);
    diaChiApi.layDanhSachXa(form.maHuyenGHN)
      .then(r => {
        setWardList(r.data.duLieu || []);
        setForm(prev => ({ ...prev, phuongXa: '', maXaGHN: '' }));
      })
      .catch(err => console.error('Lỗi load xã:', err))
      .finally(() => setLoadingGHN(false));
  }, [form.maHuyenGHN]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate name
    if (form.hoTen.trim().length < 3) {
      toast.error('Tên người nhận phải có ít nhất 3 ký tự');
      return;
    }
    // Validate phone
    if (!isValidPhoneNumber(form.soDienThoai)) {
      toast.error('Số điện thoại không hợp lệ (10-11 chữ số)');
      return;
    }
    // Validate address fields
    if (!form.maTinhGHN || !form.maHuyenGHN || !form.maXaGHN) {
      toast.error('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã');
      return;
    }
    if (form.diaChiDong1.trim().length < 5) {
      toast.error('Địa chỉ cụ thể phải có ít nhất 5 ký tự');
      return;
    }
    setSaving(true);
    try {
      const province = provinceList.find(p => p.ProvinceID === form.maTinhGHN);
      const district = districtList.find(d => d.DistrictID === form.maHuyenGHN);
      const ward = wardList.find(w => w.WardCode === form.maXaGHN);

      const payload = {
        ...form,
        hoTen: form.hoTen.trim(),
        soDienThoai: form.soDienThoai.replace(/\s/g, ''),
        diaChiDong1: form.diaChiDong1.trim(),
        tinhThanh: province?.ProvinceName || form.tinhThanh,
        quanHuyen: district?.DistrictName || form.quanHuyen,
        phuongXa: ward?.WardName || form.phuongXa,
      };

      if (initial?.id) {
        await taiKhoanApi.capNhatDiaChi(initial.id, payload);
      } else {
        await taiKhoanApi.themDiaChi(payload as DiaChi);
      }
      toast.success(initial ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ');
      onSave();
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-5 mb-5 border border-gray-200">
      <h3 className="font-medium text-gray-900 mb-4">{initial ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
      <form onSubmit={save} className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Tên người nhận *
            {form.hoTen && form.hoTen.trim().length < 3 && (
              <span className="text-red-500 ml-1">(Ít nhất 3 ký tự)</span>
            )}
          </label>
          <input className={`input-field text-sm ${form.hoTen && form.hoTen.trim().length < 3 ? 'border-red-400' : ''}`} required value={form.hoTen} onChange={e => setForm({ ...form, hoTen: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Số điện thoại *
            {form.soDienThoai && !isValidPhoneNumber(form.soDienThoai) && (
              <span className="text-red-500 ml-1">(10-11 chữ số)</span>
            )}
          </label>
          <input className={`input-field text-sm ${form.soDienThoai && !isValidPhoneNumber(form.soDienThoai) ? 'border-red-400' : ''}`} required value={form.soDienThoai} onChange={e => setForm({ ...form, soDienThoai: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tỉnh/Thành phố *</label>
          <select className="input-field text-sm" required value={form.maTinhGHN} onChange={e => setForm({ ...form, maTinhGHN: Number(e.target.value) })}>
            <option value={0}>-- Chọn Tỉnh/Thành phố --</option>
            {provinceList.map(p => (<option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Quận/Huyện *</label>
          <select className="input-field text-sm" required value={form.maHuyenGHN} onChange={e => setForm({ ...form, maHuyenGHN: Number(e.target.value) })} disabled={!form.maTinhGHN || loadingGHN}>
            <option value={0}>-- Chọn Quận/Huyện --</option>
            {districtList.map(d => (<option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Phường/Xã *</label>
          <select className="input-field text-sm" required value={form.maXaGHN} onChange={e => setForm({ ...form, maXaGHN: e.target.value })} disabled={!form.maHuyenGHN || loadingGHN}>
            <option value="">-- Chọn Phường/Xã --</option>
            {wardList.map(w => (<option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Địa chỉ cụ thể *
            {form.diaChiDong1 && form.diaChiDong1.trim().length < 5 && (
              <span className="text-red-500 ml-1">(Ít nhất 5 ký tự)</span>
            )}
          </label>
          <input className={`input-field text-sm ${form.diaChiDong1 && form.diaChiDong1.trim().length < 5 ? 'border-red-400' : ''}`} required value={form.diaChiDong1} onChange={e => setForm({ ...form, diaChiDong1: e.target.value })} />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="laMacDinh" checked={form.laMacDinh} onChange={e => setForm({ ...form, laMacDinh: e.target.checked })} />
          <label htmlFor="laMacDinh" className="text-sm text-gray-600">Đặt làm địa chỉ mặc định</label>
        </div>
        <div className="col-span-2 flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Đang lưu...' : 'Lưu'}</button>
          <button type="button" onClick={onCancel} className="btn-secondary text-sm">Hủy</button>
        </div>
      </form>
    </div>
  );
}

function PasswordTab() {
  const [form, setForm] = useState({ matKhauCu: '', matKhauMoi: '', xacNhan: '' });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.matKhauMoi !== form.xacNhan) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (form.matKhauMoi.length < 6) {
      toast.error('Mật khẩu mới phải ít nhất 6 ký tự');
      return;
    }
    setSaving(true);
    try {
      await taiKhoanApi.doiMatKhau(form.matKhauCu, form.matKhauMoi);
      toast.success('Đổi mật khẩu thành công');
      setForm({ matKhauCu: '', matKhauMoi: '', xacNhan: '' });
    } catch {
      toast.error('Mật khẩu cũ không đúng');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-6">Đổi mật khẩu</h2>
      <form onSubmit={save} className="space-y-4 max-w-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
          <input type="password" className="input-field" required value={form.matKhauCu}
            onChange={e => setForm({ ...form, matKhauCu: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
          <input type="password" className="input-field" required minLength={6} value={form.matKhauMoi}
            onChange={e => setForm({ ...form, matKhauMoi: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
          <input type="password" className="input-field" required value={form.xacNhan}
            onChange={e => setForm({ ...form, xacNhan: e.target.value })} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Đang lưu...' : 'Đổi mật khẩu'}</button>
      </form>
    </div>
  );
}
