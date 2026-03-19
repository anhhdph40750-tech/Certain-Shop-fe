import axios from 'axios';

const API_URL = '/api/quan-ly'; 
// Note: In development, this might need to point to the backend port (e.g., http://localhost:8080/api/...)
// But assuming a proxy is configured in Vite.

export const posService = {
  // Đợt hàng/Hóa đơn chờ
  getHoaDonCho: () => axios.get('/quan-ly/ban-hang'), // Using the existing controller for now
  taoHoaDon: () => axios.post('/quan-ly/ban-hang/tao-hoa-don'),
  getChiTietHoaDon: (id: number) => axios.get(`/quan-ly/ban-hang/${id}`),
  huyHoaDon: (id: number, lyDo?: string) => axios.post(`/quan-ly/ban-hang/${id}/huy`, null, { params: { lyDo } }),

  // Sản phẩm
  timSanPham: (q: string) => axios.get('/quan-ly/ban-hang/tim-san-pham', { params: { q } }),
  quetMaVach: (code: string) => axios.get('/quan-ly/ban-hang/quet-ma', { params: { code } }),
  
  themSanPham: (hoaDonId: number, bienTheId: number, soLuong: number) => 
    axios.post(`/quan-ly/ban-hang/${hoaDonId}/them-san-pham`, null, { params: { bienTheId, soLuong } }),
  
  capNhatSoLuong: (chiTietId: number, soLuong: number) => 
    axios.post(`/quan-ly/ban-hang/chi-tiet/${chiTietId}/cap-nhat`, null, { params: { soLuong } }),
  
  xoaSanPham: (chiTietId: number) => 
    axios.post(`/quan-ly/ban-hang/chi-tiet/${chiTietId}/xoa`),

  // Voucher
  apVoucher: (hoaDonId: number, maVoucher: string) => 
    axios.post(`/quan-ly/ban-hang/${hoaDonId}/ap-voucher`, null, { params: { maVoucher } }),
  
  xoaVoucher: (hoaDonId: number) => 
    axios.post(`/quan-ly/ban-hang/${hoaDonId}/xoa-voucher`),

  // Thanh toán
  thanhToan: (hoaDonId: number, data: {
    phuongThucThanhToan: string;
    tienKhachDua?: number;
    phuongThucPhu?: string;
    tienPhu?: number;
    khachHangId?: number;
    tenKhach?: string;
    sdtKhach?: string;
  }) => axios.post(`/quan-ly/ban-hang/${hoaDonId}/thanh-toan`, null, { params: data }),

  // Ca làm việc
  getCaHienTai: () => axios.get('/api/quan-ly/ca-ban-hang/hien-tai'),
  batDauCa: (tienDauCa: number) => axios.post('/api/quan-ly/ca-ban-hang/bat-dau', { tienDauCa }),
  ketThucCa: (caId: number, data: { tienThucTe: number; ghiChu: string }) => 
    axios.post(`/api/quan-ly/ca-ban-hang/${caId}/ket-thuc`, data),

  // Khách hàng
  timKhachHang: (q: string) => axios.get('/api/quan-ly/nguoi-dung/tim-kiem', { params: { q, vaiTro: 'KHACH_HANG' } }),
  taoKhachHang: (data: any) => axios.post('/api/quan-ly/nguoi-dung/tao-khach', data),
};
