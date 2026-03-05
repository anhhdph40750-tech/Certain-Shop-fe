import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="font-bold text-xl text-white">CertainShop</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Cửa hàng thời trang chất lượng cao. Phong cách hiện đại, chọn lọc kỹ càng.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-3">Sản phẩm</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/san-pham" className="hover:text-white transition-colors">Tất cả sản phẩm</Link></li>
              <li><Link to="/danh-muc/ao" className="hover:text-white transition-colors">Áo</Link></li>
              <li><Link to="/danh-muc/quan" className="hover:text-white transition-colors">Quần</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Chính sách đổi trả</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hướng dẫn mua hàng</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Liên hệ</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Liên hệ</h3>
            <ul className="space-y-2 text-sm">
              <li>📞 0123 456 789</li>
              <li>✉️ support@certainshop.vn</li>
              <li>📍 Hà Nội, Việt Nam</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
          © 2025 CertainShop. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
