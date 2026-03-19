import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const token = parsed?.state?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { /* ignore */ }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isAuthRequest = err.config?.url?.includes('/auth/');
      // Only redirect to login if not an auth request (login, register, etc.)
      if (!isAuthRequest) {
        localStorage.removeItem('auth-storage');
        if (window.location.pathname !== '/dang-nhap') {
          window.location.href = '/dang-nhap';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ===================== TYPES =====================

export interface ApiResponse<T> {
  thanhCong: boolean;
  thongBao: string;
  duLieu: T;
  maLoi?: number;
}

/** Trả về từ /auth/* và /tai-khoan/thong-tin */
export interface User {
  id: number;
  tenDangNhap: string;
  hoTen: string;
  email: string;
  soDienThoai: string; // field thực tế trong NguoiDung entity
  anhDaiDien: string;
  vaiTro: string;      // "ADMIN" | "NHAN_VIEN" | "KHACH_HANG"
  ngaySinh?: string;
  gioiTinh?: boolean;
}

/** Trả từ admin /quan-ly/nguoi-dung — serialize từ NguoiDung entity */
export interface NguoiDungAdmin {
  id: number;
  tenDangNhap: string;
  hoTen: string;
  email: string;
  soDienThoai: string;
  trangThai: string;        // "HOAT_DONG" | ...
  dangHoatDong: boolean;
  thoiGianTao: string;
  vaiTro: { id: number; tenVaiTro: string } | null;
}

/** Sản phẩm tóm tắt (từ list endpoints) - fields từ toSanPhamSummary backend */
export interface SanPhamItem {
  id: number;
  maSanPham: string;
  tenSanPham: string;
  duongDan: string;
  giaGoc: number;
  giaBan: number;
  anhChinh: string;
  trangThaiSanPham: string;
  danhMuc?: { id: number; tenDanhMuc: string; duongDan: string };
  thuongHieu?: { id: number; tenThuongHieu: string };
}

/** Biến thể sản phẩm - fields từ toSanPhamDetail backend */
export interface BienThe {
  id: number;
  gia: number;
  soLuongTon: number;
  macDinh: boolean;
  kichThuoc?: { id: number; tenKichThuoc: string }; // field là tenKichThuoc, không phải kichCo
  mauSac?: { id: number; tenMauSac: string; maHex: string }; // field là tenMauSac, không phải tenMau
  chatLieu?: { id: number; tenChatLieu: string };
  hinhAnh?: { id: number; duongDan: string; laAnhChinh: boolean }[]; // field là duongDan, không phải duongDanAnh
}

/** Sản phẩm chi tiết (từ /san-pham/{duongDan}) */
export interface SanPhamDetail extends SanPhamItem {
  moTa: string;
  bienThe: BienThe[];
}

/** Giỏ hàng chi tiết - fields từ toChiTietResponse backend */
export interface GioHangChiTiet {
  id: number;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  bienThe: {
    id: number;
    soLuongTon: number;
    anhChinh: string;
    tenSanPham: string;
    duongDanSanPham: string;
    kichThuoc: string;    // string, e.g. "L" — không phải object
    tenMauSac: string;
    maHexMauSac: string;
    gia?: number;          // optional price in case backend includes it
  };
}

export interface GioHang {
  id: number;
  danhSachChiTiet: GioHangChiTiet[];
  soLuongSanPham: number; // field thực tế từ backend
  tongTien: number;
}

/** Chi tiết sản phẩm trong đơn hàng - fields từ toDonHangDetail backend */
export interface ChiTietDonHang {
  id: number;
  soLuong: number;
  giaTaiThoiDiemMua: number;
  thanhTien: number;
  bienThe: {
    id: number;
    anhChinh?: string;
    tenSanPham?: string;
    duongDanSanPham?: string;
    kichThuoc?: string;    // string
    tenMauSac?: string;
  };
}

export interface LichSuTrangThai {
  trangThai: string;
  ghiChu: string;
  thoiGianTao: string;
}

/** Voucher */
export interface Voucher {
  id: number;
  maVoucher: string;
  moTa: string;
  trangThai: boolean;
  ngayBatDau: string;
  ngayKetThuc: string;
  giaTriToiThieu?: number;
  giaTriGiamToiDa: number;
  loaiGiam: string; // "PERCENT" or "FIXED"
  giaTriGiam: number;
  soLuongSuDung: number;
  soLuongToiDa?: number;
}

/** Đơn hàng - fields từ toDonHangSummary + toDonHangDetail backend */
export interface DonHang {
  id: number;
  maDonHang: string;
  trangThaiDonHang: string;
  loaiDonHang: string;
  tongTienHang: number;   // = dh.getTongTien() trong backend
  soTienGiamGia: number;
  phiVanChuyen: number;
  tongTienThanhToan: number;
  phuongThucThanhToan: string;
  daThanhToan: boolean;
  tenNguoiNhan: string;
  sdtNguoiNhan: string;
  diaChiGiaoHang: string;
  ghiChu?: string;
  thoiGianTao: string;
  soMatHang: number;
  danhSachChiTiet?: ChiTietDonHang[];
  lichSuTrangThai?: LichSuTrangThai[];
}

export interface DanhMuc {
  id: number;
  tenDanhMuc: string;
  duongDan: string;
  moTa: string;
}

export interface ThuongHieu {
  id: number;
  tenThuongHieu: string;
  moTa: string;
}

/** DiaChiNguoiDung entity — field names chính xác từ Java entity */
export interface DiaChi {
  id?: number;
  hoTen: string;           // DB: TenNguoiNhan
  soDienThoai: string;     // DB: SoDienThoai
  diaChiDong1: string;     // DB: DiaChiCuThe (địa chỉ cụ thể, số nhà, đường)
  diaChiDong2?: string;
  phuongXa: string;
  quanHuyen: string;
  tinhThanh: string;
  laMacDinh: boolean;      // DB: LaMacDinh
  maTinhGHN?: number;
  maHuyenGHN?: number;
  maXaGHN?: string;
}

// ===================== AUTH =====================

export const authApi = {
  dangNhap: (tenDangNhap: string, matKhau: string) =>
    api.post<ApiResponse<{ token: string; tokenType: string; nguoiDung: User }>>('/auth/dang-nhap', { tenDangNhap, matKhau }),

  dangKy: (data: { tenDangNhap: string; matKhau: string; xacNhanMatKhau: string; hoTen: string; email: string; soDienThoai?: string }) =>
    api.post<ApiResponse<{ token: string; tokenType: string; nguoiDung: User }>>('/auth/dang-ky', data),

  layThongTinToi: () =>
    api.get<ApiResponse<User>>('/auth/toi'),
};

// ===================== SẢN PHẨM =====================
// Tất cả list endpoints trả về: { danhSach, tongSoTrang, tongSoBan, trangHienTai }

export const sanPhamApi = {
  /** GET /san-pham → { danhSach, tongSoTrang, tongSoBan, trangHienTai } */
  danhSach: (params?: { tuKhoa?: string; danhMucId?: number; thuongHieuId?: number; trang?: number; kichThuocTrang?: number }) =>
    api.get<ApiResponse<{ danhSach: SanPhamItem[]; tongSoTrang: number; tongSoBan: number; trangHienTai: number }>>('/san-pham', { params }),

  /** GET /san-pham/{duongDan} → SanPhamDetail (có moTa + bienThe) */
  chiTiet: (duongDan: string) =>
    api.get<ApiResponse<SanPhamDetail>>(`/san-pham/${duongDan}`),

  /** GET /san-pham/ban-chay → SanPhamItem[] */
  banChay: (soLuong = 8) =>
    api.get<ApiResponse<SanPhamItem[]>>('/san-pham/ban-chay', { params: { soLuong } }),

  /** GET /san-pham/moi → SanPhamItem[] */
  moi: (soLuong = 8) =>
    api.get<ApiResponse<SanPhamItem[]>>('/san-pham/moi', { params: { soLuong } }),

  /** GET /danh-muc → { id, tenDanhMuc, duongDan, moTa }[] */
  danhMuc: () =>
    api.get<ApiResponse<DanhMuc[]>>('/danh-muc'),

  /** GET /danh-muc/{duongDan}/san-pham → { danhSach, tongSoTrang, tongSoBan, trangHienTai } */
  sanPhamTheoDanhMuc: (duongDan: string, trang = 0, kichThuocTrang = 12) =>
    api.get<ApiResponse<{ danhSach: SanPhamItem[]; tongSoTrang: number; tongSoBan: number; trangHienTai: number }>>(`/danh-muc/${duongDan}/san-pham`, { params: { trang, kichThuocTrang } }),
  /** GHN shipping api */
  ghn: {
    tinhPhi: (maHuyenNhan: number, maXaNhan: string, weight = 0) =>
      api.post<ApiResponse<{ fee: number }>>('/ghn/fee', {}, { params: { maHuyenNhan, maXaNhan, weight } }),
  },
  /** GET /thuong-hieu → { id, tenThuongHieu, moTa }[] */
  thuongHieu: () =>
    api.get<ApiResponse<ThuongHieu[]>>('/thuong-hieu'),
};

// alias to easily import GHN endpoints directly from sanPhamApi
export const ghnApi = sanPhamApi.ghn;

// ===================== GIỎ HÀNG =====================

export const gioHangApi = {
  lay: () =>
    api.get<ApiResponse<GioHang>>('/gio-hang'),

  them: (bienTheId: number, soLuong: number) =>
    api.post<ApiResponse<GioHang>>('/gio-hang/them', { bienTheId, soLuong }),

  capNhat: (chiTietId: number, soLuong: number) =>
    api.put<ApiResponse<GioHang>>(`/gio-hang/cap-nhat/${chiTietId}`, { soLuong }),

  xoa: (chiTietId: number) =>
    api.delete<ApiResponse<GioHang>>(`/gio-hang/xoa/${chiTietId}`),

  xoaHet: () =>
    api.delete<ApiResponse<GioHang>>('/gio-hang/xoa-het'),
};

// ===================== ĐƠN HÀNG =====================

export const donHangApi = {
  datHang: (data: unknown) =>
    api.post<ApiResponse<DonHang>>('/dat-hang', data),

  /** GET /don-hang/cua-toi → { danhSach, tongSoTrang, tongSoBan, trangHienTai } */
  danhSachCuaToi: (trang = 0) =>
    api.get<ApiResponse<{ danhSach: DonHang[]; tongSoTrang: number; tongSoBan: number; trangHienTai: number }>>('/don-hang/cua-toi', { params: { trang } }),

  /** GET /don-hang/cua-toi/{maDonHang} → DonHang (full với danhSachChiTiet + lichSuTrangThai) */
  chiTiet: (maDonHang: string) =>
    api.get<ApiResponse<DonHang>>(`/don-hang/cua-toi/${maDonHang}`),

  /** POST /don-hang/huy/{maDonHang} — nhận maDonHang (string), không phải id */
  huyDon: (maDonHang: string) =>
    api.post<ApiResponse<null>>(`/don-hang/huy/${maDonHang}`),

  /** POST /don-hang/xac-nhan-nhan-hang/{maDonHang} — nhận maDonHang (string) */
  xacNhanNhanHang: (maDonHang: string) =>
    api.post<ApiResponse<null>>(`/don-hang/xac-nhan-nhan-hang/${maDonHang}`),

  /** POST /khuyen-mai/kiem-tra */
  kiemTraKhuyenMai: (maKhuyenMai: string, tongTienHang: number) =>
    api.post<ApiResponse<{ id: number; maKhuyenMai: string; tenKhuyenMai: string; soTienGiam: number }>>('/khuyen-mai/kiem-tra', { maKhuyenMai, tongTienHang }),

  /** GET /vnpay-return — xác thực thanh toán VNPay (gọi từ VNPayReturnPage) */
  xacThucVNPayReturn: (params: Record<string, string>) =>
    api.get<ApiResponse<{ maDonHang: string; donHangId: number; maGiaoDich: string; tongTienThanhToan: number; trangThaiDonHang: string }>>('/vnpay-return', { params }),
};

// ===================== TÀI KHOẢN =====================

export const taiKhoanApi = {
  /** GET /tai-khoan/thong-tin → User */
  layThongTin: () =>
    api.get<ApiResponse<User>>('/tai-khoan/thong-tin'),

  /** PUT /tai-khoan/thong-tin — body: { hoTen, soDienThoai, email, gioiTinh?, ngaySinh? } */
  capNhatThongTin: (data: { hoTen: string; soDienThoai?: string; email?: string; gioiTinh?: boolean; ngaySinh?: string }) =>
    api.put<ApiResponse<User>>('/tai-khoan/thong-tin', data),

  /** POST /tai-khoan/doi-mat-khau — body: { matKhauCu, matKhauMoi } */
  doiMatKhau: (matKhauCu: string, matKhauMoi: string) =>
    api.post<ApiResponse<null>>('/tai-khoan/doi-mat-khau', { matKhauCu, matKhauMoi }),

  /** GET /tai-khoan/dia-chi → DiaChi[] (DiaChiNguoiDung entity) */
  danhSachDiaChi: () =>
    api.get<ApiResponse<DiaChi[]>>('/tai-khoan/dia-chi'),

  /** POST /tai-khoan/dia-chi — body: DiaChi (fields: hoTen, soDienThoai, diaChiDong1, phuongXa, quanHuyen, tinhThanh, laMacDinh) */
  themDiaChi: (diaChi: Omit<DiaChi, 'id'>) =>
    api.post<ApiResponse<DiaChi>>('/tai-khoan/dia-chi', diaChi),

  /** PUT /tai-khoan/dia-chi/{id} */
  capNhatDiaChi: (id: number, diaChi: Partial<DiaChi>) =>
    api.put<ApiResponse<DiaChi>>(`/tai-khoan/dia-chi/${id}`, diaChi),

  /** DELETE /tai-khoan/dia-chi/{id} */
  xoaDiaChi: (id: number) =>
    api.delete<ApiResponse<null>>(`/tai-khoan/dia-chi/${id}`),

  /** PUT /tai-khoan/dia-chi/{id}/mac-dinh */
  datLamMacDinh: (id: number) =>
    api.put<ApiResponse<null>>(`/tai-khoan/dia-chi/${id}/mac-dinh`),
};

// ===================== ĐỊA CHỈ & GHN =====================

export const diaChiApi = {
  // --- API GHN ---
  /** GET /dia-chi/tinh-thanh → { ProvinceID, ProvinceName }[] */
  layDanhSachTinh: () =>
    api.get<ApiResponse<{ ProvinceID: number; ProvinceName: string }[]>>('/dia-chi/tinh-thanh'),

  /** GET /dia-chi/quan-huyen?maTinh=xx → { DistrictID, DistrictName }[] */
  layDanhSachHuyen: (maTinh: number) =>
    api.get<ApiResponse<{ DistrictID: number; DistrictName: string }[]>>('/dia-chi/quan-huyen', { params: { maTinh } }),

  /** GET /dia-chi/phuong-xa?maHuyen=xx → { WardCode, WardName }[] */
  layDanhSachXa: (maHuyen: number) =>
    api.get<ApiResponse<{ WardCode: string; WardName: string }[]>>('/dia-chi/phuong-xa', { params: { maHuyen } }),

  /** POST /dia-chi/tinh-phi-ship?maHuyen=xx&maXa=xx&trongLuong=xx → { phiVanChuyen: number } */
  tinhPhiVanChuyen: (maHuyen: number, maXa: string, trongLuong = 500) =>
    api.post<ApiResponse<{ phiVanChuyen: number }>>('/dia-chi/tinh-phi-ship', {}, { params: { maHuyen, maXa, trongLuong } }),

  // --- Quản lý địa chỉ (new endpoints) ---
  /** GET /dia-chi/user-addresses → DiaChiChiTietDto[] */
  layDanhSachDiaChiNguoiDung: () =>
    api.get<ApiResponse<DiaChi[]>>('/dia-chi/user-addresses'),

  /** GET /dia-chi/{diaChiId} → DiaChiChiTietDto */
  layChiTietDiaChi: (diaChiId: number) =>
    api.get<ApiResponse<DiaChi>>(`/dia-chi/${diaChiId}`),

  /** POST /dia-chi → DiaChiChiTietDto */
  taoDiaChi: (diaChi: Omit<DiaChi, 'id'>) =>
    api.post<ApiResponse<DiaChi>>('/dia-chi', diaChi),

  /** PUT /dia-chi/{diaChiId} → DiaChiChiTietDto */
  capNhatDiaChi: (diaChiId: number, diaChi: Partial<DiaChi>) =>
    api.put<ApiResponse<DiaChi>>(`/dia-chi/${diaChiId}`, diaChi),

  /** DELETE /dia-chi/{diaChiId} */
  xoaDiaChi: (diaChiId: number) =>
    api.delete<ApiResponse<null>>(`/dia-chi/${diaChiId}`),

  /** POST /dia-chi/{diaChiId}/set-default */
  datLamMacDinh: (diaChiId: number) =>
    api.post<ApiResponse<null>>(`/dia-chi/${diaChiId}/set-default`),
};

// ===================== ADMIN =====================

export const adminApi = {
  // --- Thống kê ---
  /** GET /quan-ly/thong-ke/tong-quan */
  tongQuan: () =>
    api.get<ApiResponse<Record<string, unknown>>>('/quan-ly/thong-ke/tong-quan'),

  /** GET /quan-ly/thong-ke/doanh-thu?tuNgay=&denNgay= */
  doanhThu: (tuNgay: string, denNgay: string) =>
    api.get<ApiResponse<{ chiTiet: unknown[]; tongDoanhThu: number }>>('/quan-ly/thong-ke/doanh-thu', { params: { tuNgay, denNgay } }),

  sanPhamBanChay: () =>
    api.get<ApiResponse<unknown[]>>('/quan-ly/thong-ke/san-pham-ban-chay'),

  sanPhamSapHetHang: () =>
    api.get<ApiResponse<unknown[]>>('/quan-ly/thong-ke/san-pham-sap-het-hang'),

  // --- Đơn hàng admin ---
  /** GET /quan-ly/don-hang → { danhSach, tongSoTrang, tongSoBan, trangHienTai } */
  danhSachDonHang: (params?: { trang?: number; kichThuocTrang?: number; trangThai?: string; tuKhoa?: string; sort?: 'asc'| 'desc' }) =>
    api.get<ApiResponse<{ danhSach: DonHang[]; tongSoTrang: number; tongSoBan: number }>>('/quan-ly/don-hang', { params }),

  /** GET /quan-ly/don-hang/{maDonHang} */
  chiTietDonHang: (maDonHang: string) =>
    api.get<ApiResponse<DonHang>>(`/quan-ly/don-hang/${maDonHang}`),

  /** POST /quan-ly/don-hang/{maDonHang}/cap-nhat-trang-thai
   *  body: { trangThai, ghiChu }
   *  path: maDonHang (string), NOT id
   */
  capNhatTrangThaiDonHang: (maDonHang: string, trangThai: string, ghiChu = '') =>
    api.post<ApiResponse<null>>(`/quan-ly/don-hang/${maDonHang}/cap-nhat-trang-thai`, { trangThai, ghiChu }),

  // --- Sản phẩm admin ---
  /** GET /quan-ly/san-pham → { sanPham, tongSo, tongTrang, trang } */
  danhSachSanPham: (params?: { tuKhoa?: string; danhMucId?: number; thuongHieuId?: number; trang?: number }) =>
    api.get<ApiResponse<{ sanPham: SanPhamItem[]; tongSo: number; tongTrang: number }>>('/quan-ly/san-pham', { params }),

  taoSanPham: (data: unknown) =>
    api.post<ApiResponse<unknown>>('/quan-ly/san-pham', data),

  capNhatSanPham: (id: number, data: unknown) =>
    api.put<ApiResponse<unknown>>(`/quan-ly/san-pham/${id}`, data),

  xoaSanPham: (id: number) =>
    api.delete<ApiResponse<null>>(`/quan-ly/san-pham/${id}`),

  taoBienThe: (sanPhamId: number, data: unknown) =>
    api.post<ApiResponse<unknown>>(`/quan-ly/san-pham/${sanPhamId}/bien-the`, data),

  taoBulkBienThe: (sanPhamId: number, danhSachBienThe: unknown[]) =>
    api.post<ApiResponse<unknown>>(`/quan-ly/san-pham/${sanPhamId}/bien-the/bulk`, danhSachBienThe),

  capNhatBienThe: (bienTheId: number, data: unknown) =>
    api.put<ApiResponse<unknown>>(`/quan-ly/san-pham/bien-the/${bienTheId}`, data),

  xoaBienThe: (bienTheId: number) =>
    api.delete<ApiResponse<null>>(`/quan-ly/san-pham/bien-the/${bienTheId}`),

  /** POST /quan-ly/san-pham/bien-the/{bienTheId}/upload-anh — FormData */
  uploadAnhBienThe: (bienTheId: number, file: File, laAnhChinh = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('laAnhChinh', String(laAnhChinh));
    return api.post<ApiResponse<{ id: number; duongDan: string; laAnhChinh: boolean }>>(`/quan-ly/san-pham/bien-the/${bienTheId}/upload-anh`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** DELETE /quan-ly/san-pham/anh/{anhId} */
  xoaAnh: (anhId: number) =>
    api.delete<ApiResponse<null>>(`/quan-ly/san-pham/anh/${anhId}`),

  /** GET /san-pham/{duongDan} — lấy chi tiết sản phẩm để edit */
  chiTietSanPham: (duongDan: string) =>
    api.get<ApiResponse<SanPhamDetail>>(`/san-pham/${duongDan}`),

  // --- Người dùng admin ---
  /** GET /quan-ly/nguoi-dung → { nguoiDung, tongSo, tongTrang, trang }
   *  Serialize từ NguoiDung entity: id, tenDangNhap, hoTen, email, soDienThoai, trangThai, dangHoatDong, thoiGianTao, vaiTro{id,tenVaiTro}
   */
  danhSachNguoiDung: (params?: { tuKhoa?: string; trang?: number; tenVaiTro?: string }) =>
    api.get<ApiResponse<{ nguoiDung: NguoiDungAdmin[]; tongSo: number; tongTrang: number }>>('/quan-ly/nguoi-dung', { params }),

  /** PUT /quan-ly/nguoi-dung/{id}/trang-thai — body: { dangHoatDong: boolean } */
  doiTrangThaiNguoiDung: (id: number, dangHoatDong: boolean) =>
    api.put<ApiResponse<null>>(`/quan-ly/nguoi-dung/${id}/trang-thai`, { dangHoatDong }),

  /** PUT /quan-ly/nguoi-dung/{id}/vai-tro — body: { vaiTroId: number } (2=NV, 3=KH) */
  doiVaiTroNguoiDung: (id: number, vaiTroId: number) =>
    api.put<ApiResponse<null>>(`/quan-ly/nguoi-dung/${id}/vai-tro`, { vaiTroId }),

  huyDonHang: (maDonHang: string, ghiChu = "Admin/Nhân viên hủy đơn") =>
  api.post(`/quan-ly/don-hang/${maDonHang}/cap-nhat-trang-thai`, {
    trangThai: "DA_HUY",
    ghiChu
  }),
  layHang: (maDonHang: string) =>
  api.post(`/quan-ly/don-hang/lay-hang?maDonHang=${maDonHang}`)
};

// ===================== THUỘC TÍNH (ADMIN) =====================

export interface MauSac { id: number; tenMau: string; maHex: string; moTa?: string; }
export interface KichThuoc { id: number; kichCo: string; thuTu?: number; }
export interface ChatLieu { id: number; tenChatLieu: string; moTa?: string; }

export const voucherApi = {
  danhSachVoucherHoatDong: () => api.get<ApiResponse<Voucher[]>>('/voucher/hoat-dong'),
  danhSachTatCa: () => api.get<ApiResponse<Voucher[]>>('/voucher/all'),
  taoVoucher: (data: unknown) => api.post<ApiResponse<Voucher>>('/voucher', data),
  capNhatVoucher: (id: number, data: unknown) => api.put<ApiResponse<Voucher>>(`/voucher/${id}`, data),
  xoaVoucher: (id: number) => api.delete<ApiResponse<null>>(`/voucher/${id}`),
  tinhGiaTriGiam: (maVoucher: string, giaTriDonHang: number) =>
    api.get<ApiResponse<{ maVoucher: string; giaTriGiam: number; giaTriSauGiam: number; hopLe: boolean }>>(
      `/voucher/tinh-giam?maVoucher=${maVoucher}&giaTriDonHang=${giaTriDonHang}`
    ),
};

export const thuocTinhApi = {
  // Màu sắc
  danhSachMauSac: () => api.get<ApiResponse<MauSac[]>>('/quan-ly/thuoc-tinh/mau-sac'),
  taoMauSac: (data: { tenMau: string; maHex: string; moTa?: string }) => api.post<ApiResponse<MauSac>>('/quan-ly/thuoc-tinh/mau-sac', data),
  suaMauSac: (id: number, data: Partial<MauSac>) => api.put<ApiResponse<MauSac>>(`/quan-ly/thuoc-tinh/mau-sac/${id}`, data),
  xoaMauSac: (id: number) => api.delete<ApiResponse<null>>(`/quan-ly/thuoc-tinh/mau-sac/${id}`),

  // Kích thước
  danhSachKichThuoc: () => api.get<ApiResponse<KichThuoc[]>>('/quan-ly/thuoc-tinh/kich-thuoc'),
  taoKichThuoc: (data: { kichCo: string; thuTu?: number }) => api.post<ApiResponse<KichThuoc>>('/quan-ly/thuoc-tinh/kich-thuoc', data),
  suaKichThuoc: (id: number, data: Partial<KichThuoc>) => api.put<ApiResponse<KichThuoc>>(`/quan-ly/thuoc-tinh/kich-thuoc/${id}`, data),
  xoaKichThuoc: (id: number) => api.delete<ApiResponse<null>>(`/quan-ly/thuoc-tinh/kich-thuoc/${id}`),

  // Chất liệu
  danhSachChatLieu: () => api.get<ApiResponse<ChatLieu[]>>('/quan-ly/thuoc-tinh/chat-lieu'),
  taoChatLieu: (data: { tenChatLieu: string; moTa?: string }) => api.post<ApiResponse<ChatLieu>>('/quan-ly/thuoc-tinh/chat-lieu', data),
  suaChatLieu: (id: number, data: Partial<ChatLieu>) => api.put<ApiResponse<ChatLieu>>(`/quan-ly/thuoc-tinh/chat-lieu/${id}`, data),
  xoaChatLieu: (id: number) => api.delete<ApiResponse<null>>(`/quan-ly/thuoc-tinh/chat-lieu/${id}`),

  // Danh mục
  danhSachDanhMuc: () => api.get<ApiResponse<DanhMuc[]>>('/quan-ly/thuoc-tinh/danh-muc'),
  taoDanhMuc: (data: Partial<DanhMuc>) => api.post<ApiResponse<DanhMuc>>('/quan-ly/thuoc-tinh/danh-muc', data),
  suaDanhMuc: (id: number, data: Partial<DanhMuc>) => api.put<ApiResponse<DanhMuc>>(`/quan-ly/thuoc-tinh/danh-muc/${id}`, data),
  xoaDanhMuc: (id: number) => api.delete<ApiResponse<null>>(`/quan-ly/thuoc-tinh/danh-muc/${id}`),

  // Thương hiệu
  danhSachThuongHieu: () => api.get<ApiResponse<ThuongHieu[]>>('/quan-ly/thuoc-tinh/thuong-hieu'),
  taoThuongHieu: (data: Partial<ThuongHieu>) => api.post<ApiResponse<ThuongHieu>>('/quan-ly/thuoc-tinh/thuong-hieu', data),
  suaThuongHieu: (id: number, data: Partial<ThuongHieu>) => api.put<ApiResponse<ThuongHieu>>(`/quan-ly/thuoc-tinh/thuong-hieu/${id}`, data),
  xoaThuongHieu: (id: number) => api.delete<ApiResponse<null>>(`/quan-ly/thuoc-tinh/thuong-hieu/${id}`),
};

