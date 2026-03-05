export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount == null) return '0đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const trangThaiDonHangLabel: Record<string, { label: string; color: string }> = {
  // ── Trạng thái chuẩn ──
  MOI_TAO:        { label: 'Mới tạo',        color: 'gray' },
  CHO_THANH_TOAN: { label: 'Chờ thanh toán', color: 'yellow' },
  DA_THANH_TOAN:  { label: 'Đã thanh toán',  color: 'blue' },
  CHO_XAC_NHAN:   { label: 'Chờ xác nhận',   color: 'yellow' },
  DA_XAC_NHAN:    { label: 'Đã xác nhận',    color: 'blue' },
  DANG_XU_LY:     { label: 'Đang xử lý',     color: 'blue' },
  DANG_GIAO:      { label: 'Đang giao',       color: 'blue' },
  DA_GIAO:        { label: 'Đã giao',         color: 'indigo' },
  HOAN_TAT:       { label: 'Hoàn tất',        color: 'green' },
  HOAN_THANH:     { label: 'Hoàn thành',      color: 'green' },
  DA_HUY:         { label: 'Đã hủy',          color: 'red' },
  HOA_DON_CHO:    { label: 'Hóa đơn chờ',    color: 'yellow' },
  // ── Alias phòng backend đổi key ──
  COMPLETED:      { label: 'Hoàn thành',      color: 'green' },
  CANCELLED:      { label: 'Đã hủy',          color: 'red' },
  DELIVERING:     { label: 'Đang giao',       color: 'blue' },
  DELIVERED:      { label: 'Đã giao',         color: 'indigo' },
  PENDING:        { label: 'Chờ xác nhận',    color: 'yellow' },
  CONFIRMED:      { label: 'Đã xác nhận',     color: 'blue' },
  PROCESSING:     { label: 'Đang xử lý',      color: 'blue' },
};

export const trangThaiSanPhamLabel: Record<string, string> = {
  DANG_BAN: 'Đang bán',
  NGUNG_BAN: 'Ngừng bán',
  HET_HANG: 'Hết hàng',
};

// Data URI fallback — never fails, no network request, prevents flicker loop
export const PLACEHOLDER_IMG = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23f3f4f6"/><g transform="translate(200,180)" fill="%23d1d5db"><rect x="-40" y="-30" width="80" height="60" rx="8" fill="none" stroke="%23d1d5db" stroke-width="3"/><circle cx="-16" cy="-10" r="6"/><polygon points="-30,20 -5,-5 10,10 20,0 40,20"/></g><text x="200" y="230" text-anchor="middle" fill="%239ca3af" font-family="system-ui,sans-serif" font-size="14">Chưa có ảnh</text></svg>'
);

export const getImageUrl = (path: string | undefined | null): string => {
  if (!path) return PLACEHOLDER_IMG;
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  if (path.startsWith('/uploads/')) return path;
  if (path.startsWith('/')) return path;
  return `/uploads/images/${path}`;
};

/** Safe onError handler for <img>. Prevents infinite loop by checking dataset flag. */
export const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.dataset.fallback) return; // already fell back — stop
  img.dataset.fallback = '1';
  img.src = PLACEHOLDER_IMG;
};

export const slugify = (text: string): string =>
  text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
