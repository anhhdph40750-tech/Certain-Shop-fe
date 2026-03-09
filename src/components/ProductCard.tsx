import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { SanPhamItem } from '../services/api';
import { formatCurrency, getImageUrl, handleImgError } from '../utils/format';

interface Props {
  sanPham: SanPhamItem;
}

export default function ProductCard({ sanPham }: Props) {
  return (
    <Link to={`/san-pham/${sanPham.duongDan}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="relative overflow-hidden bg-gray-50 aspect-[3/4]">
        <img
          src={getImageUrl(sanPham.anhChinh)}
          alt={sanPham.tenSanPham}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={handleImgError}
        />
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <div className="w-full py-3 bg-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Xem chi tiết
          </div>
        </div>
        {sanPham.trangThaiSanPham === 'HET_HANG' && (
          <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg">
            Hết hàng
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {sanPham.danhMuc && (
          <span className="text-xs text-indigo-500 font-medium mb-1">{sanPham.danhMuc.tenDanhMuc}</span>
        )}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 mb-2 group-hover:text-indigo-600 transition-colors">
          {sanPham.tenSanPham}
        </h3>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-indigo-600 font-bold">{formatCurrency(sanPham.giaBan)}</span>
            {sanPham.giaGoc > sanPham.giaBan && (
              <span className="text-xs text-gray-400 line-through ml-2">{formatCurrency(sanPham.giaGoc)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
