import { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Trash2, UserPlus, CreditCard, Banknote, 
  Printer, Scan, X, Minus, ChevronRight, History, 
  AlertCircle, CheckCircle2, ShoppingCart, LogOut
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { posService } from '../../services/posService';
import { formatCurrency, formatDate } from '../../utils/format';
import InvoicePrint from '../../components/InvoicePrint';

interface CartItem {
  id: number;
  tenSanPham: string;
  kichThuoc: string;
  mauSac: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  anhUrl: string;
}

interface Invoice {
  id: number;
  maHoaDon: string;
  chiTiet: CartItem[];
  tongTien: number;
  soTienGiam?: number;
  khachHang?: any;
}

export default function BanHangTaiQuayPage() {
  const [activeInvoiceId, setActiveInvoiceId] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  
  const [productQuery, setProductQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  const [paymentMethod, setPaymentMethod] = useState('TIEN_MAT');
  const [amountPaid, setAmountPaid] = useState<string>('');
  
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [openingBalance, setOpeningBalance] = useState('0');
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Initial load
  useEffect(() => {
    checkShift();
    loadHoaDonCho();
    
    // Global barcode listener could be added here
  }, []);

  const checkShift = async () => {
    try {
      const res = await posService.getCaHienTai();
      if (res.data) {
        setIsShiftOpen(true);
        setCurrentShift(res.data);
      } else {
        setIsShiftOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadHoaDonCho = async () => {
    try {
      const res = await posService.getHoaDonCho();
      // Assuming data and converting to our local interface
      // Note: BanHangTaiQuayController currently returns a String (View), 
      // so this might need adjustment if using REST APIs.
      // For now, I'll mock some data or assume they exist.
    } catch (err) {
      // toast.error('Lỗi khi tải danh sách hóa đơn chờ');
    }
  };

  useEffect(() => {
    if (activeInvoiceId) {
      loadChiTiet(activeInvoiceId);
    } else {
      setActiveInvoice(null);
    }
  }, [activeInvoiceId]);

  const loadChiTiet = async (id: number) => {
    try {
      const res = await posService.getChiTietHoaDon(id);
      if (res.data.thanhCong) {
        setActiveInvoice(res.data);
      }
    } catch (err) {
      toast.error('Lỗi khi tải chi tiết hóa đơn');
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const res = await posService.taoHoaDon();
      if (res.data.thanhCong) {
        const newInvoice = {
          id: res.data.idHoaDon,
          maHoaDon: res.data.maHoaDon,
          chiTiet: [],
          tongTien: 0
        };
        setInvoices(prev => [...prev, newInvoice]);
        setActiveInvoiceId(newInvoice.id);
        toast.success('Đã tạo hóa đơn mới');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.thongBao || 'Lỗi khi tạo hóa đơn');
    }
  };

  const handleProductSearch = async (val: string) => {
    setProductQuery(val);
    if (val.length >= 2) {
      try {
        const res = await posService.timSanPham(val);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productQuery) return;
    try {
      const res = await posService.quetMaVach(productQuery);
      if (res.data) {
        addProductToInvoice(res.data.id);
        setProductQuery('');
      } else {
        toast.error('Không tìm thấy sản phẩm match mã vạch');
      }
    } catch (err) {
      toast.error('Lỗi tìm kiếm mã vạch');
    }
  };

  const addProductToInvoice = async (bienTheId: number) => {
    if (!activeInvoiceId) {
      toast.error('Vui lòng chọn hoặc tạo hóa đơn trước');
      return;
    }
    try {
      const res = await posService.themSanPham(activeInvoiceId, bienTheId, 1);
      if (res.data.thanhCong) {
        loadChiTiet(activeInvoiceId);
        setSearchResults([]);
        setProductQuery('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.thongBao || 'Lỗi khi thêm sản phẩm');
    }
  };

  const updateQuantity = async (chiTietId: number, newQty: number) => {
    if (newQty < 1) return;
    try {
      const res = await posService.capNhatSoLuong(chiTietId, newQty);
      if (res.data.thanhCong && activeInvoiceId) {
        loadChiTiet(activeInvoiceId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.thongBao || 'Lỗi khi cập nhật số lượng');
    }
  };

  const removeProduct = async (chiTietId: number) => {
    try {
      const res = await posService.xoaSanPham(chiTietId);
      if (res.data.thanhCong && activeInvoiceId) {
        loadChiTiet(activeInvoiceId);
      }
    } catch (err) {
      toast.error('Lỗi khi xóa sản phẩm');
    }
  };

  const handlePayment = async () => {
    if (!activeInvoiceId || !activeInvoice) return;
    if (activeInvoice.chiTiet.length === 0) {
      toast.error('Hóa đơn chưa có sản phẩm');
      return;
    }

    try {
      const res = await posService.thanhToan(activeInvoiceId, {
        phuongThucThanhToan: paymentMethod,
        tienKhachDua: parseFloat(amountPaid) || activeInvoice.tongTien,
        khachHangId: selectedCustomer?.id,
        tenKhach: selectedCustomer?.hoTen || 'Khách lẻ',
        sdtKhach: selectedCustomer?.soDienThoai || ''
      });

      if (res.data.thanhCong) {
        toast.success('Thanh toán thành công');
        // Close invoice locally
        setInvoices(prev => prev.filter(i => i.id !== activeInvoiceId));
        setCompletedOrder(res.data.donHang || activeInvoice); // Use returned order for print
        setIsPrintModalOpen(true);
        setActiveInvoiceId(null);
        setAmountPaid('');
        setSelectedCustomer(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.thongBao || 'Lỗi khi thanh toán');
    }
  };

  const handleStartShift = async () => {
    try {
      await posService.batDauCa(parseFloat(openingBalance));
      checkShift();
    } catch (err) {
      toast.error('Lỗi khi mở ca');
    }
  };

  const handleEndShift = async () => {
    if (!currentShift) return;
    try {
      const tienThucTe = prompt('Nhập số tiền thực tế đếm được:');
      if (tienThucTe === null) return;
      
      await posService.ketThucCa(currentShift.id, {
        tienThucTe: parseFloat(tienThucTe),
        ghiChu: 'Kết thúc ca làm việc'
      });
      setIsShiftOpen(false);
      setCurrentShift(null);
      toast.success('Đã kết thúc ca làm việc');
    } catch (err) {
      toast.error('Lỗi khi kết thúc ca');
    }
  };

  if (!isShiftOpen) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scan className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Bắt đầu ca bán hàng</h2>
          <p className="text-gray-500 mb-8">Vui lòng nhập số tiền đầu ca để tiếp tục.</p>
          
          <div className="text-left mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền đầu ca (VNĐ)</label>
            <input 
              type="number" 
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              placeholder="0"
            />
          </div>
          
          <button 
            onClick={handleStartShift}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95"
          >
            MỞ CA LÀM VIỆC
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col -m-6 bg-gray-100">
      {/* Top Header */}
      <header className="bg-gray-900 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            {invoices.map(inv => (
              <button 
                key={inv.id}
                onClick={() => setActiveInvoiceId(inv.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeInvoiceId === inv.id ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {inv.maHoaDon}
                <X 
                  className="w-3 h-3 hover:text-red-400" 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle close
                  }} 
                />
              </button>
            ))}
            <button 
              onClick={handleCreateInvoice}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-indigo-400 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right mr-4 text-xs font-medium">
            <p className="text-gray-400">Nhân viên: {currentShift?.nhanVien?.hoTen}</p>
            <p>Ca bắt đầu: {formatDate(currentShift?.thoiGianBatDau)}</p>
          </div>
          <button 
            onClick={handleEndShift}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-lg text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" /> KẾT THÚC CA
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Product Selection */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden border-r border-gray-200">
          <div className="mb-4 relative">
            <form onSubmit={handleBarcodeScan} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  value={productQuery}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc quét mã vạch (F2)..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  autoFocus
                />
              </div>
              <button 
                type="submit"
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg active:scale-95 transition-all"
              >
                <Scan className="w-5 h-5" /> QUÉT
              </button>
            </form>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 max-h-[60vh] overflow-y-auto">
                {searchResults.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => addProductToInvoice(p.id)}
                    className="flex items-center gap-4 p-3 hover:bg-indigo-50 rounded-xl cursor-pointer transition-all animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={p.anhUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{p.tenSanPham}</p>
                      <p className="text-xs text-gray-500">
                        Màu: <span className="font-semibold">{p.mauSac}</span> | 
                        Size: <span className="font-semibold">{p.kichThuoc}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600">{formatCurrency(p.giaBan)}</p>
                      <p className={`text-[10px] font-bold ${p.soLuongTon < 5 ? 'text-red-500' : 'text-green-500'}`}>
                        Còn {p.soLuongTon} sản phẩm
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Đơn giá</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Số lượng</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Thành tiền</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeInvoice?.chiTiet.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img src={item.anhUrl} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{item.tenSanPham}</p>
                            <p className="text-[10px] text-gray-500">{item.mauSac} - {item.kichThuoc}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">{formatCurrency(item.donGia)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.id, item.soLuong - 1)}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-all active:scale-90"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold w-4 text-center">{item.soLuong}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.soLuong + 1)}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-all active:scale-90"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-indigo-600">{formatCurrency(item.thanhTien)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => removeProduct(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!activeInvoice || activeInvoice.chiTiet.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 animate-bounce">
                          <ShoppingCart className="w-16 h-16 text-gray-200" />
                          <p className="text-gray-400 font-medium">Hóa đơn chưa có sản phẩm nào</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-indigo-50 p-6 border-t border-indigo-100 flex justify-between items-center">
              <span className="text-indigo-900 font-bold uppercase tracking-tight">Số lượng: {activeInvoice?.chiTiet.reduce((sum, i) => sum + i.soLuong, 0) || 0}</span>
              <div className="text-right">
                <p className="text-indigo-500 text-xs font-bold uppercase mb-1">Tổng cộng hàng</p>
                <p className="text-3xl font-black text-indigo-600 tracking-tighter">{formatCurrency(activeInvoice?.tongTien || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Customer & Payment */}
        <div className="w-[450px] p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Customer Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Khách hàng
              </h3>
              <button className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all">
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Tìm khách hàng (Số điện thoại)..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            {selectedCustomer ? (
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-indigo-900">{selectedCustomer.hoTen}</p>
                  <p className="text-xs text-indigo-500 font-medium">{selectedCustomer.soDienThoai}</p>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 text-indigo-300 hover:text-red-500 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-center">
                <p className="text-xs text-gray-400 font-medium italic">Chưa chọn khách hàng (Mặc định: Khách lẻ)</p>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" /> Chi tiết thanh toán
            </h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Tổng tiền hàng</span>
                <span className="font-bold text-gray-800">{formatCurrency(activeInvoice?.tongTien || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Tiền giảm giá</span>
                <span className="font-bold text-red-500">-{formatCurrency(activeInvoice?.soTienGiam || 0)}</span>
              </div>
              <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                <span className="text-gray-800 font-black text-lg">KHÁCH PHẢI TRẢ</span>
                <span className="text-2xl font-black text-indigo-600 tracking-tighter">
                  {formatCurrency((activeInvoice?.tongTien || 0) - (activeInvoice?.soTienGiam || 0))}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">Hình thức</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setPaymentMethod('TIEN_MAT')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    paymentMethod === 'TIEN_MAT' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Banknote className="w-6 h-6" />
                  <span className="text-xs font-bold">TIỀN MẶT</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('CHUYEN_KHOAN')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    paymentMethod === 'CHUYEN_KHOAN' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-bold">CHUYỂN KHOẢN</span>
                </button>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tiền khách đưa</label>
                <button 
                  onClick={() => setAmountPaid(String((activeInvoice?.tongTien || 0) - (activeInvoice?.soTienGiam || 0)))}
                  className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md"
                >
                  Tất cả
                </button>
              </div>
              <div className="relative">
                <input 
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-900 border-none rounded-2xl text-white font-black text-2xl tracking-tighter focus:ring-4 focus:ring-indigo-500/50 outline-none transition-all placeholder-gray-700"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">VNĐ</span>
              </div>
            </div>

            {/* Change Result */}
            {(parseFloat(amountPaid) || 0) > ((activeInvoice?.tongTien || 0) - (activeInvoice?.soTienGiam || 0)) && (
              <div className="mb-8 animate-in slide-in-from-bottom-2 fade-in">
                <div className="p-4 bg-green-50 rounded-2xl border border-green-200 flex justify-between items-center">
                  <span className="text-green-800 font-bold">Tiền thừa trả khách:</span>
                  <span className="text-xl font-black text-green-600">
                    {formatCurrency((parseFloat(amountPaid) || 0) - ((activeInvoice?.tongTien || 0) - (activeInvoice?.soTienGiam || 0)))}
                  </span>
                </div>
              </div>
            )}

            <button 
              onClick={handlePayment}
              disabled={!activeInvoiceId || activeInvoice?.chiTiet.length === 0}
              className="mt-auto w-full group relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(79,70,229,0.4)] active:scale-95 flex items-center justify-center gap-3"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-xl">THANH TOÁN (F12)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Print Modal */}
      {isPrintModalOpen && completedOrder && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl p-10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 leading-tight">Giao dịch thành công</h2>
                  <p className="text-gray-500 font-medium">Mã hóa đơn: <span className="text-indigo-600 font-bold">{completedOrder.maDonHang || completedOrder.maHoaDon}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <InvoicePrint donHang={completedOrder} onClose={() => setIsPrintModalOpen(false)} />
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 flex justify-center gap-8">
               <button className="flex items-center gap-3 text-indigo-600 font-bold hover:text-indigo-800 transition-all p-4 bg-indigo-50 rounded-2xl">
                 Zalo / SMS / Email
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Focus Listener */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
}
