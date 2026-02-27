import { useEffect, useState } from 'react';
import { voucherApi } from '../../services/api';
import type { Voucher } from '../../services/api';
import toast from 'react-hot-toast';
import { Trash2, Edit2, Plus } from 'lucide-react';

export default function QuanLyVoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: number | null }>({
    show: false,
    id: null,
  });

  const [formData, setFormData] = useState<Partial<Voucher>>({
    maVoucher: '',
    moTa: '',
    loaiGiam: 'PERCENT',
    giaTriGiam: 0,
    giaTriGiamToiDa: 0,
    giaTriToiThieu: undefined,
    ngayBatDau: '',
    ngayKetThuc: '',
    soLuongToiDa: undefined,
    trangThai: true,
  });

  // Load vouchers
  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const response = await voucherApi.danhSachTatCa();
      if (response.data?.duLieu) {
        setVouchers(response.data.duLieu);
      }
    } catch (error) {
      console.error('Load vouchers error:', error);
      toast.error('Lỗi tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.maVoucher?.trim()) {
      toast.error('Vui lòng nhập mã voucher');
      return;
    }
    if (!formData.ngayBatDau || !formData.ngayKetThuc) {
      toast.error('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }
    if ((formData.giaTriGiam || 0) <= 0) {
      toast.error('Giá trị giảm phải lớn hơn 0');
      return;
    }
    if (formData.loaiGiam === 'PERCENT' && (formData.giaTriGiam || 0) > 100) {
      toast.error('Phần trăm giảm không được vượt quá 100%');
      return;
    }

    try {
      // Convert dates from "YYYY-MM-DD" to ISO datetime format
      const submitData = {
        ...formData,
        ngayBatDau: formData.ngayBatDau ? `${formData.ngayBatDau}T00:00:00` : '',
        ngayKetThuc: formData.ngayKetThuc ? `${formData.ngayKetThuc}T23:59:59` : '',
      };

      if (editingId) {
        await voucherApi.capNhatVoucher(editingId, submitData);
        toast.success('Cập nhật voucher thành công');
      } else {
        await voucherApi.taoVoucher(submitData);
        toast.success('Tạo voucher thành công');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        maVoucher: '',
        moTa: '',
        loaiGiam: 'PERCENT',
        giaTriGiam: 0,
        giaTriGiamToiDa: 0,
        giaTriToiThieu: undefined,
        ngayBatDau: '',
        ngayKetThuc: '',
        soLuongToiDa: undefined,
        trangThai: true,
      });
      loadVouchers();
    } catch (error) {
      console.error('Save voucher error:', error);
      toast.error('Lỗi lưu voucher');
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setFormData({
      ...voucher,
      ngayBatDau: voucher.ngayBatDau ? new Date(voucher.ngayBatDau).toISOString().split('T')[0] : '',
      ngayKetThuc: voucher.ngayKetThuc ? new Date(voucher.ngayKetThuc).toISOString().split('T')[0] : '',
    });
    setEditingId(voucher.id);
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete.id) return;
    try {
      await voucherApi.xoaVoucher(confirmDelete.id);
      toast.success('Xóa voucher thành công');
      setConfirmDelete({ show: false, id: null });
      loadVouchers();
    } catch (error) {
      console.error('Delete voucher error:', error);
      toast.error('Lỗi xóa voucher');
    }
  };

  const filteredVouchers = vouchers.filter((v) =>
    v.maVoucher.toLowerCase().includes(searchText.toLowerCase()) ||
    (v.moTa || '').toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Voucher</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              maVoucher: '',
              moTa: '',
              loaiGiam: 'PERCENT',
              giaTriGiam: 0,
              giaTriGiamToiDa: 0,
              giaTriToiThieu: undefined,
              ngayBatDau: '',
              ngayKetThuc: '',
              soLuongToiDa: undefined,
              trangThai: true,
            });
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={20} />
          Thêm Voucher
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm mã hoặc mô tả voucher..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Vouchers Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : filteredVouchers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Không có voucher nào</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã Voucher</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Mô Tả</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Loại</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Giá Trị Giảm</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Ngày BĐ - KT</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Sử Dụng</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.map((voucher) => (
                <tr key={voucher.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{voucher.maVoucher}</td>
                  <td className="px-4 py-3 text-gray-700">{voucher.moTa || '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        voucher.loaiGiam === 'PERCENT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {voucher.loaiGiam === 'PERCENT' ? 'Phần Trăm' : 'Fixed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {voucher.loaiGiam === 'PERCENT' ? `${voucher.giaTriGiam}%` : `${voucher.giaTriGiam.toLocaleString()}đ`}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {new Date(voucher.ngayBatDau).toLocaleDateString('vi-VN')} -
                    <br />
                    {new Date(voucher.ngayKetThuc).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {voucher.soLuongSuDung} / {voucher.soLuongToiDa || '∞'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(voucher)}
                      className="text-blue-600 hover:text-blue-800 mr-3 inline-block transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ show: true, id: voucher.id })}
                      className="text-red-600 hover:text-red-800 inline-block transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-96">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Xác Nhận Xóa</h3>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn xóa voucher này?</p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmDelete({ show: false, id: null })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingId ? 'Chỉnh Sửa Voucher' : 'Tạo Voucher Mới'}
            </h3>

            <div className="space-y-4">
              {/* Mã Voucher */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã Voucher *</label>
                <input
                  type="text"
                  value={formData.maVoucher || ''}
                  onChange={(e) => setFormData({ ...formData, maVoucher: e.target.value.toUpperCase() })}
                  disabled={!!editingId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  placeholder="VD: SUMMER2026"
                />
              </div>

              {/* Mô Tả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô Tả</label>
                <textarea
                  value={formData.moTa || ''}
                  onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="Mô tả voucher"
                />
              </div>

              {/* Loại Giảm */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại Giảm *</label>
                  <select
                    value={formData.loaiGiam || 'PERCENT'}
                    onChange={(e) => setFormData({ ...formData, loaiGiam: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PERCENT">Phần Trăm (%)</option>
                    <option value="FIXED">Fixed (đ)</option>
                  </select>
                </div>

                {/* Giá Trị Giảm */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá Trị Giảm {formData.loaiGiam === 'PERCENT' ? '(%)' : '(đ)'} *
                  </label>
                  <input
                    type="number"
                    value={formData.giaTriGiam || 0}
                    onChange={(e) => setFormData({ ...formData, giaTriGiam: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    step="1"
                    min="0"
                    max={formData.loaiGiam === 'PERCENT' ? 100 : undefined}
                  />
                </div>
              </div>

              {/* Giá Trị Giảm Tối Đa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá Trị Giảm Tối Đa (đ) *</label>
                <input
                  type="number"
                  value={formData.giaTriGiamToiDa || 0}
                  onChange={(e) => setFormData({ ...formData, giaTriGiamToiDa: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  step="1000"
                  min="0"
                  placeholder="VD: 50000"
                />
              </div>

              {/* Giá Trị Tối Thiểu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá Trị Đơn Hàng Tối Thiểu (đ)</label>
                <input
                  type="number"
                  value={formData.giaTriToiThieu || ''}
                  onChange={(e) => setFormData({ ...formData, giaTriToiThieu: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  step="1000"
                  min="0"
                  placeholder="VD: 200000 (để trống = không yêu cầu)"
                />
              </div>

              {/* Ngày Bắt Đầu */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Bắt Đầu *</label>
                  <input
                    type="date"
                    value={formData.ngayBatDau || ''}
                    onChange={(e) => setFormData({ ...formData, ngayBatDau: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Ngày Kết Thúc */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Kết Thúc *</label>
                  <input
                    type="date"
                    value={formData.ngayKetThuc || ''}
                    onChange={(e) => setFormData({ ...formData, ngayKetThuc: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Số Lượng Tối Đa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số Lượng Tối Đa (Để trống = không giới hạn)</label>
                <input
                  type="number"
                  value={formData.soLuongToiDa || ''}
                  onChange={(e) => setFormData({ ...formData, soLuongToiDa: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  step="1"
                  min="1"
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="trangThai"
                  checked={formData.trangThai !== false}
                  onChange={(e) => setFormData({ ...formData, trangThai: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <label htmlFor="trangThai" className="text-sm font-medium text-gray-700">
                  Hoạt động
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium"
              >
                {editingId ? 'Cập Nhật' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
