import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sanPhamApi } from '../services/api';
import type { SanPhamItem, DanhMuc } from '../services/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

export default function DanhMucSanPhamPage() {
  const { duongDan } = useParams<{ duongDan: string }>();
  const [sanPhamList, setSanPhamList] = useState<SanPhamItem[]>([]);
  const [danhMuc, setDanhMuc] = useState<DanhMuc | null>(null);
  const [loading, setLoading] = useState(true);
  const [trang, setTrang] = useState(0);
  const [tongTrang, setTongTrang] = useState(0);
  const [tongSoBan, setTongSoBan] = useState(0);

  // Lấy thông tin danh mục từ danh sách danh mục
  useEffect(() => {
    if (!duongDan) return;
    sanPhamApi.danhMuc().then(r => {
      const dm = (r.data.duLieu || []).find(d => d.duongDan === duongDan);
      setDanhMuc(dm || null);
    });
  }, [duongDan]);

  const load = useCallback(() => {
    if (!duongDan) return;
    setLoading(true);
    sanPhamApi.sanPhamTheoDanhMuc(duongDan, trang, 12)
      .then(r => {
        const data = r.data.duLieu;
        setSanPhamList(data?.danhSach || []);
        setTongTrang(data?.tongSoTrang || 0);
        setTongSoBan(data?.tongSoBan || 0);
      })
      .finally(() => setLoading(false));
  }, [duongDan, trang]);

  useEffect(() => { setTrang(0); }, [duongDan]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
          <Home className="w-4 h-4" /> Trang chủ
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/san-pham" className="hover:text-indigo-600 transition-colors">Sản phẩm</Link>
        {danhMuc && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-medium">{danhMuc.tenDanhMuc}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {danhMuc?.tenDanhMuc || 'Danh mục'}
        </h1>
        {danhMuc?.moTa && (
          <p className="text-gray-500 mt-1">{danhMuc.moTa}</p>
        )}
        {!loading && (
          <p className="text-sm text-gray-400 mt-2">{tongSoBan} sản phẩm</p>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : sanPhamList.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {sanPhamList.map(sp => (
              <ProductCard key={sp.id} sanPham={sp} />
            ))}
          </div>

          {/* Pagination */}
          {tongTrang > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                disabled={trang === 0}
                onClick={() => setTrang(t => t - 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(tongTrang, 7) }, (_, i) => {
                  let page: number;
                  if (tongTrang <= 7) {
                    page = i;
                  } else if (trang < 3) {
                    page = i;
                  } else if (trang > tongTrang - 4) {
                    page = tongTrang - 7 + i;
                  } else {
                    page = trang - 3 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setTrang(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        trang === page
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page + 1}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={trang >= tongTrang - 1}
                onClick={() => setTrang(t => t + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-700">Không có sản phẩm</h3>
          <p className="text-gray-400 mt-1">Danh mục này hiện chưa có sản phẩm nào</p>
          <Link to="/san-pham" className="btn-primary mt-4 inline-block text-sm">
            Xem tất cả sản phẩm
          </Link>
        </div>
      )}
    </div>
  );
}
