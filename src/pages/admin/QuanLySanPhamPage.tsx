import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, Upload, X, Layers } from 'lucide-react';
import { adminApi, sanPhamApi, thuocTinhApi } from '../../services/api';
import type { SanPhamItem, BienThe as BienTheType, DanhMuc, ThuongHieu, MauSac, KichThuoc, ChatLieu } from '../../services/api';
import { formatCurrency, getImageUrl, trangThaiSanPhamLabel, handleImgError } from '../../utils/format';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function QuanLySanPhamPage() {
  const [danhSach, setDanhSach] = useState<SanPhamItem[]>([]);
  const [danhMuc, setDanhMuc] = useState<DanhMuc[]>([]);
  const [thuongHieu, setThuongHieu] = useState<ThuongHieu[]>([]);
  const [chatLieu, setChatLieu] = useState<ChatLieu[]>([]);
  const [loading, setLoading] = useState(true);
  const [tuKhoa, setTuKhoa] = useState('');
  const [danhMucId, setDanhMucId] = useState<number | undefined>();
  const [trang, setTrang] = useState(0);
  const [tongTrang, setTongTrang] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingSanPham, setEditingSanPham] = useState<SanPhamItem | null>(null);
  const [showBienTheModal, setShowBienTheModal] = useState(false);
  const [selectedSanPham, setSelectedSanPham] = useState<SanPhamItem | null>(null);
  const [btKichThuocOptions, setBtKichThuocOptions] = useState<KichThuoc[]>([]);
  const [btMauSacOptions, setBtMauSacOptions] = useState<MauSac[]>([]);
  const [bienTheModalList, setBienTheModalList] = useState<BienTheType[]>([]);
  const [loadingBienThe, setLoadingBienThe] = useState(false);

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
    thuocTinhApi.danhSachChatLieu().then(r => setChatLieu(r.data.duLieu || []));
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

  const loadBienTheData = async (sp: SanPhamItem) => {
    setLoadingBienThe(true);
    try {
      const [ktRes, msRes, detailRes] = await Promise.all([
        thuocTinhApi.danhSachKichThuoc(),
        thuocTinhApi.danhSachMauSac(),
        sanPhamApi.chiTiet(sp.duongDan),
      ]);
      setBtKichThuocOptions(ktRes.data.duLieu || []);
      setBtMauSacOptions(msRes.data.duLieu || []);
      setBienTheModalList(detailRes.data.duLieu?.bienThe || []);
    } catch {
      toast.error('Không thể tải biến thể sản phẩm');
    } finally {
      setLoadingBienThe(false);
    }
  };

  const openBienTheModal = (sp: SanPhamItem) => {
    setSelectedSanPham(sp);
    setShowBienTheModal(true);
    void loadBienTheData(sp);
  };

  const handleSaveBienThe = async (rows: BienTheForm[]) => {
    if (!selectedSanPham) return;
    if (!rows.length) {
      toast.error('Không có biến thể để lưu');
      return;
    }
    try {
      await adminApi.taoBulkBienThe(selectedSanPham.id, rows.map(bt => ({
        kichThuocId: bt.kichThuocId ? Number(bt.kichThuocId) : null,
        mauSacId: bt.mauSacId ? Number(bt.mauSacId) : null,
        chatLieuId: null,
        gia: bt.gia ? Number(bt.gia) : null,
        soLuongTon: bt.soLuongTon ? Number(bt.soLuongTon) : 0,
        macDinh: bt.macDinh,
      })));
      toast.success(`Đã lưu ${rows.length} biến thể`);
      if (selectedSanPham.duongDan) {
        const detailRes = await sanPhamApi.chiTiet(selectedSanPham.duongDan);
        setBienTheModalList(detailRes.data.duLieu?.bienThe || []);
      }
    } catch {
      toast.error('Lỗi lưu biến thể');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tạo, cập nhật sản phẩm và quản lý biến thể/ảnh theo từng biến thể.
          </p>
        </div>
        <button
          onClick={() => { setEditingSanPham(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2 text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm sản phẩm
        </button>
      </div>

      <div className="card p-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1 min-w-60 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input-field pl-9 text-sm"
              placeholder="Tìm theo tên hoặc mã sản phẩm..."
              value={tuKhoa}
              onChange={e => { setTuKhoa(e.target.value); setTrang(0); }}
            />
          </div>
          <select
            className="input-field w-56 text-sm bg-white"
            value={danhMucId || ''}
            onChange={e => { setDanhMucId(e.target.value ? Number(e.target.value) : undefined); setTrang(0); }}
          >
            <option value="">Tất cả danh mục</option>
            {danhMuc.map(dm => <option key={dm.id} value={dm.id}>{dm.tenDanhMuc}</option>)}
          </select>
          <button
            type="button"
            onClick={() => { setTuKhoa(''); setDanhMucId(undefined); setTrang(0); }}
            className="btn-secondary text-sm"
            disabled={!tuKhoa && !danhMucId}
            title="Xóa bộ lọc"
          >
            Làm mới
          </button>
        </div>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {editingSanPham ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
                </h3>
                <p className="text-xs text-gray-500">
                  Nhập thông tin sản phẩm và bấm lưu để hoàn tất.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4">
              <SanPhamForm
                inModal
                editingSanPham={editingSanPham}
                danhMuc={danhMuc}
                thuongHieu={thuongHieu}
                chatLieu={chatLieu}
                onSave={() => { setShowForm(false); load(); }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Tổng: <span className="font-semibold text-gray-900">{danhSach.length}</span> sản phẩm
            </div>
            <div className="text-sm text-gray-500">
              Trang <span className="font-medium text-gray-900">{trang + 1}</span> / {Math.max(tongTrang, 1)}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sản phẩm</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Danh mục</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Giá</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="px-4 py-3 w-44"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {danhSach.map(sp => (
                <tr key={sp.id} className="hover:bg-gray-50/70">
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
                    <div className="flex items-center justify-end gap-1.5">
                      <a href={`/san-pham/${sp.duongDan}`} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Xem sản phẩm"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button onClick={() => { setEditingSanPham(sp); setShowForm(true); }}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Sửa sản phẩm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => openBienTheModal(sp)}
                        className="p-2 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        title="Quản lý biến thể"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                      <button onClick={() => xoa(sp.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {danhSach.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="text-gray-900 font-medium">Chưa có sản phẩm</div>
                    <div className="text-sm text-gray-500 mt-1">Thử đổi bộ lọc hoặc bấm “Thêm sản phẩm”.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {tongTrang > 1 && (
            <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Trang <span className="font-medium text-gray-900">{trang + 1}</span> / {tongTrang}
              </div>
              <div className="flex gap-2">
                <button disabled={trang === 0} onClick={() => setTrang(t => t - 1)} className="btn-secondary text-sm">Trước</button>
                <button disabled={trang >= tongTrang - 1} onClick={() => setTrang(t => t + 1)} className="btn-secondary text-sm">Sau</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showBienTheModal && selectedSanPham && (
        <BienTheSanPhamModal
          open={showBienTheModal}
          onClose={() => setShowBienTheModal(false)}
          tenSanPham={selectedSanPham.tenSanPham}
          maSanPham={selectedSanPham.maSanPham}
          kichThuocOptions={btKichThuocOptions}
          mauSacOptions={btMauSacOptions}
          bienTheDaCo={bienTheModalList}
          loading={loadingBienThe}
          onSave={handleSaveBienThe}
          onReload={async () => {
            if (!selectedSanPham) return;
            await loadBienTheData(selectedSanPham);
          }}
        />
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
  gia: string;
  soLuongTon: string;
  macDinh: boolean;
}

const EMPTY_BT: BienTheForm = { kichThuocId: '', mauSacId: '', gia: '', soLuongTon: '0', macDinh: false };

interface BienTheSanPhamModalProps {
  open: boolean;
  onClose: () => void;
  tenSanPham: string;
  maSanPham: string;
  kichThuocOptions: KichThuoc[];
  mauSacOptions: MauSac[];
  bienTheDaCo: BienTheType[];
  loading: boolean;
  onSave: (rows: BienTheForm[]) => Promise<void> | void;
  onReload: () => Promise<void> | void;
}

function BienTheSanPhamModal({
  open,
  onClose,
  tenSanPham,
  maSanPham,
  kichThuocOptions,
  mauSacOptions,
  bienTheDaCo,
  loading,
  onSave,
  onReload,
}: BienTheSanPhamModalProps) {
  const [rows, setRows] = useState<BienTheForm[]>([
    { ...EMPTY_BT },
  ]);
  const [saving, setSaving] = useState(false);
  const [uploadingBTId, setUploadingBTId] = useState<number | null>(null);
  const [deletingAnhId, setDeletingAnhId] = useState<number | null>(null);
  const [editingBTId, setEditingBTId] = useState<number | null>(null);
  const [editBTForm, setEditBTForm] = useState<BienTheForm>({ ...EMPTY_BT });

  // Bulk selection → auto-generate combinations
  const [pickSizes, setPickSizes] = useState<string[]>([]);
  const [pickColors, setPickColors] = useState<string[]>([]);
  const [genGia, setGenGia] = useState('');
  const [genSoLuong, setGenSoLuong] = useState('0');

  if (!open) return null;

  const updateRow = (index: number, patch: Partial<BienTheForm>) => {
    setRows(prev => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows(prev => [...prev, { ...EMPTY_BT }]);
  };

  const removeRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveClick = async () => {
    if (!rows.length) return;
    setSaving(true);
    try {
      await onSave(rows);
      await onReload();
    } finally {
      setSaving(false);
    }
  };

  const makeKey = (sizeId: string, colorId: string) =>
    `${sizeId || 'null'}|${colorId || 'null'}`;

  const existingKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const bt of bienTheDaCo) {
      const sizeId = bt.kichThuoc?.id != null ? String(bt.kichThuoc.id) : '';
      const colorId = bt.mauSac?.id != null ? String(bt.mauSac.id) : '';
      keys.add(makeKey(sizeId, colorId));
    }
    return keys;
  }, [bienTheDaCo]);

  const generateCombinations = () => {
    if (pickSizes.length === 0 || pickColors.length === 0) {
      toast.error('Vui lòng chọn Size và Màu để tạo tổ hợp');
      return;
    }

    const currentKeys = new Set(rows.map(r => makeKey(r.kichThuocId, r.mauSacId)));
    const next: BienTheForm[] = [];

    for (const s of pickSizes) {
      for (const c of pickColors) {
        const key = makeKey(s, c);
        if (existingKeys.has(key)) continue; // tránh tạo lại biến thể đã có
        if (currentKeys.has(key)) continue;  // tránh trùng trong rows
        next.push({
          kichThuocId: s,
          mauSacId: c,
          gia: genGia,
          soLuongTon: genSoLuong,
          macDinh: false,
        });
        currentKeys.add(key);
      }
    }

    if (next.length === 0) {
      toast.error('Không có tổ hợp mới để tạo (có thể đã tồn tại hết)');
      return;
    }

    setRows(prev => {
      const keep = prev.filter(r => r.kichThuocId || r.mauSacId || r.gia || r.soLuongTon !== '0');
      return [...keep, ...next];
    });
    toast.success(`Đã tạo ${next.length} tổ hợp`);
  };

  const togglePick = (value: string, setFn: React.Dispatch<React.SetStateAction<string[]>>) => {
    setFn(prev => (prev.includes(value) ? prev.filter((x: string) => x !== value) : [...prev, value]));
  };

  const startEditVariant = (bt: BienTheType) => {
    setEditingBTId(bt.id);
    setEditBTForm({
      kichThuocId: bt.kichThuoc?.id != null ? String(bt.kichThuoc.id) : '',
      mauSacId: bt.mauSac?.id != null ? String(bt.mauSac.id) : '',
      gia: bt.gia != null ? String(bt.gia) : '',
      soLuongTon: bt.soLuongTon != null ? String(bt.soLuongTon) : '0',
      macDinh: !!bt.macDinh,
    });
  };

  const updateVariant = async (bienTheId: number) => {
    try {
      await adminApi.capNhatBienThe(bienTheId, {
        kichThuocId: editBTForm.kichThuocId ? Number(editBTForm.kichThuocId) : null,
        mauSacId: editBTForm.mauSacId ? Number(editBTForm.mauSacId) : null,
        chatLieuId: null,
        gia: editBTForm.gia ? Number(editBTForm.gia) : null,
        soLuongTon: editBTForm.soLuongTon ? Number(editBTForm.soLuongTon) : 0,
        macDinh: editBTForm.macDinh,
      });
      toast.success('Cập nhật biến thể thành công');
      setEditingBTId(null);
      await onReload();
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
      await onReload();
    } catch {
      toast.error('Lỗi xóa biến thể');
    }
  };

  const handleImageUpload = async (bienTheId: number, file: File) => {
    try {
      setUploadingBTId(bienTheId);
      const bt = bienTheDaCo.find(b => b.id === bienTheId);
      const isFirst = !bt?.hinhAnh || bt.hinhAnh.length === 0;
      await adminApi.uploadAnhBienThe(bienTheId, file, isFirst);
      toast.success('Upload ảnh thành công');
      await onReload();
    } catch {
      toast.error('Lỗi upload ảnh');
    } finally {
      setUploadingBTId(null);
    }
  };

  const deleteImage = async (anhId: number) => {
    try {
      setDeletingAnhId(anhId);
      await adminApi.xoaAnh(anhId);
      toast.success('Đã xóa ảnh');
      await onReload();
    } catch {
      toast.error('Lỗi xóa ảnh');
    } finally {
      setDeletingAnhId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Biến thể sản phẩm #{maSanPham}
            </h3>
            <p className="text-xs text-gray-500">
              Quản lý kích thước, màu sắc, chất liệu cho sản phẩm: {tenSanPham}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900">
                Thêm nhiều biến thể (tạo tổ hợp)
              </h4>
              <button
                type="button"
                onClick={addRow}
                className="btn-secondary text-xs flex items-center gap-1 px-2 py-1"
              >
                <Plus className="w-3 h-3" />
                Thêm dòng mới
              </button>
            </div>

            {/* Generator */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">Size</div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-auto pr-1">
                    {kichThuocOptions.map(k => {
                      const id = String(k.id);
                      const active = pickSizes.includes(id);
                      return (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => togglePick(id, setPickSizes)}
                          className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                            active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          {k.kichCo}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">Màu</div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-auto pr-1">
                    {mauSacOptions.map(m => {
                      const id = String(m.id);
                      const active = pickColors.includes(id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => togglePick(id, setPickColors)}
                          className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                            active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          {m.tenMau}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2 mt-3">
                <div className="w-32">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Giá</label>
                  <input
                    type="number"
                    className="input-field text-xs"
                    placeholder="Giá"
                    value={genGia}
                    onChange={e => setGenGia(e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Số lượng</label>
                  <input
                    type="number"
                    className="input-field text-xs"
                    placeholder="SL"
                    value={genSoLuong}
                    onChange={e => setGenSoLuong(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={generateCombinations}
                  className="btn-primary text-xs px-3 py-2"
                  title="Tự động tạo tất cả tổ hợp từ lựa chọn"
                >
                  Tạo tổ hợp
                </button>
                <button
                  type="button"
                  onClick={() => { setPickSizes([]); setPickColors([]); }}
                  className="btn-secondary text-xs px-3 py-2"
                >
                  Bỏ chọn
                </button>
                <div className="text-[11px] text-gray-500 ml-auto">
                  Hệ thống sẽ tự tạo tất cả combination và tự bỏ qua biến thể đã tồn tại.
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-6 gap-2 items-center bg-gray-50 rounded-lg px-3 py-2"
                >
                  <select
                    className="input-field text-xs"
                    value={row.kichThuocId}
                    onChange={e => updateRow(index, { kichThuocId: e.target.value })}
                  >
                    <option value="">Kích thước</option>
                    {kichThuocOptions.map(k => (
                      <option key={k.id} value={k.id}>
                        {k.kichCo}
                      </option>
                    ))}
                  </select>

                  <select
                    className="input-field text-xs"
                    value={row.mauSacId}
                    onChange={e => updateRow(index, { mauSacId: e.target.value })}
                  >
                    <option value="">Màu sắc</option>
                    {mauSacOptions.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.tenMau}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    className="input-field text-xs"
                    placeholder="Giá"
                    value={row.gia}
                    onChange={e => updateRow(index, { gia: e.target.value })}
                  />

                  <input
                    type="number"
                    className="input-field text-xs"
                    placeholder="Số lượng"
                    value={row.soLuongTon}
                    onChange={e => updateRow(index, { soLuongTon: e.target.value })}
                  />

                  <div className="flex items-center justify-end gap-2">
                    <label className="flex items-center gap-1 text-[11px] text-gray-600">
                      <input
                        type="checkbox"
                        checked={row.macDinh}
                        onChange={e => updateRow(index, { macDinh: e.target.checked })}
                      />
                      Mặc định
                    </label>
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Danh sách biến thể hiện có
            </h4>
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              {loading ? (
                <div className="py-6 text-center text-gray-400 text-xs">
                  Đang tải dữ liệu biến thể...
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500">ID</th>
                      <th className="px-3 py-2 text-left text-gray-500">Kích thước</th>
                      <th className="px-3 py-2 text-left text-gray-500">Màu sắc</th>
                      <th className="px-3 py-2 text-left text-gray-500">Chất liệu</th>
                      <th className="px-3 py-2 text-left text-gray-500">Giá</th>
                      <th className="px-3 py-2 text-left text-gray-500">Số lượng</th>
                      <th className="px-3 py-2 text-left text-gray-500">Mặc định</th>
                      <th className="px-3 py-2 text-left text-gray-500">Thao tác</th>
                      <th className="px-3 py-2 text-left text-gray-500">Ảnh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bienTheDaCo.map(bt => (
                      <>
                        <tr key={bt.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-600">{bt.id}</td>
                          <td className="px-3 py-2">
                            {bt.kichThuoc?.tenKichThuoc || '—'}
                          </td>
                          <td className="px-3 py-2">
                            {bt.mauSac?.tenMauSac || '—'}
                          </td>
                          <td className="px-3 py-2">
                            {bt.chatLieu?.tenChatLieu || '—'}
                          </td>
                          <td className="px-3 py-2 font-semibold text-indigo-600">
                            {bt.gia != null ? formatCurrency(bt.gia) : '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {bt.soLuongTon}
                          </td>
                          <td className="px-3 py-2">
                            {bt.macDinh ? (
                              <span className="badge badge-blue text-[11px]">Mặc định</span>
                            ) : (
                              <span className="text-[11px] text-gray-400">Không</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => startEditVariant(bt)}
                                className="px-2 py-1 text-[11px] rounded border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-700 transition-colors"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteVariant(bt.id)}
                                className="px-2 py-1 text-[11px] rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1 items-center">
                            {bt.hinhAnh?.map(img => (
                              <div key={img.id} className="relative group w-10 h-10">
                                <img
                                  src={getImageUrl(img.duongDan)}
                                  alt=""
                                  className={`w-10 h-10 rounded-md object-cover border-2 ${img.laAnhChinh ? 'border-indigo-400' : 'border-gray-100'}`}
                                  onError={handleImgError}
                                />
                                <button
                                  type="button"
                                  onClick={() => deleteImage(img.id)}
                                  disabled={deletingAnhId === img.id}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-60"
                                  title="Xóa ảnh"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                {img.laAnhChinh && (
                                  <span className="absolute bottom-0 left-0 right-0 bg-indigo-500 text-white text-center text-[8px] rounded-b-md">
                                    Chính
                                  </span>
                                )}
                              </div>
                            ))}

                            <label className="w-10 h-10 rounded-md border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                              {uploadingBTId === bt.id ? (
                                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4 text-gray-400" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) void handleImageUpload(bt.id, file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                          </td>
                        </tr>
                        {editingBTId === bt.id && (
                          <tr>
                            <td colSpan={9} className="px-3 py-2 bg-indigo-50/40">
                              <div className="grid grid-cols-3 md:grid-cols-7 gap-2 items-end">
                                <select
                                  className="input-field text-xs"
                                  value={editBTForm.kichThuocId}
                                  onChange={e => setEditBTForm(prev => ({ ...prev, kichThuocId: e.target.value }))}
                                >
                                  <option value="">Kích thước</option>
                                  {kichThuocOptions.map(k => (
                                    <option key={k.id} value={k.id}>
                                      {k.kichCo}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className="input-field text-xs"
                                  value={editBTForm.mauSacId}
                                  onChange={e => setEditBTForm(prev => ({ ...prev, mauSacId: e.target.value }))}
                                >
                                  <option value="">Màu sắc</option>
                                  {mauSacOptions.map(m => (
                                    <option key={m.id} value={m.id}>
                                      {m.tenMau}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  className="input-field text-xs"
                                  placeholder="Giá"
                                  value={editBTForm.gia}
                                  onChange={e => setEditBTForm(prev => ({ ...prev, gia: e.target.value }))}
                                />
                                <input
                                  type="number"
                                  className="input-field text-xs"
                                  placeholder="Số lượng"
                                  value={editBTForm.soLuongTon}
                                  onChange={e => setEditBTForm(prev => ({ ...prev, soLuongTon: e.target.value }))}
                                />
                                <label className="flex items-center gap-1 text-[11px] text-gray-600">
                                  <input
                                    type="checkbox"
                                    checked={editBTForm.macDinh}
                                    onChange={e => setEditBTForm(prev => ({ ...prev, macDinh: e.target.checked }))}
                                  />
                                  Mặc định
                                </label>
                                <div className="flex gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => updateVariant(bt.id)}
                                    className="btn-primary text-xs px-3 py-2"
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingBTId(null)}
                                    className="btn-secondary text-xs px-3 py-2"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {bienTheDaCo.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-3 py-6 text-center text-gray-400"
                        >
                          Chưa có biến thể nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary text-sm">
            Đóng
          </button>
          <button
            onClick={handleSaveClick}
            disabled={saving || rows.length === 0}
            className="btn-primary text-sm"
          >
            {saving ? 'Đang lưu...' : 'Lưu các biến thể'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SanPhamForm({ inModal = false, editingSanPham, danhMuc, thuongHieu, chatLieu, onSave, onCancel }: {
  inModal?: boolean;
  editingSanPham: SanPhamItem | null;
  danhMuc: DanhMuc[];
  thuongHieu: ThuongHieu[];
  chatLieu: ChatLieu[];
  onSave: () => void;
  onCancel: () => void;
}) {
  // --- product info ---
  const [form, setForm] = useState({
    tenSanPham: '', moTaChiTiet: '', giaGoc: '', danhMucId: '', thuongHieuId: '', chatLieuId: '', trangThai: true,
  });
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // product ID after initial save (for new products → switch to edit mode)
  const [savedProductId, setSavedProductId] = useState<number | null>(editingSanPham?.id || null);
  const [savedDuongDan, setSavedDuongDan] = useState<string | null>(editingSanPham?.duongDan || null);

  const isEditMode = !!editingSanPham || !!savedProductId;

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
          chatLieuId: sp.chatLieu?.id ? String(sp.chatLieu.id) : '',
          trangThai: sp.trangThaiSanPham === 'DANG_BAN',
        });
        setSavedProductId(sp.id);
        setSavedDuongDan(sp.duongDan);
      })
      .finally(() => setLoadingDetail(false));
  }, [editingSanPham]);

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
        chatLieuId: form.chatLieuId ? Number(form.chatLieuId) : null,
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
        const res = await adminApi.taoSanPham(data);
        const newSp = res.data.duLieu as { id: number; duongDan: string } | undefined;
        if (newSp?.id) {
          setSavedProductId(newSp.id);
          setSavedDuongDan(newSp.duongDan);
          toast.success('Tạo sản phẩm thành công');
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

  // ======================== RENDER ========================
  if (loadingDetail) {
    return (
      <div className={inModal ? 'py-10 text-center' : 'bg-white rounded-xl border p-8 mb-6 text-center'}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={inModal ? 'space-y-6' : 'bg-white rounded-xl border border-gray-100 p-6 mb-6 space-y-6'}>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Chất liệu</label>
            <select className="input-field" value={form.chatLieuId}
              onChange={e => setForm({ ...form, chatLieuId: e.target.value })}>
              <option value="">-- Chọn --</option>
              {chatLieu.map(cl => <option key={cl.id} value={cl.id}>{cl.tenChatLieu}</option>)}
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
    </div>
  );
}
