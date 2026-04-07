import api from './api';
import type { ApiResponse } from './api';

const BASE = '/quan-ly/ban-hang';

export const posService = {
  // Hóa đơn chờ
  getHoaDonCho: () => api.get<ApiResponse<any[]>>(`${BASE}/hoa-don-cho`),
  taoHoaDon: () => api.post<ApiResponse<{ id: number; maDonHang: string }>>(`${BASE}/tao-hoa-don`),
  getChiTietHoaDon: (id: number) => api.get<ApiResponse<any>>(`${BASE}/${id}`),
  huyHoaDon: (id: number) => api.post<ApiResponse<void>>(`${BASE}/${id}/huy`),

  // Sản phẩm
  timSanPham: (q: string) => api.get<ApiResponse<any[]>>(`${BASE}/tim-san-pham`, { params: { q } }),

  themSanPham: (hoaDonId: number, bienTheId: number, soLuong: number) =>
    api.post<ApiResponse<void>>(`${BASE}/${hoaDonId}/them-san-pham`, null, { params: { bienTheId, soLuong } }),

  capNhatSoLuong: (chiTietId: number, soLuong: number) =>
    api.post<ApiResponse<void>>(`${BASE}/chi-tiet/${chiTietId}/cap-nhat`, null, { params: { soLuong } }),

  xoaSanPham: (chiTietId: number) =>
    api.post<ApiResponse<void>>(`${BASE}/chi-tiet/${chiTietId}/xoa`),

  // Voucher
  apVoucher: (hoaDonId: number, maVoucher: string) =>
    api.post<ApiResponse<{ soTienGiam: number; tongSauGiam: number }>>(`${BASE}/${hoaDonId}/ap-voucher`, null, { params: { maVoucher } }),

  xoaVoucher: (hoaDonId: number) =>
    api.post<ApiResponse<void>>(`${BASE}/${hoaDonId}/xoa-voucher`),

  // Thanh toán
  thanhToan: (hoaDonId: number, data: {
    phuongThucThanhToan: string;
    khachHangId?: number;
    tenKhach?: string;
    sdtKhach?: string;
    emailBienlai?: string;
  }) => api.post<ApiResponse<{ id: number; maDonHang: string; tongTienThanhToan: number; phuongThucThanhToan: string }>>(`${BASE}/${hoaDonId}/thanh-toan`, data),

  // Khách hàng
  timKhachHang: (q: string) => api.get<ApiResponse<any[]>>(`${BASE}/tim-khach-hang`, { params: { q } }),
};
