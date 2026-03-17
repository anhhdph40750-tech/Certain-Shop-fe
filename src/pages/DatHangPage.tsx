import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gioHangApi, donHangApi, taiKhoanApi, ghnApi, voucherApi } from '../services/api';
import type { GioHang, DiaChi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { formatCurrency, getImageUrl, handleImgError, PLACEHOLDER_IMG } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

// Validation helpers
const isValidPhoneNumber = (phone: string): boolean => {
  return /^(\+84|0)[0-9]{9,10}$/.test(phone.replace(/\s/g, ''));
};

const isValidName = (name: string): boolean => {
  return name.trim().length >= 3 && name.trim().length <= 100;
};

export default function DatHangPage() {
  const [gioHang, setGioHang] = useState<GioHang | null>(null);
  const [diaChiList, setDiaChiList] = useState<DiaChi[]>([]);
  const [selectedDiaChi, setSelectedDiaChi] = useState<DiaChi | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [maVoucher, setMaVoucher] = useState('');
  const [voucherInfo, setVoucherInfo] = useState<{ maVoucher: string; giaTriGiam: number; giaTriSauGiam: number; hopLe: boolean } | null>(null);
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
  const shippingCalledRef = useRef<number | undefined>(undefined);  // Track address ID to avoid duplicate calls

  // Shipping calculation - stable reference when gioHang/address unchanged
  const tinhPhiVanChuyen = useCallback(async (maHuyen: number, maXa: string) => {
    setLoadingShip(true);
    try {
      // Use current gioHang from state (closure)
      const tongKg = gioHang?.danhSachChiTiet?.length || 1;
      const trongLuongGram = tongKg * 300;
      const res = await ghnApi.tinhPhi(maHuyen, maXa, trongLuongGram);
      const phi = res.data.duLieu?.fee || 0;
      setPhiVanChuyen(phi);
    } catch (err) {
      console.error('Lỗi tính phí:', err);
      setPhiVanChuyen(35000);
    } finally {
      setLoadingShip(false);
    }
  }, [gioHang]);  // Include gioHang - safe because shipping effect handles it

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
      
      // Set default address - don't call shipping here
      const macDinh = dcs.find(dc => dc.laMacDinh) || dcs[0] || null;
      setSelectedDiaChi(macDinh);
      
      if (macDinh) {
        setTenNguoiNhan(macDinh.hoTen || '');
        setSdtNguoiNhan(macDinh.soDienThoai || '');
        setDiaChiGiaoHang(`${macDinh.diaChiDong1}, ${macDinh.phuongXa}, ${macDinh.quanHuyen}, ${macDinh.tinhThanh}`);
      } else {
        const nd = thongTinRes.data.duLieu;
        setTenNguoiNhan(nd.hoTen || '');
        setSdtNguoiNhan(nd.soDienThoai || '');
      }
    }).finally(() => setLoading(false));
  }, [isLoggedIn, navigate]);

  // SEPARATE effect for shipping - only when selectedDiaChi changes
  useEffect(() => {
    if (!selectedDiaChi?.maHuyenGHN || !selectedDiaChi.maXaGHN) {
      setPhiVanChuyen(0);
      return;
    }
    
    // Only calculate once per address change
    if (!shippingCalledRef.current || selectedDiaChi.id !== shippingCalledRef.current) {
      shippingCalledRef.current = selectedDiaChi.id;
      tinhPhiVanChuyen(selectedDiaChi.maHuyenGHN, selectedDiaChi.maXaGHN);
    }
  }, [selectedDiaChi?.id, selectedDiaChi?.maHuyenGHN, selectedDiaChi?.maXaGHN, tinhPhiVanChuyen]);

  // Reset voucher when cart changes (avoid stale discount)
  useEffect(() => {
    setVoucherInfo(null);
    setMaVoucher('');
  }, [gioHang?.id]);

  const handleDiaChiChange = (dc: DiaChi) => {
    setSelectedDiaChi(dc);
    setTenNguoiNhan(dc.hoTen || '');
    setSdtNguoiNhan(dc.soDienThoai || '');
    setDiaChiGiaoHang(`${dc.diaChiDong1}, ${dc.phuongXa}, ${dc.quanHuyen}, ${dc.tinhThanh}`);
    // Shipping calculation will be triggered by useEffect watching selectedDiaChi
  };

  const handleKiemTraVoucher = async () => {
    if (!maVoucher.trim()) {
      toast.error('Vui lòng nhập mã voucher');
      return;
    }

    try {
      const tongHang = gioHang?.danhSachChiTiet?.reduce((s, ct) => {
        const donGia = ct.donGia || ct.bienThe?.gia || 0;
        return s + donGia * ct.soLuong;
      }, 0) || 0;

      const res = await voucherApi.tinhGiaTriGiam(maVoucher.toUpperCase().trim(), tongHang);
      const data = res.data?.duLieu;
      
      if (data?.hopLe) {
        setVoucherInfo(data);
        toast.success(`✓ Áp dụng voucher thành công - Giảm ${formatCurrency(data.giaTriGiam)}`);
      } else {
        toast.error('Mã voucher không hợp lệ hoặc đã hết hạn');
        setVoucherInfo(null);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { thongBao?: string } } })?.response?.data?.thongBao || 'Lỗi kiểm tra voucher';
      toast.error(msg);
      setVoucherInfo(null);
    }
  };

  const handleDatHang = async () => {
    // Validate cart is not empty
    if (!gioHang?.danhSachChiTiet?.length) {
      toast.error('Giỏ hàng trống');
      navigate('/gio-hang');
      return;
    }

    // Validate customer info
    if (!isValidName(tenNguoiNhan)) {
      toast.error('Tên người nhận phải từ 3-100 ký tự');
      return;
    }
    if (!isValidPhoneNumber(sdtNguoiNhan)) {
      toast.error('Số điện thoại không hợp lệ (10-11 chữ số)');
      return;
    }
    if (!diaChiGiaoHang || diaChiGiaoHang.trim().length < 10) {
      toast.error('Địa chỉ giao hàng phải từ 10 ký tự trở lên');
      return;
    }

    // Validate total amount is not negative or zero
    if (tongThanhToan <= 0) {
      toast.error('Tổng thanh toán không hợp lệ. Vui lòng kiểm tra giỏ hàng và mã khuyến mãi');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        tenNguoiNhan: tenNguoiNhan.trim(),
        soDienThoai: sdtNguoiNhan.replace(/\s/g, ''),
        diaChiCuThe: diaChiGiaoHang.trim(),
        phuongThucThanhToan: phuongThuc,
        ghiChu: ghiChu.trim() || null,
        maVoucher: voucherInfo?.maVoucher || null,
        phiVanChuyen: Math.max(0, phiVanChuyen), // Ensure no negative shipping
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

  // calculate totals using fallback for cases where backend returns 0
  const tongHang =
    gioHang?.danhSachChiTiet?.reduce((s, ct) => {
      const donGia = ct.donGia || ct.bienThe?.gia || 0;
      return s + donGia * ct.soLuong;
    }, 0) || 0;
  const soTienGiam = voucherInfo?.giaTriGiam || 0;
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

          {/* Voucher code */}
          {/* <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Mã voucher</h2>
            <div className="flex gap-3">
              <input value={maVoucher} onChange={e => setMaVoucher(e.target.value.toUpperCase())}
                placeholder="Nhập mã voucher" className="input-field flex-1" />
              <button onClick={handleKiemTraVoucher} className="btn-secondary px-4">Áp dụng</button>
            </div>
            {voucherInfo && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm font-medium">✓ {voucherInfo.maVoucher}</p>
                <p className="text-green-600 text-sm">Giảm: {formatCurrency(voucherInfo.giaTriGiam)}</p>
              </div>
            )}
          </div> */}
        </div>

        {/* Right - Summary */}
        <div>
          <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-4 pb-4 border-b">Đơn hàng của bạn</h2>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {gioHang?.danhSachChiTiet?.map(ct => {
                const donGia =  ct.bienThe?.gia || 0;
                const thanhTien = donGia * ct.soLuong;
                return (
                  <div key={ct.id} className="flex gap-3">
                    <img
                      src={ct.bienThe?.anhChinh ? getImageUrl(ct.bienThe.anhChinh) : PLACEHOLDER_IMG}
                      alt="" className="w-14 h-14 object-cover rounded-lg bg-gray-50"
                      onError={handleImgError}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{ct.bienThe?.tenSanPham}</p>
                      <p className="text-xs text-gray-500">x{ct.soLuong}</p>
                      <p className="text-sm font-semibold text-indigo-600">{formatCurrency(thanhTien)}</p>
                    </div>
                  </div>
                );
              })}
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
