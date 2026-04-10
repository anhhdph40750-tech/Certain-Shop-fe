import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Check, Palette, Ruler, Layers, Tag, Award } from 'lucide-react';
import { thuocTinhApi } from '../../services/api';
import type { MauSac, KichThuoc, ChatLieu, DanhMuc, ThuongHieu } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';

type TabKey = 'mau-sac' | 'kich-thuoc' | 'chat-lieu' | 'danh-muc' | 'thuong-hieu';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'mau-sac', label: 'Màu sắc', icon: <Palette className="w-4 h-4" /> },
  { key: 'kich-thuoc', label: 'Kích thước', icon: <Ruler className="w-4 h-4" /> },
  { key: 'chat-lieu', label: 'Chất liệu', icon: <Layers className="w-4 h-4" /> },
  { key: 'danh-muc', label: 'Danh mục', icon: <Tag className="w-4 h-4" /> },
  { key: 'thuong-hieu', label: 'Thương hiệu', icon: <Award className="w-4 h-4" /> },
];

export default function QuanLyThuocTinhPage() {
  const { isAdmin, isSuperAdmin } = useAuthStore();
  const [tab, setTab] = useState<TabKey>('mau-sac');
  const canEdit = isAdmin() || isSuperAdmin();

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Quản lý thuộc tính</h2>
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center
              ${tab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'mau-sac' && <MauSacTab canEdit={canEdit} />}
      {tab === 'kich-thuoc' && <KichThuocTab canEdit={canEdit} />}
      {tab === 'chat-lieu' && <ChatLieuTab canEdit={canEdit} />}
      {tab === 'danh-muc' && <DanhMucTab canEdit={canEdit} />}
      {tab === 'thuong-hieu' && <ThuongHieuTab canEdit={canEdit} />}
    </div>
  );
}

