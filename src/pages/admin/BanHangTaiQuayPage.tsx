import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Plus, Trash2, UserPlus, CreditCard, Banknote,
  X, Minus, CheckCircle2, ShoppingCart, Tag, Ticket, Mail,
  Receipt, AlertCircle, Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { posService } from '../../services/posService';
import { voucherApi } from '../../services/api';
import { formatCurrency, getImageUrl, handleImgError, PLACEHOLDER_IMG } from '../../utils/format';
import InvoicePrint from '../../components/InvoicePrint';

const MAX_INVOICES = 5;

interface CartItem {
  id: number;
  bienTheId: number;
  tenSanPham: string;
  kichThuoc: string;
  mauSac: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  anhUrl: string;
  soLuongTon: number;
}

interface Invoice {
  id: number;
  maDonHang: string;
  chiTiet: CartItem[];
  tongTien: number;
  soTienGiamGia: number;
  tongTienThanhToan: number;
  khachHang?: { id: number; hoTen: string; soDienThoai: string };
  khuyenMai?: { id: number; maKhuyenMai: string; tenKhuyenMai: string };
}

interface VoucherItem {
  id: number;
  maVoucher: string;
  moTa: string;
  loaiGiam: string;
  giaTriGiam: number;
  giaTriToiThieu: number;
  giaTriGiamToiDa: number;
  duDieuKien: boolean;
  lyDoKhongDuDieuKien: string;
  soTienGiam: number;
}

