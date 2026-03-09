import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw, Headphones } from 'lucide-react';
import { sanPhamApi } from '../services/api';
import type { SanPhamItem, DanhMuc } from '../services/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TrangChuPage() {
  const [sanPhamBanChay, setSanPhamBanChay] = useState<SanPhamItem[]>([]);
  const [sanPhamMoi, setSanPhamMoi] = useState<SanPhamItem[]>([]);
  const [danhMuc, setDanhMuc] = useState<DanhMuc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sanPhamApi.banChay(),
      sanPhamApi.moi(),
      sanPhamApi.danhMuc(),
    ]).then(([banChay, moi, dm]) => {
      setSanPhamBanChay(banChay.data.duLieu || []);
      setSanPhamMoi(moi.data.duLieu || []);
      setDanhMuc(dm.data.duLieu || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block bg-indigo-500 px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wider uppercase">
              Bộ sưu tập 2025
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-4">
              Phong cách<br />
              <span className="text-yellow-300">hiện đại</span>
            </h1>
            <p className="text-indigo-200 text-lg mb-8 max-w-md">
              Khám phá bộ sưu tập áo phong phong mới nhất. Chất liệu cao cấp, thiết kế tinh tế.
            </p>
            <div className="flex gap-4 justify-center lg:justify-start">
              <Link to="/san-pham" className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2">
                Mua sắm ngay <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/san-pham?moi=true" className="border border-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                Hàng mới về
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="w-80 h-80 lg:w-96 lg:h-96 bg-indigo-500/30 rounded-full flex items-center justify-center">
              <img src="/hero-shirt.png" alt="Fashion" className="w-64 h-64 lg:w-80 lg:h-80 object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="text-8xl" style={{ display: 'none' }}>👕</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: <Truck className="w-6 h-6" />, title: 'Giao hàng nhanh', desc: 'Trong 2-3 ngày' },
            { icon: <Shield className="w-6 h-6" />, title: 'Đảm bảo chất lượng', desc: 'Hàng chính hãng' },
            { icon: <RefreshCw className="w-6 h-6" />, title: 'Đổi trả dễ dàng', desc: '30 ngày đổi trả' },
            { icon: <Headphones className="w-6 h-6" />, title: 'Uy tín tạo niềm tin', desc: '5 sao' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Danh muck */}
      {danhMuc.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Danh mục</h2>
            <Link to="/san-pham" className="text-indigo-600 text-sm flex items-center gap-1 hover:underline">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {danhMuc.slice(0, 6).map(dm => (
              <Link key={dm.id} to={`/danh-muc/${dm.duongDan}`}
                className="group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-indigo-50 group-hover:bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl transition-colors">
                  👕
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">{dm.tenDanhMuc}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Products */}
      {sanPhamMoi.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Hàng mới về</h2>
              <p className="text-gray-500 text-sm mt-1">Cập nhật những bộ sưu tập mới nhất</p>
            </div>
            <Link to="/san-pham" className="btn-secondary text-sm flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sanPhamMoi.slice(0, 10).map(sp => (
              <ProductCard key={sp.id} sanPham={sp} />
            ))}
          </div>
        </section>
      )}

      {/* Banner */}
      {/* <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Ưu đãi đặc biệt</h3>
            <p className="text-amber-100">Giảm đến 50% cho các sản phẩm được chọn. Chỉ trong tuần này!</p>
          </div>
          <Link to="/san-pham" className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-colors whitespace-nowrap flex-shrink-0">
            Xem ngay
          </Link>
        </div>
      </section> */}

      {/* Best sellers */}
      {sanPhamBanChay.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bán chạy nhất</h2>
              <p className="text-gray-500 text-sm mt-1">Được yêu thích bởi hàng nghìn khách hàng</p>
            </div>
            <Link to="/san-pham" className="btn-secondary text-sm flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sanPhamBanChay.slice(0, 10).map(sp => (
              <ProductCard key={sp.id} sanPham={sp} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