// ======================== MÀU SẮC ========================
function MauSacTab({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<MauSac[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MauSac | null>(null);
  const [form, setForm] = useState({ tenMau: '', maHex: '#000000', moTa: '' });

  const load = useCallback(() => {
    setLoading(true);
    thuocTinhApi.danhSachMauSac()
      .then(r => setList(r.data.duLieu || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ tenMau: '', maHex: '#000000', moTa: '' }); setShowForm(true); };
  const openEdit = (ms: MauSac) => { setEditing(ms); setForm({ tenMau: ms.tenMau, maHex: ms.maHex, moTa: ms.moTa || '' }); setShowForm(true); };

  const save = async () => {
    if (!form.tenMau.trim()) { toast.error('Nhập tên màu'); return; }
    try {
      if (editing) {
        await thuocTinhApi.suaMauSac(editing.id, form);
        toast.success('Đã cập nhật');
      } else {
        await thuocTinhApi.taoMauSac(form);
        toast.success('Đã thêm màu sắc');
      }
      setShowForm(false);
      load();
    } catch { toast.error('Có lỗi xảy ra'); }
  };

  const xoa = async (id: number) => {
    if (!confirm('Xóa màu sắc này?')) return;
    try { await thuocTinhApi.xoaMauSac(id); toast.success('Đã xóa'); load(); }
    catch { toast.error('Không thể xóa'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Thêm màu</button>
        </div>
      )}
      {canEdit && showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
          <h4 className="font-semibold text-gray-800 mb-3">{editing ? 'Sửa màu sắc' : 'Thêm màu sắc'}</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên màu *</label>
              <input className="input-field" value={form.tenMau} onChange={e => setForm({ ...form, tenMau: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã hex</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.maHex} onChange={e => setForm({ ...form, maHex: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                <input className="input-field flex-1" value={form.maHex} onChange={e => setForm({ ...form, maHex: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <input className="input-field" value={form.moTa} onChange={e => setForm({ ...form, moTa: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="btn-primary text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Lưu</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm flex items-center gap-1"><X className="w-4 h-4" /> Hủy</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-16">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Màu</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tên</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Mô tả</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((ms, i) => (
              <tr key={ms.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full border border-gray-200 shadow-inner" style={{ background: ms.maHex }} />
                    <code className="text-xs text-gray-500">{ms.maHex}</code>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{ms.tenMau}</td>
                <td className="px-4 py-3 text-gray-500">{ms.moTa || '—'}</td>
                <td className="px-4 py-3">
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(ms)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => xoa(ms.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Chưa có màu sắc</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ======================== KÍCH THƯỚC ========================
function KichThuocTab({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<KichThuoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KichThuoc | null>(null);
  const [form, setForm] = useState({ kichCo: '', thuTu: '' });

  const load = useCallback(() => {
    setLoading(true);
    thuocTinhApi.danhSachKichThuoc()
      .then(r => setList(r.data.duLieu || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ kichCo: '', thuTu: '' }); setShowForm(true); };
  const openEdit = (kt: KichThuoc) => { setEditing(kt); setForm({ kichCo: kt.kichCo, thuTu: kt.thuTu?.toString() || '' }); setShowForm(true); };

  const save = async () => {
    if (!form.kichCo.trim()) { toast.error('Nhập kích cỡ'); return; }
    try {
      const data = { kichCo: form.kichCo, thuTu: form.thuTu ? Number(form.thuTu) : undefined };
      if (editing) {
        await thuocTinhApi.suaKichThuoc(editing.id, data);
        toast.success('Đã cập nhật');
      } else {
        await thuocTinhApi.taoKichThuoc(data);
        toast.success('Đã thêm kích thước');
      }
      setShowForm(false);
      load();
    } catch { toast.error('Có lỗi xảy ra'); }
  };

  const xoa = async (id: number) => {
    if (!confirm('Xóa kích thước này?')) return;
    try { await thuocTinhApi.xoaKichThuoc(id); toast.success('Đã xóa'); load(); }
    catch { toast.error('Không thể xóa'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Thêm kích thước</button>
        </div>
      )}
      {canEdit && showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
          <h4 className="font-semibold text-gray-800 mb-3">{editing ? 'Sửa kích thước' : 'Thêm kích thước'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kích cỡ *</label>
              <input className="input-field" placeholder="S, M, L, XL, 38, 39..." value={form.kichCo} onChange={e => setForm({ ...form, kichCo: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
              <input type="number" className="input-field" value={form.thuTu} onChange={e => setForm({ ...form, thuTu: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="btn-primary text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Lưu</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm flex items-center gap-1"><X className="w-4 h-4" /> Hủy</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-16">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Kích cỡ</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Thứ tự</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((kt, i) => (
              <tr key={kt.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{kt.kichCo}</td>
                <td className="px-4 py-3 text-gray-500">{kt.thuTu ?? '—'}</td>
                <td className="px-4 py-3">
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(kt)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => xoa(kt.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chưa có kích thước</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ======================== CHẤT LIỆU ========================
function ChatLieuTab({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<ChatLieu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ChatLieu | null>(null);
  const [form, setForm] = useState({ tenChatLieu: '', moTa: '' });

  const load = useCallback(() => {
    setLoading(true);
    thuocTinhApi.danhSachChatLieu()
      .then(r => setList(r.data.duLieu || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ tenChatLieu: '', moTa: '' }); setShowForm(true); };
  const openEdit = (cl: ChatLieu) => { setEditing(cl); setForm({ tenChatLieu: cl.tenChatLieu, moTa: cl.moTa || '' }); setShowForm(true); };

  const save = async () => {
    if (!form.tenChatLieu.trim()) { toast.error('Nhập tên chất liệu'); return; }
    try {
      if (editing) {
        await thuocTinhApi.suaChatLieu(editing.id, form);
        toast.success('Đã cập nhật');
      } else {
        await thuocTinhApi.taoChatLieu(form);
        toast.success('Đã thêm chất liệu');
      }
      setShowForm(false);
      load();
    } catch { toast.error('Có lỗi xảy ra'); }
  };

  const xoa = async (id: number) => {
    if (!confirm('Xóa chất liệu này?')) return;
    try { await thuocTinhApi.xoaChatLieu(id); toast.success('Đã xóa'); load(); }
    catch { toast.error('Không thể xóa'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Thêm chất liệu</button>
        </div>
      )}
      {canEdit && showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
          <h4 className="font-semibold text-gray-800 mb-3">{editing ? 'Sửa chất liệu' : 'Thêm chất liệu'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên chất liệu *</label>
              <input className="input-field" value={form.tenChatLieu} onChange={e => setForm({ ...form, tenChatLieu: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <input className="input-field" value={form.moTa} onChange={e => setForm({ ...form, moTa: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="btn-primary text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Lưu</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm flex items-center gap-1"><X className="w-4 h-4" /> Hủy</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-16">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tên chất liệu</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Mô tả</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((cl, i) => (
              <tr key={cl.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{cl.tenChatLieu}</td>
                <td className="px-4 py-3 text-gray-500">{cl.moTa || '—'}</td>
                <td className="px-4 py-3">
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(cl)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => xoa(cl.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chưa có chất liệu</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ======================== DANH MỤC ========================
function DanhMucTab({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<DanhMuc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DanhMuc | null>(null);
  const [form, setForm] = useState({ tenDanhMuc: '', duongDan: '', moTa: '' });

  const load = useCallback(() => {
    setLoading(true);
    thuocTinhApi.danhSachDanhMuc()
      .then(r => setList(r.data.duLieu || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ tenDanhMuc: '', duongDan: '', moTa: '' }); setShowForm(true); };
  const openEdit = (dm: DanhMuc) => { setEditing(dm); setForm({ tenDanhMuc: dm.tenDanhMuc, duongDan: dm.duongDan, moTa: dm.moTa || '' }); setShowForm(true); };

  const autoSlug = (ten: string) => {
    const slug = ten.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setForm(f => ({ ...f, tenDanhMuc: ten, duongDan: slug }));
  };

  const save = async () => {
    if (!form.tenDanhMuc.trim()) { toast.error('Nhập tên danh mục'); return; }
    try {
      if (editing) {
        await thuocTinhApi.suaDanhMuc(editing.id, form);
        toast.success('Đã cập nhật');
      } else {
        await thuocTinhApi.taoDanhMuc(form);
        toast.success('Đã thêm danh mục');
      }
      setShowForm(false);
      load();
    } catch { toast.error('Có lỗi xảy ra'); }
  };

  const xoa = async (id: number) => {
    if (!confirm('Xóa danh mục này?')) return;
    try { await thuocTinhApi.xoaDanhMuc(id); toast.success('Đã xóa'); load(); }
    catch { toast.error('Không thể xóa'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Thêm danh mục</button>
        </div>
      )}
      {canEdit && showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
          <h4 className="font-semibold text-gray-800 mb-3">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục *</label>
              <input className="input-field" value={form.tenDanhMuc} onChange={e => autoSlug(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn</label>
              <input className="input-field" value={form.duongDan} onChange={e => setForm({ ...form, duongDan: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <input className="input-field" value={form.moTa} onChange={e => setForm({ ...form, moTa: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="btn-primary text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Lưu</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm flex items-center gap-1"><X className="w-4 h-4" /> Hủy</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-16">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tên danh mục</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Đường dẫn</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Mô tả</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((dm, i) => (
              <tr key={dm.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{dm.tenDanhMuc}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">/{dm.duongDan}</td>
                <td className="px-4 py-3 text-gray-500">{dm.moTa || '—'}</td>
                <td className="px-4 py-3">
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(dm)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => xoa(dm.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Chưa có danh mục</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ======================== THƯƠNG HIỆU ========================
function ThuongHieuTab({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<ThuongHieu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ThuongHieu | null>(null);
  const [form, setForm] = useState({ tenThuongHieu: '', moTa: '' });

  const load = useCallback(() => {
    setLoading(true);
    thuocTinhApi.danhSachThuongHieu()
      .then(r => setList(r.data.duLieu || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ tenThuongHieu: '', moTa: '' }); setShowForm(true); };
  const openEdit = (th: ThuongHieu) => { setEditing(th); setForm({ tenThuongHieu: th.tenThuongHieu, moTa: th.moTa || '' }); setShowForm(true); };

  const save = async () => {
    if (!form.tenThuongHieu.trim()) { toast.error('Nhập tên thương hiệu'); return; }
    try {
      if (editing) {
        await thuocTinhApi.suaThuongHieu(editing.id, form);
        toast.success('Đã cập nhật');
      } else {
        await thuocTinhApi.taoThuongHieu(form);
        toast.success('Đã thêm thương hiệu');
      }
      setShowForm(false);
      load();
    } catch { toast.error('Có lỗi xảy ra'); }
  };

  const xoa = async (id: number) => {
    if (!confirm('Xóa thương hiệu này?')) return;
    try { await thuocTinhApi.xoaThuongHieu(id); toast.success('Đã xóa'); load(); }
    catch { toast.error('Không thể xóa'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Thêm thương hiệu</button>
        </div>
      )}
      {canEdit && showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
          <h4 className="font-semibold text-gray-800 mb-3">{editing ? 'Sửa thương hiệu' : 'Thêm thương hiệu'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên thương hiệu *</label>
              <input className="input-field" value={form.tenThuongHieu} onChange={e => setForm({ ...form, tenThuongHieu: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <input className="input-field" value={form.moTa} onChange={e => setForm({ ...form, moTa: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="btn-primary text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Lưu</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm flex items-center gap-1"><X className="w-4 h-4" /> Hủy</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-16">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tên thương hiệu</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Mô tả</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.map((th, i) => (
              <tr key={th.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{th.tenThuongHieu}</td>
                <td className="px-4 py-3 text-gray-500">{th.moTa || '—'}</td>
                <td className="px-4 py-3">
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(th)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => xoa(th.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chưa có thương hiệu</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
