import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function DangKyPage() {
  const [form, setForm] = useState({
    tenDangNhap: '', matKhau: '', xacNhanMatKhau: '',
    hoTen: '', email: '', soDienThoai: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenDangNhap || !form.matKhau || !form.hoTen) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    if (form.matKhau.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (form.matKhau !== form.xacNhanMatKhau) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.dangKy({
        tenDangNhap: form.tenDangNhap.trim(),
        matKhau: form.matKhau,
        xacNhanMatKhau: form.xacNhanMatKhau,
        hoTen: form.hoTen.trim(),
        email: form.email.trim(),
        soDienThoai: form.soDienThoai.trim() || undefined,
      });
      const { token, nguoiDung } = res.data.duLieu;
      setAuth(token, nguoiDung);
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { thongBao?: string; errors?: Array<{ defaultMessage?: string }> } } };
      const data = axErr?.response?.data;
      let msg = data?.thongBao;
      if (!msg && data?.errors?.length) {
        msg = data.errors.map(e => e.defaultMessage).filter(Boolean).join('; ');
      }
      toast.error(msg || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">C</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
            <p className="text-gray-500 text-sm">Tham gia CertainShop ngay hôm nay</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.hoTen} onChange={set('hoTen')}
                placeholder="Nguyễn Văn A" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên đăng nhập <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.tenDangNhap} onChange={set('tenDangNhap')}
                placeholder="vd: nguyenvana (chữ, số, dấu _)" className="input-field" autoComplete="username" />
              <p className="text-xs text-gray-400 mt-1">Chỉ gồm chữ cái, số và dấu gạch dưới, không có @</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={set('email')}
                placeholder="email@example.com" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input type="tel" value={form.soDienThoai} onChange={set('soDienThoai')}
                placeholder="0912345678" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.matKhau} onChange={set('matKhau')}
                  placeholder="Ít nhất 6 ký tự" className="input-field pr-10" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input type={showPass ? 'text' : 'password'} value={form.xacNhanMatKhau} onChange={set('xacNhanMatKhau')}
                placeholder="Nhập lại mật khẩu" className="input-field" />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : <UserPlus className="w-4 h-4" />}
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link to="/dang-nhap" className="text-indigo-600 font-medium hover:underline">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
