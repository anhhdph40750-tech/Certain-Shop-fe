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
              <li><p  >Chất Lượng 5 sao</p></li>
              <li><p >Yên tâm mua sắm</p></li>
          
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              <li><p >Chính sách đổi trả</p></li>
              <li><p >Hướng dẫn mua hàng</p></li>
              <li><p >Liên hệ</p></li>
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
