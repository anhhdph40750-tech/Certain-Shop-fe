import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gioHangApi, donHangApi, taiKhoanApi, diaChiApi } from '../services/api';
import type { GioHang, DiaChi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { formatCurrency, getImageUrl, handleImgError, PLACEHOLDER_IMG } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function DatHangPage() {
  const [gioHang, setGioHang] = useState<GioHang | null>(null);
  const [diaChiList, setDiaChiList] = useState<DiaChi[]>([]);
  const [selectedDiaChi, setSelectedDiaChi] = useState<DiaChi | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [maKhuyenMai, setMaKhuyenMai] = useState('');
  const [khuyenMai, setKhuyenMai] = useState<{ soTienGiam: number; tenKhuyenMai: string; id: number } | null>(null);
  const [phuongThuc, setPhuongThuc] = useState('COD');
  const [ghiChu, setGhiChu] = useState('');
  const [tenNguoiNhan, setTenNguoiNhan] = useState('');
  const [sdtNguoiNhan, setSdtNguoiNhan] = useState('');
  const [diaChiGiaoHang, setDiaChiGiaoHang] = useState('');
  
  // GHN shipping
  const [phiVanChuyen, setPhiVanChuyen] = useState<number>(0);
  const [loadingShip, setLoadingShip] = useState(false);

  const { isLoggedIn } = useAuthStore();
  const { setCount } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/dang-nhap'); return; }
    Promise.all([
      gioHangApi.lay(),
      taiKhoanApi.danhSachDiaChi(),
      taiKhoanApi.layThongTin(),
    ]).then(([cart, diaChiRes, thongTinRes]) => {
      const c = cart.data.duLieu;
      if (!c?.danhSachChiTiet?.length) {
        navigate('/gio-hang');
        return;
      }
      setGioHang(c);
      const dcs = diaChiRes.data.duLieu || [];
      setDiaChiList(dcs);
      const macDinh = dcs.find(dc => dc.laMacDinh) || dcs[0] || null;
      setSelectedDiaChi(macDinh);
      if (macDinh) {
        setTenNguoiNhan(macDinh.hoTen || '');
        setSdtNguoiNhan(macDinh.soDienThoai || '');
        setDiaChiGiaoHang(`${macDinh.diaChiDong1}, ${macDinh.phuongXa}, ${macDinh.quanHuyen}, ${macDinh.tinhThanh}`);
        // Tính phí vận chuyển cho địa chỉ mặc định
        if (macDinh.maHuyenGHN && macDinh.maXaGHN) {
          tinhPhiVanChuyen(macDinh.maHuyenGHN, macDinh.maXaGHN);
        }
      } else {
        const nd = thongTinRes.data.duLieu;
        setTenNguoiNhan(nd.hoTen || '');
        setSdtNguoiNhan(nd.soDienThoai || '');
      }
    }).finally(() => setLoading(false));
  }, [isLoggedIn, navigate]);

  /**
   * Tính phí vận chuyển từ GHN
   */
  const tinhPhiVanChuyen = async (maHuyen: number, maXa: string) => {
    setLoadingShip(true);
    try {
      // Tính tổng trọng lượng (mặc định 1 sản phẩm = 300g, nhưng có thể get từ BE)
      const tongKg = gioHang?.danhSachChiTiet?.length || 1;
      const trongLuongGram = tongKg * 300;

      const res = await diaChiApi.tinhPhiVanChuyen(maHuyen, maXa, trongLuongGram);
      const phi = res.data.duLieu?.phiVanChuyen || 0;
      setPhiVanChuyen(phi);
    } catch (err) {
      // Nếu lỗi, dùng phí mặc định
      console.error('Lỗi tính phí:', err);
      setPhiVanChuyen(35000);
      toast.error('Không thể lấy phí vận chuyển, dùng phí mặc định');
    } finally {
      setLoadingShip(false);
    }
  };

  const handleDiaChiChange = (dc: DiaChi) => {
    setSelectedDiaChi(dc);
    setTenNguoiNhan(dc.hoTen || '');
    setSdtNguoiNhan(dc.soDienThoai || '');
    setDiaChiGiaoHang(`${dc.diaChiDong1}, ${dc.phuongXa}, ${dc.quanHuyen}, ${dc.tinhThanh}`);
    
    // Tính phí vận chuyển
    if (dc.maHuyenGHN && dc.maXaGHN) {
      tinhPhiVanChuyen(dc.maHuyenGHN, dc.maXaGHN);
    } else {
      // Nếu không có mã GHN, dùng phí mặc định
      setPhiVanChuyen(35000);
    }
  };

  const handleKiemTraKhuyenMai = async () => {
    if (!maKhuyenMai.trim()) return;
    try {
      const res = await donHangApi.kiemTraKhuyenMai(maKhuyenMai.trim(), tongHang);
      setKhuyenMai(res.data.duLieu);
      toast.success(`Áp dụng mã "${res.data.duLieu.tenKhuyenMai}" thành công!`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { thongBao?: string } } })?.response?.data?.thongBao || 'Mã không hợp lệ';
      toast.error(msg);
      setKhuyenMai(null);
    }
  };

  const handleDatHang = async () => {
    if (!tenNguoiNhan || !sdtNguoiNhan || !diaChiGiaoHang) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        tenNguoiNhan,
        soDienThoai: sdtNguoiNhan,
        diaChiCuThe: diaChiGiaoHang,
        phuongThucThanhToan: phuongThuc,
        ghiChu,
        khuyenMaiId: khuyenMai?.id || null,
        phiVanChuyen: phiVanChuyen,
      };
      if (selectedDiaChi?.id) {
        payload.diaChiId = selectedDiaChi.id;
        payload.tenTinh = selectedDiaChi.tinhThanh;
        payload.tenHuyen = selectedDiaChi.quanHuyen;
        payload.tenXa = selectedDiaChi.phuongXa;
        payload.maTinhGHN = selectedDiaChi.maTinhGHN;
        payload.maHuyenGHN = selectedDiaChi.maHuyenGHN;
        payload.maXaGHN = selectedDiaChi.maXaGHN;
      }
      const res = await donHangApi.datHang(payload);
      const duLieu = res.data.duLieu as unknown as { maDonHang: string; urlThanhToan?: string };
      setCount(0);
      // VNPay: redirect to payment page
      if (phuongThuc === 'VNPAY' && duLieu?.urlThanhToan) {
        toast.success('Đang chuyển đến trang thanh toán VNPay...');
        window.location.href = duLieu.urlThanhToan;
        return;
      }
      toast.success('Đặt hàng thành công!');
      navigate(`/don-hang-cua-toi/${duLieu?.maDonHang}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { thongBao?: string } } })?.response?.data?.thongBao || 'Đặt hàng thất bại';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const tongHang = gioHang?.danhSachChiTiet?.reduce((s, ct) => s + (ct.thanhTien || 0), 0) || 0;
  const soTienGiam = khuyenMai?.soTienGiam || 0;
  const tongThanhToan = tongHang - soTienGiam + phiVanChuyen;

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Thông tin giao hàng</h2>

            {/* Select saved address */}
            {diaChiList.length > 0 && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Chọn địa chỉ đã lưu</label>
                <div className="space-y-2">
                  {diaChiList.map(dc => (
                    <label key={dc.id}
                      className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedDiaChi?.id === dc.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="diachi" checked={selectedDiaChi?.id === dc.id}
                        onChange={() => handleDiaChiChange(dc)}
                        className="mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{dc.hoTen} · {dc.soDienThoai}</p>
                        <p className="text-xs text-gray-500">{dc.diaChiDong1}, {dc.phuongXa}, {dc.quanHuyen}, {dc.tinhThanh}</p>
                        {dc.laMacDinh && <span className="badge badge-blue mt-1">Mặc định</span>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Họ tên người nhận *</label>
                  <input value={tenNguoiNhan} onChange={e => setTenNguoiNhan(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Số điện thoại *</label>
                  <input value={sdtNguoiNhan} onChange={e => setSdtNguoiNhan(e.target.value)} className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Địa chỉ giao hàng *</label>
                <textarea value={diaChiGiaoHang} onChange={e => setDiaChiGiaoHang(e.target.value)}
                  className="input-field resize-none" rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Ghi chú đơn hàng</label>
                <textarea value={ghiChu} onChange={e => setGhiChu(e.target.value)}
                  className="input-field resize-none" rows={2} placeholder="Ghi chú thêm cho đơn hàng..." />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Phương thức thanh toán</h2>
            <div className="space-y-2">
              {[
                { value: 'COD', label: '💵 Thanh toán khi nhận hàng (COD)' },
                { value: 'VNPAY', label: '💳 Thanh toán qua VNPay' },
              ].map(pt => (
                <label key={pt.value}
                  className={`flex gap-3 p-4 rounded-lg border cursor-pointer transition-all ${phuongThuc === pt.value ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="phuongthuc" value={pt.value} checked={phuongThuc === pt.value}
                    onChange={() => setPhuongThuc(pt.value)} />
                  <span className="text-sm font-medium">{pt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Promo code */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Mã khuyến mãi</h2>
            <div className="flex gap-3">
              <input value={maKhuyenMai} onChange={e => setMaKhuyenMai(e.target.value)}
                placeholder="Nhập mã khuyến mãi" className="input-field flex-1" />
              <button onClick={handleKiemTraKhuyenMai} className="btn-secondary px-4">Áp dụng</button>
            </div>
            {khuyenMai && (
              <p className="text-green-600 text-sm mt-2">✓ {khuyenMai.tenKhuyenMai} - Giảm {formatCurrency(khuyenMai.soTienGiam)}</p>
            )}
          </div>
        </div>

        {/* Right - Summary */}
        <div>
          <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-4 pb-4 border-b">Đơn hàng của bạn</h2>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {gioHang?.danhSachChiTiet?.map(ct => (
                <div key={ct.id} className="flex gap-3">
                  <img
                    src={ct.bienThe?.anhChinh ? getImageUrl(ct.bienThe.anhChinh) : PLACEHOLDER_IMG}
                    alt="" className="w-14 h-14 object-cover rounded-lg bg-gray-50"
                    onError={handleImgError}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{ct.bienThe?.tenSanPham}</p>
                    <p className="text-xs text-gray-500">x{ct.soLuong}</p>
                    <p className="text-sm font-semibold text-indigo-600">{formatCurrency(ct.thanhTien)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span><span>{formatCurrency(tongHang)}</span>
              </div>
              {soTienGiam > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span><span>-{formatCurrency(soTienGiam)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Phí ship {loadingShip ? '(tính toán...)' : ''}</span>
                <span className="text-green-600 font-medium">
                  {loadingShip ? '...' : formatCurrency(phiVanChuyen)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Tổng thanh toán</span>
                <span className="text-indigo-600">{formatCurrency(tongThanhToan)}</span>
              </div>
            </div>

            <button onClick={handleDatHang} disabled={submitting}
              className="btn-primary w-full py-3 mt-6 font-semibold">
              {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
