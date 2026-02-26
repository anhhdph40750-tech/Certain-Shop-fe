import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { sanPhamApi, gioHangApi } from '../services/api';
import type { SanPhamDetail } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { formatCurrency, getImageUrl, handleImgError } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ChiTietSanPhamPage() {
  const { duongDan } = useParams<{ duongDan: string }>();
  const [sanPham, setSanPham] = useState<SanPhamDetail | null>(null);
  const [soLuong, setSoLuong] = useState(1);
  const [selectedAnh, setSelectedAnh] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn, isNhanVien } = useAuthStore();
  const { increment } = useCartStore();
  const navigate = useNavigate();

  // ── Selections (source of truth — never set from derived state) ──
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);

  // ── Stable reference to variants (avoids spurious effect re-runs) ──
  const bienThe = useMemo(() => sanPham?.bienThe || [], [sanPham]);

  // Unique attribute lists derived from variants
  const colors = useMemo(() =>
    [...new Map(bienThe.filter(bt => bt.mauSac).map(bt => [bt.mauSac!.id, bt.mauSac!])).values()],
    [bienThe]);
  const sizes = useMemo(() =>
    [...new Map(bienThe.filter(bt => bt.kichThuoc).map(bt => [bt.kichThuoc!.id, bt.kichThuoc!])).values()],
    [bienThe]);
  const materials = useMemo(() =>
    [...new Map(bienThe.filter(bt => bt.chatLieu).map(bt => [bt.chatLieu!.id, bt.chatLieu!])).values()],
    [bienThe]);

  // ── selectedBienThe is DERIVED — no circular setState loop ──
  const selectedBienThe = useMemo(() =>
    bienThe.find(bt =>
      (!selectedColor || bt.mauSac?.id === selectedColor) &&
      (!selectedSize || bt.kichThuoc?.id === selectedSize) &&
      (!selectedMaterial || bt.chatLieu?.id === selectedMaterial)
    ) ?? null,
    [bienThe, selectedColor, selectedSize, selectedMaterial]);

  useEffect(() => {
    if (!duongDan) return;
    setLoading(true);
    sanPhamApi.chiTiet(duongDan).then(r => {
      const sp = r.data.duLieu;
      setSanPham(sp);
      // Set initial selections from the default variant — only once on load
      const def = sp.bienThe?.find((bt: { macDinh: boolean }) => bt.macDinh) || sp.bienThe?.[0] || null;
      if (def) {
        setSelectedColor(def.mauSac?.id ?? null);
        setSelectedSize(def.kichThuoc?.id ?? null);
        setSelectedMaterial(def.chatLieu?.id ?? null);
      }
      setSelectedAnh(0);
      setSoLuong(1);
    }).catch(() => {
      toast.error('Không tìm thấy sản phẩm');
    }).finally(() => setLoading(false));
  }, [duongDan]);

  // Reset image index when the selected variant changes
  useEffect(() => { setSelectedAnh(0); }, [selectedBienThe?.id]);

  const handleAddToCart = async () => {
    if (!isLoggedIn()) {
      toast.error('Vui lòng đăng nhập để mua hàng');
      navigate('/dang-nhap');
      return;
    }
    // Admin/Nhân viên không dùng giỏ hàng — điều hướng đúng nghiệp vụ
    if (isNhanVien()) {
      toast.error('Quản lý/Nhân viên vui lòng dùng giao diện Bán tại quầy (/quan-ly)');
      return;
    }
    if (!selectedBienThe) {
      toast.error('Vui lòng chọn biến thể');
      return;
    }
    if (selectedBienThe.soLuongTon < soLuong) {
      toast.error(`Chỉ còn ${selectedBienThe.soLuongTon} sản phẩm`);
      return;
    }
    try {
      await gioHangApi.them(selectedBienThe.id, soLuong);
      for (let i = 0; i < soLuong; i++) increment();
      toast.success('Đã thêm vào giỏ hàng!');
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/gio-hang');
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (!sanPham) return <div className="text-center py-20 text-gray-500">Không tìm thấy sản phẩm</div>;

  // Fall back to the first variant that actually has images if the selected one has none
  const images = (() => {
    if (selectedBienThe?.hinhAnh?.length) return selectedBienThe.hinhAnh;
    const withImages = bienThe.find(bt => bt.hinhAnh?.length);
    return withImages?.hinhAnh || [];
  })();
  const gia = selectedBienThe?.gia ?? sanPham.giaBan ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square mb-4">
            {images.length > 0 ? (
              <>
                <img
                  src={getImageUrl(images[selectedAnh]?.duongDan)}
                  alt={sanPham.tenSanPham}
                  className="w-full h-full object-cover"
                  onError={handleImgError}
                />
                {images.length > 1 && (
                  <>
                    <button onClick={() => setSelectedAnh(i => Math.max(0, i - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setSelectedAnh(i => Math.min(images.length - 1, i + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">
                👕
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedAnh(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${i === selectedAnh ? 'border-indigo-500' : 'border-transparent'}`}>
                  <img src={getImageUrl(img.duongDan)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          {sanPham.danhMuc && (
            <span className="text-indigo-500 text-sm font-medium">{sanPham.danhMuc.tenDanhMuc}</span>
          )}
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{sanPham.tenSanPham}</h1>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-indigo-600">{formatCurrency(gia)}</span>
            {sanPham.giaGoc > gia && (
              <span className="text-lg text-gray-400 line-through">{formatCurrency(sanPham.giaGoc)}</span>
            )}
          </div>

          {/* Color selection */}
          {colors.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Màu sắc: <span className="font-normal text-gray-500">
                  {colors.find(c => c.id === selectedColor)?.tenMauSac || 'Chưa chọn'}
                </span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {colors.map(c => (
                  <button key={c.id} onClick={() => setSelectedColor(c.id)}
                    title={c.tenMauSac}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${selectedColor === c.id ? 'border-indigo-500 scale-110 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-400'}`}
                    style={{ backgroundColor: c.maHex || '#ccc' }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size selection */}
          {sizes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Kích thước</p>
              <div className="flex gap-2 flex-wrap">
                {sizes.map(s => {
                  const available = bienThe.some(bt =>
                    bt.kichThuoc?.id === s.id &&
                    (!selectedColor || bt.mauSac?.id === selectedColor) &&
                    bt.soLuongTon > 0
                  );
                  return (
                    <button key={s.id} onClick={() => setSelectedSize(s.id)}
                      disabled={!available}
                      className={`min-w-12 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        selectedSize === s.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : available
                          ? 'border-gray-300 text-gray-700 hover:border-indigo-400'
                          : 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                      }`}>
                      {s.tenKichThuoc}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Material */}
          {materials.length > 1 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Chất liệu</p>
              <div className="flex gap-2 flex-wrap">
                {materials.map(m => (
                  <button key={m.id} onClick={() => setSelectedMaterial(m.id)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      selectedMaterial === m.id
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}>
                    {m.tenChatLieu}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock info */}
          {selectedBienThe && (
            <p className={`text-sm ${selectedBienThe.soLuongTon > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {selectedBienThe.soLuongTon > 0 ? `✓ Còn ${selectedBienThe.soLuongTon} sản phẩm` : '✗ Hết hàng'}
            </p>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <p className="text-sm font-semibold text-gray-700">Số lượng:</p>
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button onClick={() => setSoLuong(q => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-sm font-medium">{soLuong}</span>
              <button onClick={() => setSoLuong(q => Math.min((selectedBienThe?.soLuongTon || 99), q + 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={handleAddToCart}
              disabled={!selectedBienThe || selectedBienThe.soLuongTon === 0}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3 disabled:opacity-50">
              <ShoppingCart className="w-5 h-5" />
              Thêm vào giỏ
            </button>
            <button onClick={handleBuyNow}
              disabled={!selectedBienThe || selectedBienThe.soLuongTon === 0}
              className="flex-1 btn-primary py-3 disabled:opacity-50">
              Mua ngay
            </button>
          </div>

          {/* Description */}
          {sanPham.moTa && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Mô tả sản phẩm</h3>
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {sanPham.moTa}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