export default function BanHangTaiQuayPage() {
  const [hoaDonChoList, setHoaDonChoList] = useState<{ id: number; maDonHang: string; soMatHang: number; tongTien: number }[]>([]);
  const [activeInvoiceId, setActiveInvoiceId] = useState<number | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  const [productQuery, setProductQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [paymentMethod, setPaymentMethod] = useState('TIEN_MAT');
  const [amountPaid, setAmountPaid] = useState('');
  const [emailBienlai, setEmailBienlai] = useState('');

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Voucher modal
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherList, setVoucherList] = useState<VoucherItem[]>([]);
  const [loadingVoucher, setLoadingVoucher] = useState(false);
  const [maVoucherInput, setMaVoucherInput] = useState('');

  // Modal xóa sản phẩm (nhập số lượng cần xóa)
  const [deleteModal, setDeleteModal] = useState<{ item: CartItem } | null>(null);
  const [deleteQty, setDeleteQty] = useState(1);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Load hóa đơn chờ
  const loadHoaDonCho = useCallback(async () => {
    try {
      const res = await posService.getHoaDonCho();
      setHoaDonChoList(res.data.duLieu || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadHoaDonCho(); }, [loadHoaDonCho]);

  // Load chi tiết hóa đơn khi chọn tab
  const loadChiTiet = useCallback(async (id: number) => {
    try {
      const res = await posService.getChiTietHoaDon(id);
      const d = res.data.duLieu;
      setActiveInvoice({
        id: d.id,
        maDonHang: d.maDonHang,
        chiTiet: (d.chiTiet || []).map((ct: any) => ({
          id: ct.id,
          bienTheId: ct.bienTheId,
          tenSanPham: ct.tenSanPham,
          kichThuoc: ct.kichThuoc || '',
          mauSac: ct.mauSac || '',
          soLuong: ct.soLuong,
          donGia: ct.donGia,
          thanhTien: ct.thanhTien,
          anhUrl: ct.anhUrl,
          soLuongTon: ct.soLuongTon || 0,
        })),
        tongTien: d.tongTien || 0,
        soTienGiamGia: d.soTienGiamGia || 0,
        tongTienThanhToan: d.tongTienThanhToan || 0,
        khachHang: d.khachHang || null,
        khuyenMai: d.khuyenMai || null,
      });
      if (d.khachHang) setSelectedCustomer(d.khachHang);
    } catch {
      toast.error('Lỗi khi tải chi tiết hóa đơn');
    }
  }, []);

  useEffect(() => {
    if (activeInvoiceId) {
      loadChiTiet(activeInvoiceId);
    } else {
      setActiveInvoice(null);
      setSelectedCustomer(null);
    }
  }, [activeInvoiceId, loadChiTiet]);

  // ==== Hóa đơn ====
  const handleCreateInvoice = async () => {
    if (hoaDonChoList.length >= MAX_INVOICES) {
      toast.error(`Đã đạt tối đa ${MAX_INVOICES} hóa đơn. Vui lòng hoàn tất hoặc hủy bớt.`);
      return;
    }
    try {
      const res = await posService.taoHoaDon();
      const d = res.data.duLieu;
      setHoaDonChoList(prev => [...prev, { id: d.id, maDonHang: d.maDonHang, soMatHang: 0, tongTien: 0 }]);
      setActiveInvoiceId(d.id);
      toast.success('Đã tạo hóa đơn mới');
    } catch (err: any) {
      toast.error(err.response?.data?.thongBao || 'Lỗi khi tạo hóa đơn');
    }
  };

  const handleHuyHoaDon = async (id: number) => {
    if (!confirm('Hủy hóa đơn này?')) return;
    try {
      await posService.huyHoaDon(id);
      setHoaDonChoList(prev => prev.filter(h => h.id !== id));
      if (activeInvoiceId === id) {
        setActiveInvoiceId(null);
      }
      toast.success('Đã hủy hóa đơn');
    } catch (err: any) {
      toast.error(err.response?.data?.thongBao || 'Lỗi khi hủy');
    }
  };
  

  // ==== Tìm sản phẩm ====
  const handleProductSearch = (val: string) => {
    setProductQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await posService.timSanPham(val);
        setSearchResults(res.data.duLieu || []);
      } catch { /* ignore */ }
    }, 300);
  };

  // Load toàn bộ sản phẩm khi focus vào ô tìm kiếm
  const handleProductFocus = () => {
    if (searchResults.length === 0 && !productQuery) {
      posService.timSanPham('').then(res => {
        setSearchResults(res.data.duLieu || []);
      }).catch(() => {});
    }
  };

  const addProductToInvoice = async (bienTheId: number) => {
    if (!activeInvoiceId) {
      toast.error('Vui lòng tạo hóa đơn trước');
      return;
    }
    try {
      await posService.themSanPham(activeInvoiceId, bienTheId, 1);
      loadChiTiet(activeInvoiceId);
      loadHoaDonCho();
      setSearchResults([]);
      setProductQuery('');
    } catch (err: any) {
      toast.error(err.response?.data?.thongBao || 'Lỗi khi thêm sản phẩm');
    }
  };

  const updateQuantity = async (chiTietId: number, newQty: number) => {
    if (newQty < 1) return;
    try {
      await posService.capNhatSoLuong(chiTietId, newQty);
      if (activeInvoiceId) {
        loadChiTiet(activeInvoiceId);
        loadHoaDonCho();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.thongBao || 'Lỗi khi cập nhật');
    }
  };

  const openDeleteModal = (item: CartItem) => {
    setDeleteQty(item.soLuong); // mặc định xóa hết
    setDeleteModal({ item });
  };

  const confirmDelete = async () => {
    if (!deleteModal || !activeInvoiceId) return;
    const { item } = deleteModal;
    const qty = deleteQty;
    setDeleteModal(null);

    try {
      if (qty >= item.soLuong) {
        // Xóa hết → gọi API xóa
        await posService.xoaSanPham(item.id);
      } else {
        // Giảm số lượng
        await posService.capNhatSoLuong(item.id, item.soLuong - qty);
      }
      loadChiTiet(activeInvoiceId);
      loadHoaDonCho();
    } catch (err: any) {
      toast.error(err.response?.data?.thongBao || 'Lỗi khi xóa sản phẩm');
    }
  };

  // ==== Voucher ====
  const openVoucherModal = async () => {
    if (!activeInvoice) return;
    setShowVoucherModal(true);
    setLoadingVoucher(true);
    try {
      const tongHang = activeInvoice.tongTien || 0;
      const res = await voucherApi.danhSachChoDonHang(tongHang);
      setVoucherList(res.data.duLieu || []);
    } catch {
      toast.error('Lỗi khi tải danh sách voucher');
    } finally {
      setLoadingVoucher(false);
    }
  };

  const handleApVoucher = async (maVoucher: string) => {
    if (!activeInvoiceId) return;
    try {
      await posService.apVoucher(activeInvoiceId, maVoucher);
      toast.success('Áp dụng voucher thành công');
      setShowVoucherModal(false);
      setMaVoucherInput('');
      loadChiTiet(activeInvoiceId);
    } catch (err: any) {
      toast.error(err.response?.data?.thongBao || 'Voucher không hợp lệ');
    }
  };

  const handleXoaVoucher = async () => {
    if (!activeInvoiceId) return;
    try {
      await posService.xoaVoucher(activeInvoiceId);
      toast.success('Đã xóa voucher');
      loadChiTiet(activeInvoiceId);
    } catch (err: any) {
      toast.error(err.response?.data?.thongBao || 'Lỗi');
    }
  };

  // ==== Khách hàng ====
  const handleCustomerSearch = (val: string) => {
    setCustomerQuery(val);
    if (val.length >= 2) {
      posService.timKhachHang(val).then(res => {
        setCustomerResults(res.data.duLieu || []);
      }).catch(() => {});
    } else {
      setCustomerResults([]);
    }
  };

  // ==== Thanh toán ====
  const handlePayment = async () => {
    if (!activeInvoiceId || !activeInvoice) return;
    if (activeInvoice.chiTiet.length === 0) {
      toast.error('Hóa đơn chưa có sản phẩm');
      return;
    }

    try {
      const res = await posService.thanhToan(activeInvoiceId, {
        phuongThucThanhToan: paymentMethod,
        khachHangId: selectedCustomer?.id,
        tenKhach: selectedCustomer?.hoTen || 'Khách lẻ',
        sdtKhach: selectedCustomer?.soDienThoai || '',
        emailBienlai: emailBienlai.trim() || undefined,
      });

      toast.success('Thanh toán thành công!');
      const d = res.data.duLieu;

      // Pre-fill email if customer has one
      if (selectedCustomer?.email && !emailBienlai) {
        setEmailBienlai(selectedCustomer.email);
      }

      // Prepare data for print
      setCompletedOrder({
        maDonHang: d.maDonHang,
        tongTienThanhToan: d.tongTienThanhToan,
        phuongThucThanhToan: d.phuongThucThanhToan,
        daThanhToan: true,
        trangThaiDonHang: 'HOAN_TAT',
        tongTienHang: activeInvoice.tongTien,
        soTienGiamGia: activeInvoice.soTienGiamGia,
        phiVanChuyen: 0,
        tenNguoiNhan: selectedCustomer?.hoTen || 'Khách lẻ',
        sdtNguoiNhan: selectedCustomer?.soDienThoai || '',
        thoiGianTao: new Date().toISOString(),
        danhSachChiTiet: activeInvoice.chiTiet.map(ct => ({
          id: ct.id,
          soLuong: ct.soLuong,
          giaTaiThoiDiemMua: ct.donGia,
          thanhTien: ct.thanhTien,
          bienThe: { tenSanPham: ct.tenSanPham, kichThuoc: ct.kichThuoc, tenMauSac: ct.mauSac },
        })),
      });
      setIsPrintModalOpen(true);

      // Clean up
      setHoaDonChoList(prev => prev.filter(h => h.id !== activeInvoiceId));
      setActiveInvoiceId(null);
      setAmountPaid('');
      setEmailBienlai('');
      setSelectedCustomer(null);
    } catch (err: any) {
      toast.error(err.response?.data?.thongBao || 'Lỗi khi thanh toán');
    }
  };

  const tongPhaiTra = Math.max(0, (activeInvoice?.tongTien || 0) - (activeInvoice?.soTienGiamGia || 0));
  const tienThua = (parseFloat(amountPaid) || 0) - tongPhaiTra;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 bg-slate-100">

      {/* ── TOP BAR: Invoice Tabs ── */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 shadow-sm">
        <Receipt className="w-5 h-5 text-indigo-600 shrink-0" />
        <span className="text-sm font-bold text-slate-500 shrink-0 mr-1">Hóa đơn:</span>

        <div className="flex gap-1.5 flex-1 overflow-x-auto">
          {hoaDonChoList.length === 0 && (
            <span className="text-sm text-slate-400 italic self-center">Chưa có hóa đơn nào — bấm <strong>+</strong> để tạo</span>
          )}
          {hoaDonChoList.map(inv => (
            <button
              key={inv.id}
              onClick={() => setActiveInvoiceId(inv.id)}
              className={`group shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeInvoiceId === inv.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              <span>{inv.maDonHang}</span>
              {inv.soMatHang > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeInvoiceId === inv.id ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
                  {inv.soMatHang}
                </span>
              )}
              <X
                className="w-3 h-3 opacity-50 group-hover:opacity-100 hover:text-red-500"
                onClick={(e) => { e.stopPropagation(); handleHuyHoaDon(inv.id); }}
              />
            </button>
          ))}
        </div>

        {hoaDonChoList.length < MAX_INVOICES ? (
          <button
            onClick={handleCreateInvoice}
            title="Tạo hóa đơn mới"
            className="shrink-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <span className="shrink-0 text-xs text-red-500 font-semibold">Đã đủ {MAX_INVOICES}</span>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT PANEL */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Product search */}
          <div className="p-4 pb-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={productQuery}
                onChange={(e) => handleProductSearch(e.target.value)}
                onFocus={handleProductFocus}
                placeholder="🔍  Tìm sản phẩm theo tên, màu sắc, kích cỡ..."
                disabled={!activeInvoiceId}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none transition-all placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {productQuery && (
                <button onClick={() => { setProductQuery(''); setSearchResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[52vh] overflow-y-auto">
                  {searchResults.map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => addProductToInvoice(p.id)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                        <img src={p.anhUrl ? getImageUrl(p.anhUrl) : PLACEHOLDER_IMG} alt="" className="w-full h-full object-cover" onError={handleImgError} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{p.tenSanPham}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {p.mauSac && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ background: p.maHex || '#ccc' }} />
                              {p.mauSac}
                            </span>
                          )}
                          {p.kichThuoc && <span className="text-xs text-slate-400">· Size {p.kichThuoc}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-indigo-600 text-sm">{formatCurrency(p.giaBan)}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.soLuongTon < 5 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                          Còn {p.soLuongTon}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart table */}
          <div className="flex-1 m-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2rem_1fr_6rem_7.5rem_6.5rem_2.5rem] px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">#</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sản phẩm</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase text-right">Đơn giá</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Số lượng</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase text-right">Thành tiền</span>
              <span></span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {activeInvoice?.chiTiet.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-[2rem_1fr_6rem_7.5rem_6.5rem_2.5rem] px-4 py-3 items-center hover:bg-slate-50 transition-colors group">
                  <span className="text-xs text-slate-400 font-medium">{idx + 1}</span>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={item.anhUrl ? getImageUrl(item.anhUrl) : PLACEHOLDER_IMG} className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" onError={handleImgError} alt="" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.tenSanPham}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.mauSac}{item.kichThuoc ? ` · ${item.kichThuoc}` : ''}
                        <span className={`ml-1.5 font-bold ${item.soLuongTon < 5 ? 'text-red-500' : 'text-emerald-500'}`}>
                          · Tồn: {item.soLuongTon}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-right text-slate-600">{formatCurrency(item.donGia)}</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.soLuong - 1)}
                      title="Giảm"
                      className="w-6 h-6 rounded-full border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 flex items-center justify-center transition-colors">
                      <Minus className="w-3 h-3 text-slate-500" />
                    </button>
                    <span className="font-bold w-7 text-center text-sm text-slate-800">{item.soLuong}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.soLuong + 1)}
                      title="Tăng"
                      className="w-6 h-6 rounded-full border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3 text-slate-500" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-right text-indigo-600">{formatCurrency(item.thanhTien)}</span>
                  <button
                    onClick={() => openDeleteModal(item)}
                    title="Xoá"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {(!activeInvoice || activeInvoice.chiTiet.length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <ShoppingCart className="w-14 h-14 mb-3" />
                  <p className="font-semibold text-sm">
                    {activeInvoiceId ? 'Hóa đơn chưa có sản phẩm' : 'Chọn hoặc tạo hóa đơn để bắt đầu'}
                  </p>
                  {!activeInvoiceId && (
                    <button onClick={handleCreateInvoice} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
                      + Tạo hóa đơn mới
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Cart footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-500">
                {activeInvoice?.chiTiet.reduce((s, i) => s + i.soLuong, 0) || 0} sản phẩm
              </span>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Tổng tiền hàng</p>
                <p className="text-xl font-black text-indigo-600">{formatCurrency(activeInvoice?.tongTien || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[380px] shrink-0 flex flex-col gap-3 p-4 overflow-y-auto border-l border-slate-200 bg-white">

          {/* Customer section */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" /> Khách hàng
            </p>
            {selectedCustomer ? (
              <div className="flex items-center justify-between px-3 py-2.5 bg-indigo-50 rounded-xl border border-indigo-200">
                <div>
                  <p className="font-bold text-indigo-900 text-sm">{selectedCustomer.hoTen}</p>
                  <p className="text-xs text-indigo-500">{selectedCustomer.soDienThoai}</p>
                </div>
                <button
                  onClick={() => { setSelectedCustomer(null); setCustomerQuery(''); setEmailBienlai(''); }}
                  title="Xóa khách hàng"
                  className="p-1 text-indigo-300 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  value={customerQuery}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  placeholder="Tìm SĐT, tên khách hàng..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none transition-all"
                />
                {customerResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-44 overflow-y-auto">
                    {customerResults.map((kh: any) => (
                      <div
                        key={kh.id}
                        onClick={() => { setSelectedCustomer(kh); setCustomerResults([]); setCustomerQuery(''); setEmailBienlai(kh.email || ''); }}
                        className="px-3 py-2.5 hover:bg-indigo-50 cursor-pointer text-sm transition-colors border-b border-slate-50 last:border-0"
                      >
                        <span className="font-semibold text-slate-800">{kh.hoTen}</span>
                        <span className="text-slate-400 ml-2 text-xs">{kh.soDienThoai}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1 italic">Không chọn → mặc định Khách lẻ</p>
          </div>

          <hr className="border-slate-100" />

          {/* Voucher section */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" /> Voucher / Khuyến mãi
            </p>
            {(activeInvoice?.khuyenMai || (activeInvoice?.soTienGiamGia && activeInvoice.soTienGiamGia > 0)) ? (
              <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <div>
                  <p className="font-bold text-emerald-800 text-sm">
                    {activeInvoice?.khuyenMai?.maKhuyenMai ?? 'Voucher áp dụng'}
                  </p>
                  <p className="text-xs text-emerald-600">Giảm {formatCurrency(activeInvoice?.soTienGiamGia || 0)}</p>
                </div>
                <button onClick={handleXoaVoucher} title="Xóa voucher" className="p-1 text-emerald-300 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openVoucherModal}
                disabled={!activeInvoice || activeInvoice.chiTiet.length === 0}
                className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-indigo-400 text-slate-400 hover:text-indigo-600 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Tag className="w-3.5 h-3.5 inline mr-1.5" />Chọn hoặc nhập mã voucher
              </button>
            )}
          </div>

          <hr className="border-slate-100" />


          <hr className="border-slate-100" />

          {/* Payment summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Tổng tiền hàng</span>
              <span className="font-semibold text-slate-700">{formatCurrency(activeInvoice?.tongTien || 0)}</span>
            </div>
            {(activeInvoice?.soTienGiamGia || 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Giảm giá</span>
                <span className="font-semibold">-{formatCurrency(activeInvoice?.soTienGiamGia || 0)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="font-black text-slate-800">Khách phải trả <span className="text-red-500">*</span></span>
              <span className="text-lg font-black text-indigo-600">{formatCurrency(tongPhaiTra)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Hình thức thanh toán <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { k: 'TIEN_MAT', label: 'Tiền mặt', icon: Banknote },
                { k: 'CHUYEN_KHOAN', label: 'Chuyển khoản', icon: CreditCard },
              ].map(({ k, label, icon: Icon }) => (
                <button
                  key={k}
                  onClick={() => setPaymentMethod(k)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    paymentMethod === k
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash amount */}
          {paymentMethod === 'TIEN_MAT' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Khách đưa</p>
                <button
                  onClick={() => setAmountPaid(String(tongPhaiTra))}
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  Đủ tiền
                </button>
              </div>
              <input
  type="number"
  value={amountPaid}
  onChange={(e) => setAmountPaid(e.target.value)}
  placeholder="0"
  className="w-full px-4 py-3 bg-white text-gray-900 font-black text-xl rounded-xl 
             border border-gray-800 outline-none 
             focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
             placeholder:text-gray-400"
/>
              {tienThua > 0 && (
                <div className="mt-2 flex justify-between items-center px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 font-bold text-sm">Tiền thừa</span>
                  <span className="font-black text-emerald-600">{formatCurrency(tienThua)}</span>
                </div>
              )}
              {parseFloat(amountPaid) > 0 && tienThua < 0 && (
                <div className="mt-2 flex items-center gap-1.5 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-red-600 text-xs font-semibold">Chưa đủ tiền ({formatCurrency(Math.abs(tienThua))})</span>
                </div>
              )}
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={handlePayment}
            disabled={!activeInvoiceId || !activeInvoice || activeInvoice.chiTiet.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>THANH TOÁN</span>
          </button>
        </div>
      </div>

      {/* ── VOUCHER MODAL ── */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-indigo-600" /> Chọn voucher
              </h2>
              <button onClick={() => setShowVoucherModal(false)} title="Đóng" className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Manual input */}
            <div className="px-5 pt-3 pb-2 flex gap-2 border-b border-slate-100">
              <input
                value={maVoucherInput}
                onChange={e => setMaVoucherInput(e.target.value.toUpperCase())}
                placeholder="Nhập mã voucher thủ công..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              />
              <button
                onClick={() => maVoucherInput.trim() && handleApVoucher(maVoucherInput.trim())}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all"
              >
                Áp dụng
              </button>
            </div>

            {/* Voucher list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {loadingVoucher ? (
                <p className="text-center text-slate-400 py-10 text-sm">Đang tải voucher...</p>
              ) : voucherList.length === 0 ? (
                <p className="text-center text-slate-400 py-10 text-sm">Không có voucher nào</p>
              ) : voucherList.map(v => (
                <div
                  key={v.id}
                  onClick={() => v.duDieuKien && handleApVoucher(v.maVoucher)}
                  className={`p-3.5 rounded-xl border transition-all ${
                    v.duDieuKien
                      ? 'border-indigo-200 bg-indigo-50 cursor-pointer hover:border-indigo-500 hover:shadow-md'
                      : 'border-slate-200 bg-slate-50 opacity-55 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-800">{v.maVoucher}</span>
                    {v.duDieuKien ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Đủ điều kiện</span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Không đủ ĐK</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-1">
                    {v.moTa || (v.loaiGiam === 'PERCENT' ? `Giảm ${v.giaTriGiam}%` : `Giảm ${formatCurrency(v.giaTriGiam)}`)}
                    {v.giaTriToiThieu > 0 && ` · ĐH từ ${formatCurrency(v.giaTriToiThieu)}`}
                  </p>
                  {v.duDieuKien && v.soTienGiam > 0 && (
                    <p className="text-sm font-bold text-indigo-600">Tiết kiệm {formatCurrency(v.soTienGiam)}</p>
                  )}
                  {!v.duDieuKien && v.lyDoKhongDuDieuKien && (
                    <p className="text-[11px] text-red-500 mt-1">{v.lyDoKhongDuDieuKien}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE QUANTITY MODAL ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Xóa sản phẩm</h3>
                  <p className="text-xs text-slate-500">Nhập số lượng muốn xóa</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3">
                <img
                  src={deleteModal.item.anhUrl ? getImageUrl(deleteModal.item.anhUrl) : PLACEHOLDER_IMG}
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                  onError={handleImgError} alt=""
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{deleteModal.item.tenSanPham}</p>
                  <p className="text-[11px] text-slate-400">
                    {deleteModal.item.mauSac}{deleteModal.item.kichThuoc ? ` · ${deleteModal.item.kichThuoc}` : ''}
                    <span className="ml-1.5">· Đang có: <strong className="text-slate-600">{deleteModal.item.soLuong}</strong></span>
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Số lượng xóa</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDeleteQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4 text-slate-600" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={deleteModal.item.soLuong}
                  value={deleteQty}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 1;
                    setDeleteQty(Math.min(Math.max(1, v), deleteModal.item.soLuong));
                  }}
                  className="flex-1 text-center text-xl font-black py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none"
                />
                <button
                  onClick={() => setDeleteQty(q => Math.min(deleteModal.item.soLuong, q + 1))}
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              {/* Quick buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setDeleteQty(1)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    deleteQty === 1 ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-200 text-slate-400 hover:border-red-300'
                  }`}
                >1</button>
                {deleteModal.item.soLuong > 2 && (
                  <button
                    onClick={() => setDeleteQty(Math.floor(deleteModal.item.soLuong / 2))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      deleteQty === Math.floor(deleteModal.item.soLuong / 2) ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-200 text-slate-400 hover:border-red-300'
                    }`}
                  >{Math.floor(deleteModal.item.soLuong / 2)}</button>
                )}
                <button
                  onClick={() => setDeleteQty(deleteModal.item.soLuong)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    deleteQty === deleteModal.item.soLuong ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-200 text-slate-400 hover:border-red-300'
                  }`}
                >Tất cả ({deleteModal.item.soLuong})</button>
              </div>
              {deleteQty >= deleteModal.item.soLuong && (
                <p className="mt-2 text-xs text-red-500 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Sản phẩm sẽ bị xóa hoàn toàn khỏi hóa đơn
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all"
              >Hủy</button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa {deleteQty} sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT MODAL ── */}
      {isPrintModalOpen && completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Giao dịch thành công!</h2>
                  <p className="text-slate-500 text-xs">Mã: <span className="text-indigo-600 font-bold">{completedOrder.maDonHang}</span></p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                title="Đóng"
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <InvoicePrint donHang={completedOrder} onClose={() => setIsPrintModalOpen(false)} />
            </div>
            {/* Elegant Print & Download bar */}
            <div className="px-6 py-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50 flex items-center justify-between gap-4 rounded-b-2xl">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-white transition-all"
              >Đóng</button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const printArea = document.querySelector('.invoice-print-area');
                    if (!printArea) return;
                    const printWindow = window.open('', '', 'height=900,width=1000');
                    if (!printWindow) { toast.error('Vui lòng cho phép popup để in hóa đơn'); return; }
                    printWindow.document.write('<html><head><title>Hóa đơn ' + completedOrder.maDonHang + '</title>');
                    printWindow.document.write('<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;padding:0}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}@page{size:A4;margin:10mm}</style>');
                    printWindow.document.write('</head><body>');
                    printWindow.document.write(printArea.innerHTML);
                    printWindow.document.write('</body></html>');
                    printWindow.document.close();
                    printWindow.print();
                  }}
                  className="group relative px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 flex items-center gap-2.5"
                >
                  <Printer className="w-4.5 h-4.5" />
                  <span>In hóa đơn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
