import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Upload, X } from 'lucide-react';
import { adminApi, sanPhamApi, thuocTinhApi } from '../../services/api';
import type { SanPhamItem, BienThe as BienTheType, DanhMuc, ThuongHieu, MauSac, KichThuoc, ChatLieu } from '../../services/api';
import { formatCurrency, getImageUrl, trangThaiSanPhamLabel, handleImgError } from '../../utils/format';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function QuanLySanPhamPage() {
  const [danhSach, setDanhSach] = useState<SanPhamItem[]>([]);
  const [danhMuc, setDanhMuc] = useState<DanhMuc[]>([]);
  const [thuongHieu, setThuongHieu] = useState<ThuongHieu[]>([]);
  const [loading, setLoading] = useState(true);
  const [tuKhoa, setTuKhoa] = useState('');
  const [danhMucId, setDanhMucId] = useState<number | undefined>();
  const [trang, setTrang] = useState(0);
  const [tongTrang, setTongTrang] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingSanPham, setEditingSanPham] = useState<SanPhamItem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.danhSachSanPham({ tuKhoa: tuKhoa || undefined, danhMucId, trang })
      .then(r => {
        setDanhSach(r.data.duLieu?.sanPham || []);
        setTongTrang(r.data.duLieu?.tongTrang || 0);
      })
      .finally(() => setLoading(false));
  }, [tuKhoa, danhMucId, trang]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    sanPhamApi.danhMuc().then(r => setDanhMuc(r.data.duLieu || []));
    sanPhamApi.thuongHieu().then(r => setThuongHieu(r.data.duLieu || []));
  }, []);

  const xoa = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await adminApi.xoaSanPham(id);
      toast.success('Đã xóa sản phẩm');
      load();
    } catch {
      toast.error('Không thể xóa');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Quản lý sản phẩm</h2>
        <button onClick={() => { setEditingSanPham(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Thêm sản phẩm
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9 text-sm" placeholder="Tìm tên sản phẩm..."
            value={tuKhoa} onChange={e => { setTuKhoa(e.target.value); setTrang(0); }} />
        </div>
        <select className="input-field w-44 text-sm" value={danhMucId || ''}
          onChange={e => { setDanhMucId(e.target.value ? Number(e.target.value) : undefined); setTrang(0); }}>
          <option value="">Tất cả danh mục</option>
          {danhMuc.map(dm => <option key={dm.id} value={dm.id}>{dm.tenDanhMuc}</option>)}
        </select>
      </div>

      {showForm && (
        <SanPhamForm
          editingSanPham={editingSanPham}
          danhMuc={danhMuc}
          thuongHieu={thuongHieu}
          onSave={() => { setShowForm(false); load(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sản phẩm</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Danh mục</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Giá</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {danhSach.map(sp => (
                <tr key={sp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={getImageUrl(sp.anhChinh)} alt={sp.tenSanPham}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-100 bg-gray-50"
                        onError={handleImgError} />
                      <div>
                        <p className="font-medium text-gray-900">{sp.tenSanPham}</p>
                        <p className="text-xs text-gray-400">#{sp.maSanPham}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{sp.danhMuc?.tenDanhMuc || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-indigo-600">{formatCurrency(sp.giaBan)}</span>
                    {sp.giaGoc > sp.giaBan && (
                      <span className="text-xs text-gray-400 line-through ml-2">{formatCurrency(sp.giaGoc)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge badge-${sp.trangThaiSanPham === 'DANG_BAN' ? 'green' : sp.trangThaiSanPham === 'HET_HANG' ? 'red' : 'gray'} text-xs`}>
                      {trangThaiSanPhamLabel[sp.trangThaiSanPham] || sp.trangThaiSanPham}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a href={`/san-pham/${sp.duongDan}`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </a>
                      <button onClick={() => { setEditingSanPham(sp); setShowForm(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => xoa(sp.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {danhSach.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Không có sản phẩm</td></tr>
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

/* =================================================================
   FORM TẠO / SỬA SẢN PHẨM  (bao gồm quản lý biến thể + ảnh)
   ================================================================= */

interface BienTheForm {
  kichThuocId: string;
  mauSacId: string;
  chatLieuId: string;
  gia: string;
  soLuongTon: string;
  macDinh: boolean;
}

const EMPTY_BT: BienTheForm = { kichThuocId: '', mauSacId: '', chatLieuId: '', gia: '', soLuongTon: '0', macDinh: false };

function SanPhamForm({ editingSanPham, danhMuc, thuongHieu, onSave, onCancel }: {
  editingSanPham: SanPhamItem | null;
  danhMuc: DanhMuc[];
  thuongHieu: ThuongHieu[];
  onSave: () => void;
  onCancel: () => void;
}) {
  // --- product info ---
  const [form, setForm] = useState({
    tenSanPham: '', moTaChiTiet: '', giaGoc: '', danhMucId: '', thuongHieuId: '', trangThai: true,
  });
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // --- variants ---
  const [bienTheList, setBienTheList] = useState<BienTheType[]>([]);
  const [newBT, setNewBT] = useState<BienTheForm>({ ...EMPTY_BT });
  const [editingBTId, setEditingBTId] = useState<number | null>(null);
  const [editBTForm, setEditBTForm] = useState<BienTheForm>({ ...EMPTY_BT });

  // --- attribute options ---
  const [kichThuocOptions, setKichThuocOptions] = useState<KichThuoc[]>([]);
  const [mauSacOptions, setMauSacOptions] = useState<MauSac[]>([]);
  const [chatLieuOptions, setChatLieuOptions] = useState<ChatLieu[]>([]);

  // --- inline variants for NEW product ---
  const [inlineBTs, setInlineBTs] = useState<BienTheForm[]>([]);

  // --- bulk add mode ---
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkBTList, setBulkBTList] = useState<BienTheForm[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  // product ID after initial save (for new products → switch to edit mode)
  const [savedProductId, setSavedProductId] = useState<number | null>(editingSanPham?.id || null);
  const [savedDuongDan, setSavedDuongDan] = useState<string | null>(editingSanPham?.duongDan || null);

  // upload
  const [uploadingBTId, setUploadingBTId] = useState<number | null>(null);

  const isEditMode = !!editingSanPham || !!savedProductId;

  // Load attribute options
  useEffect(() => {
    thuocTinhApi.danhSachKichThuoc().then(r => setKichThuocOptions(r.data.duLieu || []));
    thuocTinhApi.danhSachMauSac().then(r => setMauSacOptions(r.data.duLieu || []));
    thuocTinhApi.danhSachChatLieu().then(r => setChatLieuOptions(r.data.duLieu || []));
  }, []);

  // Load product detail when editing
  useEffect(() => {
    if (!editingSanPham) return;
    setLoadingDetail(true);
    sanPhamApi.chiTiet(editingSanPham.duongDan)
      .then(r => {
        const sp = r.data.duLieu;
        if (!sp) return;
        setForm({
          tenSanPham: sp.tenSanPham || '',
          moTaChiTiet: sp.moTa || '',
          giaGoc: sp.giaGoc != null ? String(sp.giaGoc) : '',
          danhMucId: sp.danhMuc?.id ? String(sp.danhMuc.id) : '',
          thuongHieuId: sp.thuongHieu?.id ? String(sp.thuongHieu.id) : '',
          trangThai: sp.trangThaiSanPham === 'DANG_BAN',
        });
        setBienTheList(sp.bienThe || []);
        setSavedProductId(sp.id);
        setSavedDuongDan(sp.duongDan);
      })
      .finally(() => setLoadingDetail(false));
  }, [editingSanPham]);

  // Reload variants helper
  const reloadVariants = async () => {
    if (!savedDuongDan) return;
    try {
      const r = await sanPhamApi.chiTiet(savedDuongDan);
      setBienTheList(r.data.duLieu?.bienThe || []);
      // Also update savedDuongDan in case slug changed
      setSavedDuongDan(r.data.duLieu?.duongDan || savedDuongDan);
    } catch { /* ignore */ }
  };

  // ======================== SAVE PRODUCT ========================
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenSanPham.trim() || !form.giaGoc) {
      toast.error('Vui lòng điền tên và giá sản phẩm');
      return;
    }
    if (!form.danhMucId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        tenSanPham: form.tenSanPham.trim(),
        moTaChiTiet: form.moTaChiTiet,
        giaGoc: Number(form.giaGoc),
        danhMucId: form.danhMucId ? Number(form.danhMucId) : null,
        thuongHieuId: form.thuongHieuId ? Number(form.thuongHieuId) : null,
        trangThai: form.trangThai,
      };
      if (savedProductId) {
        await adminApi.capNhatSanPham(savedProductId, data);
        toast.success('Cập nhật sản phẩm thành công');
        // reload to get new duongDan if name changed
        if (savedDuongDan) {
          try {
            const r = await adminApi.danhSachSanPham({ tuKhoa: form.tenSanPham.trim(), trang: 0 });
            const found = (r.data.duLieu?.sanPham || []).find(s => s.id === savedProductId);
            if (found) setSavedDuongDan(found.duongDan);
          } catch { /* ignore */ }
        }
      } else {
        // new product — include inline variants
        if (inlineBTs.length > 0) {
          data.danhSachBienThe = inlineBTs.map(bt => ({
            kichThuocId: bt.kichThuocId ? Number(bt.kichThuocId) : null,
            mauSacId: bt.mauSacId ? Number(bt.mauSacId) : null,
            chatLieuId: bt.chatLieuId ? Number(bt.chatLieuId) : null,
            gia: bt.gia ? Number(bt.gia) : null,
            soLuongTon: bt.soLuongTon ? Number(bt.soLuongTon) : 0,
            macDinh: bt.macDinh,
          }));
        }
        const res = await adminApi.taoSanPham(data);
        const newSp = res.data.duLieu as { id: number; duongDan: string } | undefined;
        if (newSp?.id) {
          setSavedProductId(newSp.id);
          setSavedDuongDan(newSp.duongDan);
          toast.success('Tạo sản phẩm thành công! Bạn có thể thêm biến thể và ảnh.');
          // load variants
          setTimeout(async () => {
            if (newSp.duongDan) {
              try {
                const r = await sanPhamApi.chiTiet(newSp.duongDan);
                setBienTheList(r.data.duLieu?.bienThe || []);
              } catch { /* ignore */ }
            }
          }, 300);
        } else {
          toast.success('Tạo sản phẩm thành công');
          onSave();
          return;
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { thongBao?: string } } })?.response?.data?.thongBao || 'Có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ======================== VARIANT CRUD ========================
  const addVariant = async () => {
    if (!savedProductId) {
      // For new product, add to inline list
      setInlineBTs(prev => [...prev, { ...newBT, macDinh: prev.length === 0 }]);
      setNewBT({ ...EMPTY_BT });
      return;
    }
    try {
      await adminApi.taoBienThe(savedProductId, {
        kichThuocId: newBT.kichThuocId ? Number(newBT.kichThuocId) : null,
        mauSacId: newBT.mauSacId ? Number(newBT.mauSacId) : null,
        chatLieuId: newBT.chatLieuId ? Number(newBT.chatLieuId) : null,
        gia: newBT.gia ? Number(newBT.gia) : null,
        soLuongTon: newBT.soLuongTon ? Number(newBT.soLuongTon) : 0,
        macDinh: newBT.macDinh,
      });
      toast.success('Thêm biến thể thành công');
      setNewBT({ ...EMPTY_BT });
      await reloadVariants();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { thongBao?: string } } })?.response?.data?.thongBao || 'Lỗi thêm biến thể';
      toast.error(msg);
    }
  };

  const addBulkVariants = async () => {
    if (!savedProductId || bulkBTList.length === 0) {
      toast.error('Không có biến thể để thêm');
      return;
    }
    setBulkSaving(true);
    try {
      await adminApi.taoBulkBienThe(savedProductId, bulkBTList.map(bt => ({
        kichThuocId: bt.kichThuocId ? Number(bt.kichThuocId) : null,
        mauSacId: bt.mauSacId ? Number(bt.mauSacId) : null,
        chatLieuId: bt.chatLieuId ? Number(bt.chatLieuId) : null,
        gia: bt.gia ? Number(bt.gia) : null,
        soLuongTon: bt.soLuongTon ? Number(bt.soLuongTon) : 0,
        macDinh: bt.macDinh,
      })));
      toast.success(`Thêm ${bulkBTList.length} biến thể thành công`);
      setBulkBTList([]);
      setBulkMode(false);
      await reloadVariants();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { thongBao?: string } } })?.response?.data?.thongBao || 'Lỗi thêm bulk biến thể';
      toast.error(msg);
    } finally {
      setBulkSaving(false);
    }
  };

  const updateVariant = async (bienTheId: number) => {
    try {
      await adminApi.capNhatBienThe(bienTheId, {
        kichThuocId: editBTForm.kichThuocId ? Number(editBTForm.kichThuocId) : null,
        mauSacId: editBTForm.mauSacId ? Number(editBTForm.mauSacId) : null,
        chatLieuId: editBTForm.chatLieuId ? Number(editBTForm.chatLieuId) : null,
        gia: editBTForm.gia ? Number(editBTForm.gia) : null,
        soLuongTon: editBTForm.soLuongTon ? Number(editBTForm.soLuongTon) : 0,
        macDinh: editBTForm.macDinh,
      });
      toast.success('Cập nhật biến thể thành công');
      setEditingBTId(null);
      await reloadVariants();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { thongBao?: string } } })?.response?.data?.thongBao || 'Lỗi cập nhật biến thể';
      toast.error(msg);
    }
  };

  const deleteVariant = async (bienTheId: number) => {
    if (!confirm('Xóa biến thể này?')) return;
    try {
      await adminApi.xoaBienThe(bienTheId);
      toast.success('Đã xóa biến thể');
      await reloadVariants();
    } catch {
      toast.error('Lỗi xóa biến thể');
    }
  };

  const startEditBT = (bt: BienTheType) => {
    setEditingBTId(bt.id);
    setEditBTForm({
      kichThuocId: bt.kichThuoc?.id ? String(bt.kichThuoc.id) : '',
      mauSacId: bt.mauSac?.id ? String(bt.mauSac.id) : '',
      chatLieuId: bt.chatLieu?.id ? String(bt.chatLieu.id) : '',
      gia: bt.gia != null ? String(bt.gia) : '',
      soLuongTon: bt.soLuongTon != null ? String(bt.soLuongTon) : '0',
      macDinh: !!bt.macDinh,
    });
  };

  // ======================== IMAGE UPLOAD ========================
  const handleImageUpload = async (bienTheId: number, file: File, laAnhChinh = false) => {
    try {
      setUploadingBTId(bienTheId);
      await adminApi.uploadAnhBienThe(bienTheId, file, laAnhChinh);
      toast.success('Upload ảnh thành công');
      await reloadVariants();
    } catch {
      toast.error('Lỗi upload ảnh');
    } finally {
      setUploadingBTId(null);
    }
  };

  const deleteImage = async (anhId: number) => {
    try {
      await adminApi.xoaAnh(anhId);
      toast.success('Đã xóa ảnh');
      await reloadVariants();
    } catch {
      toast.error('Lỗi xóa ảnh');
    }
  };

  // ======================== RENDER ========================
  if (loadingDetail) return <div className="bg-white rounded-xl border p-8 mb-6 text-center"><LoadingSpinner /></div>;

  // Get available sizes for selected color
  const getAvailableSizesForColor = (colorId: string): KichThuoc[] => {
    if (!colorId) return kichThuocOptions; // Show all sizes if no color selected
    
    // Get all variants with this color
    const variantsWithColor = bienTheList.filter(bt => 
      bt.mauSac?.id === Number(colorId)
    );
    
    // Extract unique size IDs from those variants
    const sizeIds = new Set(variantsWithColor.map(bt => bt.kichThuoc?.id).filter(Boolean));
    
    // Filter options to only show available sizes
    if (sizeIds.size === 0) return kichThuocOptions; // If no variants, show all
    return kichThuocOptions.filter(k => sizeIds.has(k.id));
  };

  const renderBTSelects = (btForm: BienTheForm, setBTForm: (f: BienTheForm) => void) => {
    const availableSizes = getAvailableSizesForColor(btForm.mauSacId);
    
    return (
      <>
        <select className="input-field text-sm" value={btForm.kichThuocId}
          onChange={e => setBTForm({ ...btForm, kichThuocId: e.target.value })}>
          <option value="">Kích thước</option>
          {kichThuocOptions.map(k => (
            <option key={k.id} value={k.id} disabled={btForm.mauSacId ? !availableSizes.some(as => as.id === k.id) : false}>
              {k.kichCo}
            </option>
          ))}
        </select>
        <select className="input-field text-sm" value={btForm.mauSacId}
          onChange={e => {
            const newMauSacId = e.target.value;
            const newAvailableSizes = getAvailableSizesForColor(newMauSacId);
            
            // Reset size if current size not available for new color
            const newKichThuocId = btForm.kichThuocId && newAvailableSizes.some(k => String(k.id) === btForm.kichThuocId)
              ? btForm.kichThuocId
              : '';
            
            setBTForm({ ...btForm, mauSacId: newMauSacId, kichThuocId: newKichThuocId });
          }}>
          <option value="">Màu sắc</option>
          {mauSacOptions.map(m => (
            <option key={m.id} value={m.id}>
              {m.tenMau}
            </option>
          ))}
        </select>
        <select className="input-field text-sm" value={btForm.chatLieuId}
          onChange={e => setBTForm({ ...btForm, chatLieuId: e.target.value })}>
          <option value="">Chất liệu</option>
          {chatLieuOptions.map(c => <option key={c.id} value={c.id}>{c.tenChatLieu}</option>)}
        </select>
        <input type="number" className="input-field text-sm" placeholder="Giá" value={btForm.gia}
          onChange={e => setBTForm({ ...btForm, gia: e.target.value })} />
        <input type="number" className="input-field text-sm" placeholder="Tồn kho" value={btForm.soLuongTon}
          onChange={e => setBTForm({ ...btForm, soLuongTon: e.target.value })} />
        <label className="flex items-center gap-1 text-xs whitespace-nowrap">
          <input type="checkbox" checked={btForm.macDinh}
            onChange={e => setBTForm({ ...btForm, macDinh: e.target.checked })} />
          Mặc định
        </label>
      </>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 space-y-6">
      {/* ===== THÔNG TIN SẢN PHẨM ===== */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">
          {isEditMode ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h3>
        <form onSubmit={saveProduct} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
            <input className="input-field" value={form.tenSanPham}
              onChange={e => setForm({ ...form, tenSanPham: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá gốc *</label>
            <input type="number" className="input-field" value={form.giaGoc}
              onChange={e => setForm({ ...form, giaGoc: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
            <select className="input-field" value={form.danhMucId}
              onChange={e => setForm({ ...form, danhMucId: e.target.value })} required>
              <option value="">-- Chọn --</option>
              {danhMuc.map(dm => <option key={dm.id} value={dm.id}>{dm.tenDanhMuc}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
            <select className="input-field" value={form.thuongHieuId}
              onChange={e => setForm({ ...form, thuongHieuId: e.target.value })}>
              <option value="">-- Chọn --</option>
              {thuongHieu.map(th => <option key={th.id} value={th.id}>{th.tenThuongHieu}</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-6">
              <input type="checkbox" checked={form.trangThai}
                onChange={e => setForm({ ...form, trangThai: e.target.checked })} />
              Đang bán
            </label>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea className="input-field resize-none" rows={3} value={form.moTaChiTiet}
              onChange={e => setForm({ ...form, moTaChiTiet: e.target.value })} />
          </div>
          <div className="col-span-2 flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? 'Đang lưu...' : isEditMode ? 'Cập nhật thông tin' : 'Lưu sản phẩm'}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary text-sm">
              {isEditMode ? 'Đóng' : 'Hủy'}
            </button>
            {isEditMode && (
              <button type="button" onClick={onSave} className="btn-secondary text-sm ml-auto">
                ✓ Hoàn tất
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ===== BIẾN THỂ — CHỈ HIỆN KHI NEW-chưa-save hoặc EDIT ===== */}
      <div className="border-t border-gray-100 pt-6">
        <h4 className="font-semibold text-gray-900 mb-3">Biến thể sản phẩm</h4>

        {/* Variant list for edit mode */}
        {isEditMode && bienTheList.length > 0 && (
          <div className="space-y-3 mb-4">
            {bienTheList.map(bt => (
              <div key={bt.id} className="border border-gray-100 rounded-lg p-3">
                {editingBTId === bt.id ? (
                  /* EDITING variant */
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {renderBTSelects(editBTForm, setEditBTForm)}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateVariant(bt.id)}
                        className="btn-primary text-xs px-3 py-1">Lưu</button>
                      <button onClick={() => setEditingBTId(null)}
                        className="btn-secondary text-xs px-3 py-1">Hủy</button>
                    </div>
                  </div>
                ) : (
                  /* DISPLAY variant */
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 text-sm">
                        {bt.mauSac && (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: bt.mauSac.maHex || '#ccc' }} />
                            {bt.mauSac.tenMauSac}
                          </span>
                        )}
                        {bt.kichThuoc && <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{bt.kichThuoc.tenKichThuoc}</span>}
                        {bt.chatLieu && <span className="text-gray-500">{bt.chatLieu.tenChatLieu}</span>}
                        <span className="font-semibold text-indigo-600">{formatCurrency(bt.gia)}</span>
                        <span className="text-gray-400">Tồn: {bt.soLuongTon}</span>
                        {bt.macDinh && <span className="badge badge-blue text-xs">Mặc định</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEditBT(bt)}
                          className="p-1 text-gray-400 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteVariant(bt.id)}
                          className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    {/* Images */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {bt.hinhAnh?.map(img => (
                        <div key={img.id} className="relative group w-16 h-16">
                          <img src={getImageUrl(img.duongDan)} alt=""
                            className={`w-16 h-16 rounded-lg object-cover border-2 ${img.laAnhChinh ? 'border-indigo-400' : 'border-gray-100'}`}
                            onError={handleImgError} />
                          <button onClick={() => deleteImage(img.id)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                          {img.laAnhChinh && (
                            <span className="absolute bottom-0 left-0 right-0 bg-indigo-500 text-white text-center text-[8px] rounded-b-lg">
                              Chính
                            </span>
                          )}
                        </div>
                      ))}
                      {/* Upload button */}
                      <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                        {uploadingBTId === bt.id ? (
                          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-gray-400" />
                        )}
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const isFirst = !bt.hinhAnh || bt.hinhAnh.length === 0;
                              handleImageUpload(bt.id, file, isFirst);
                            }
                            e.target.value = '';
                          }} />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Inline variants for NEW product */}
        {!isEditMode && inlineBTs.length > 0 && (
          <div className="space-y-2 mb-4">
            {inlineBTs.map((bt, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded-lg">
                <span className="w-5 text-center text-gray-400">{idx + 1}</span>
                <span>{kichThuocOptions.find(k => String(k.id) === bt.kichThuocId)?.kichCo || '—'}</span>
                <span>{mauSacOptions.find(m => String(m.id) === bt.mauSacId)?.tenMau || '—'}</span>
                <span>{chatLieuOptions.find(c => String(c.id) === bt.chatLieuId)?.tenChatLieu || '—'}</span>
                <span className="font-semibold">{bt.gia ? formatCurrency(Number(bt.gia)) : '—'}</span>
                <span className="text-gray-400">SL: {bt.soLuongTon}</span>
                {bt.macDinh && <span className="badge badge-blue text-xs">Mặc định</span>}
                <button onClick={() => setInlineBTs(prev => prev.filter((_, i) => i !== idx))}
                  className="ml-auto p-1 text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Add variant form */}
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2 items-end mb-3">
          {renderBTSelects(newBT, setNewBT)}
          <button type="button" onClick={addVariant}
            className="btn-primary text-xs px-3 py-2 flex items-center gap-1 justify-center">
            <Plus className="w-3 h-3" /> Thêm
          </button>
        </div>

        {/* Bulk add mode toggle and form */}
        {isEditMode && (
          <>
            <button type="button" onClick={() => setBulkMode(!bulkMode)}
              className="btn-secondary text-xs mb-3 px-3 py-1.5 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Thêm nhiều ({bulkBTList.length})
            </button>

            {bulkMode && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded">
                <h5 className="font-medium text-blue-900 mb-2 text-sm">Thêm nhiều biến thể cùng lúc</h5>
                
                {/* Display bulk list */}
                {bulkBTList.length > 0 && (
                  <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                    {bulkBTList.map((bt, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-blue-200">
                        <span className="w-5 text-center text-gray-400">#{idx + 1}</span>
                        <span className="flex-1">{kichThuocOptions.find(k => String(k.id) === bt.kichThuocId)?.kichCo || '—'} | {mauSacOptions.find(m => String(m.id) === bt.mauSacId)?.tenMau || '—'} | {chatLieuOptions.find(c => String(c.id) === bt.chatLieuId)?.tenChatLieu || '—'}</span>
                        <span className="font-semibold">{bt.gia ? formatCurrency(Number(bt.gia)) : '—'}</span>
                        <span className="text-gray-400">SL: {bt.soLuongTon}</span>
                        <button onClick={() => setBulkBTList(prev => prev.filter((_, i) => i !== idx))}
                          className="p-0.5 text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bulk input form */}
                <div className="bg-white p-3 rounded border border-blue-200 mb-3">
                  <div className="grid grid-cols-3 md:grid-cols-7 gap-2 items-end mb-2">
                    {renderBTSelects(newBT, setNewBT)}
                    <button type="button" onClick={() => {
                      if (!newBT.kichThuocId || !newBT.mauSacId || !newBT.chatLieuId || !newBT.gia) {
                        toast.error('Vui lòng điền đầy đủ thông tin');
                        return;
                      }
                      setBulkBTList(prev => [...prev, { ...newBT, gia: newBT.gia || '0' }]);
                      setNewBT({ ...EMPTY_BT, soLuongTon: '10' });
                    }}
                      className="btn-primary text-xs px-2 py-2 flex items-center gap-1 justify-center whitespace-nowrap col-span-1">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>

                {/* Bulk actions */}
                <div className="flex gap-2">
                  <button type="button" onClick={addBulkVariants} disabled={bulkSaving}
                    className="btn-primary text-xs px-3 py-1.5">
                    {bulkSaving ? `Đang thêm ${bulkBTList.length}...` : `✓ Lưu ${bulkBTList.length} biến thể`}
                  </button>
                  <button type="button" onClick={() => { setBulkMode(false); setBulkBTList([]); }}
                    className="btn-secondary text-xs px-3 py-1.5">
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!isEditMode && (
          <p className="text-xs text-gray-400 mt-2">
            Thêm biến thể trước khi lưu. Sau khi lưu sản phẩm, bạn có thể upload ảnh cho từng biến thể.
          </p>
        )}
      </div>
    </div>
  );
}
