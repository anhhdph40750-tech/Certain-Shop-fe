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
    <div className="bg-gray-50">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-800 to-blue-700 text-white">
        {/* Background blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-white/10 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-[28rem] h-[28rem] bg-sky-300/10 blur-3xl rounded-full" />

        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-5 tracking-wider uppercase">
              Bộ sưu tập mới
              <span className="w-1 h-1 rounded-full bg-yellow-300" />
              2026
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-5">
              Nâng tầm phong cách
              <span className="block text-yellow-300">mỗi ngày</span>
            </h1>
            <p className="text-white/80 text-base md:text-lg mb-8 max-w-xl mx-auto lg:mx-0">
              Chất liệu cao cấp, form đẹp, dễ phối đồ. Khám phá ngay những mẫu mới nhất tại CertainShop.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to="/san-pham"
                className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
              >
                Mua sắm ngay <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/san-pham?moi=true"
                className="border border-white/40 bg-white/5 px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors inline-flex items-center justify-center"
              >
                Xem hàng mới
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-xs text-white/75">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-300" /> Hàng có sẵn
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-300" /> Đổi trả dễ
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-300" /> Ship nhanh
              </span>
            </div>
          </div>

          <div className="flex-1 flex justify-center w-full">
            <div className="relative w-80 h-80 lg:w-[26rem] lg:h-[26rem]">
              <div className="absolute inset-0 rounded-[2.5rem] bg-white/10 border border-white/15 backdrop-blur-sm shadow-2xl rotate-3" />
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/0 border border-white/10 -rotate-2" />
              <div className="relative w-full h-full rounded-[2.5rem] flex items-center justify-center">
                <img
                  src="/hero-shirt.png"
                  alt="Fashion"
                  className="w-72 h-72 lg:w-96 lg:h-96 object-contain drop-shadow-[0_30px_35px_rgba(0,0,0,0.25)]"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="text-8xl" style={{ display: 'none' }}>👕</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: <Truck className="w-6 h-6" />, title: 'Giao hàng nhanh', desc: 'Trong 2-3 ngày' },
            { icon: <Shield className="w-6 h-6" />, title: 'Đảm bảo chất lượng', desc: 'Hàng chính hãng' },
            { icon: <RefreshCw className="w-6 h-6" />, title: 'Đổi trả dễ dàng', desc: '30 ngày đổi trả' },
            { icon: <Headphones className="w-6 h-6" />, title: 'Uy tín tạo niềm tin', desc: '5 sao' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
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

      {/* Danh mục */}
      {danhMuc.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Danh mục</h2>
              <p className="text-sm text-gray-500 mt-1">Chọn nhanh theo nhu cầu của bạn</p>
            </div>
            <Link to="/san-pham" className="text-indigo-600 text-sm font-medium inline-flex items-center gap-1 hover:underline">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {danhMuc.slice(0, 6).map(dm => (
              <Link key={dm.id} to={`/danh-muc/${dm.duongDan}`}
                className="group bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 group-hover:bg-indigo-100 rounded-2xl flex items-center justify-center text-xl transition-colors">
                    👕
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{dm.tenDanhMuc}</div>
                    <div className="text-xs text-gray-500">Khám phá ngay</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Promo banner */}
      <section className="max-w-7xl mx-auto px-4 pb-2">
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-blue-700 to-sky-600 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm">
          <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 bg-white/10 blur-3xl rounded-full" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 bg-sky-300/10 blur-3xl rounded-full" />
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/15 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Ưu đãi tuần này
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
              Giảm giá hấp dẫn cho sản phẩm chọn lọc
            </h3>
            <p className="text-white/90 mt-1">
              Số lượng có hạn — đặt sớm để nhận ưu đãi tốt nhất.
            </p>
          </div>
          <Link to="/san-pham" className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap">
            Xem ngay
          </Link>
        </div>
      </section>

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
