import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { sanPhamApi } from '../services/api';
import type { SanPhamItem, DanhMuc, ThuongHieu } from '../services/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DanhSachSanPhamPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sanPham, setSanPham] = useState<SanPhamItem[]>([]);
  const [danhMuc, setDanhMuc] = useState<DanhMuc[]>([]);
  const [thuongHieu, setThuongHieu] = useState<ThuongHieu[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const tuKhoa = searchParams.get('q') || '';
  const danhMucId = searchParams.get('danhMuc') ? Number(searchParams.get('danhMuc')) : undefined;
  const thuongHieuId = searchParams.get('thuongHieu') ? Number(searchParams.get('thuongHieu')) : undefined;
  const trang = Number(searchParams.get('trang') || 0);

  useEffect(() => {
    sanPhamApi.danhMuc().then(r => setDanhMuc(r.data.duLieu || []));
    sanPhamApi.thuongHieu().then(r => setThuongHieu(r.data.duLieu || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    sanPhamApi.danhSach({ tuKhoa, danhMucId, thuongHieuId, trang, kichThuocTrang: 20 })
      .then(r => {
        const data = r.data.duLieu;
        setSanPham(data?.danhSach || []);
        setTotalPages(data?.tongSoTrang || 0);
        setTotalElements(data?.tongSoBan || 0);
      })
      .finally(() => setLoading(false));
  }, [tuKhoa, danhMucId, thuongHieuId, trang]);

  const setFilter = (key: string, value: string | null) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('trang');
    setSearchParams(p);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tuKhoa ? `Kết quả cho "${tuKhoa}"` : 'Tất cả sản phẩm'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{totalElements} sản phẩm</p>
        </div>
        <button onClick={() => setFilterOpen(!filterOpen)}
          className="lg:hidden flex items-center gap-2 btn-secondary text-sm">
          <Filter className="w-4 h-4" /> Lọc
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`w-60 flex-shrink-0 ${filterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24 space-y-6">
            {/* Danh mục */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Danh mục</h3>
              <ul className="space-y-1">
                <li>
                  <button onClick={() => setFilter('danhMuc', null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!danhMucId ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    Tất cả
                  </button>
                </li>
                {danhMuc.map(dm => (
                  <li key={dm.id}>
                    <button onClick={() => setFilter('danhMuc', String(dm.id))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${danhMucId === dm.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {dm.tenDanhMuc}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Thương hiệu */}
            {thuongHieu.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Thương hiệu</h3>
                <ul className="space-y-1">
                  <li>
                    <button onClick={() => setFilter('thuongHieu', null)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!thuongHieuId ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                      Tất cả
                    </button>
                  </li>
                  {thuongHieu.map(th => (
                    <li key={th.id}>
                      <button onClick={() => setFilter('thuongHieu', String(th.id))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${thuongHieuId === th.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                        {th.tenThuongHieu}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clear filters */}
            {(danhMucId || thuongHieuId || tuKhoa) && (
              <button onClick={() => setSearchParams({})}
                className="w-full flex items-center gap-2 text-red-500 text-sm hover:text-red-700">
                <X className="w-4 h-4" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <LoadingSpinner />
          ) : sanPham.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm</p>
              <button onClick={() => setSearchParams({})} className="btn-primary mt-4 text-sm">
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {sanPham.map(sp => (
                  <ProductCard key={sp.id} sanPham={sp} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    disabled={trang === 0}
                    onClick={() => setFilter('trang', String(trang - 1))}
                    className="btn-secondary text-sm disabled:opacity-50">
                    Trước
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i : Math.max(0, trang - 3) + i;
                    if (p >= totalPages) return null;
                    return (
                      <button key={p}
                        onClick={() => setFilter('trang', String(p))}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${p === trang ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {p + 1}
                      </button>
                    );
                  })}
                  <button
                    disabled={trang >= totalPages - 1}
                    onClick={() => setFilter('trang', String(trang + 1))}
                    className="btn-secondary text-sm disabled:opacity-50">
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
