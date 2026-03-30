import { useRef } from 'react';
import { Printer, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import type { DonHang } from '../services/api';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from "react-qr-code";
interface InvoicePrintProps {
  donHang: DonHang;
  onClose?: () => void;
}

export default function InvoicePrint({ donHang, onClose }: InvoicePrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '', 'height=900,width=1000');
    if (!printWindow) {
      alert('Vui lòng cho phép popup để in hóa đơn');
      return;
    }
    printWindow.document.write('<html><head><title>Hóa đơn ' + donHang.maDonHang + '</title>');
    printWindow.document.write(getStyleCSS());
    printWindow.document.write('</head><body>');
    printWindow.document.write(printRef.current.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  // ENTERPRISE-GRADE SOLUTION: Remove classes FIRST, then inject clean CSS
  // This prevents html2canvas from encountering unsupported okch() color functions
  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    let container: HTMLElement | null = null;
    try {
      // Clone element
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // CRITICAL FIX: Remove ALL Tailwind classes + inline styles BEFORE injecting CSS
      // This prevents okch() color function parsing errors from html2canvas
      clonedElement.querySelectorAll('*').forEach(el => {
        (el as HTMLElement).removeAttribute('class');
        (el as HTMLElement).removeAttribute('style');
      });

      // Inject CLEAN PDF-specific CSS with ONLY standard colors (hex/rgb/rgba)
      const styleTag = document.createElement('style');
      styleTag.textContent = `
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; color: #1f2937; line-height: 1.6; overflow: visible; }
        html { width: 100%; }
        
        /* Main invoice container - no padding, handled by sections */
        div[style*="fontSize: 16px"] {
          width: 100%;
          max-width: 100%;
          min-height: 100%;
          display: block;
          background: #ffffff;
        }
        
        /* ===== HEADER SECTION ===== */
        div.border-b-4, div:has(> h1) { 
          border-bottom: 4px solid #4f46e5; 
          padding-bottom: 28px;
          padding-top: 0;
          margin-bottom: 40px; 
          background: linear-gradient(to right, #ffffff 0%, #f8f5ff 100%);
        }
        
        h1 { 
          font-size: 42px; 
          font-weight: 800; 
          color: #1f2937; 
          margin: 0 0 12px 0; 
          letter-spacing: -0.5px;
        }
        
        h2 { 
          font-size: 18px; 
          font-weight: 700; 
          color: #4f46e5; 
          margin: 24px 0 16px 0; 
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        p { color: #374151; font-size: 15px; margin: 6px 0; }
        
        /* ===== TEXT VARIANTS ===== */
        .text-gray-600 { color: #6b7280; font-size: 16px; margin-top: 8px; }
        .text-gray-500 { color: #9ca3af; font-size: 14px; margin-top: 8px; }
        .text-gray-800 { color: #1f2937; }
        .text-gray-700 { color: #374151; }
        .text-gray-900 { color: #111827; }
        .text-right { text-align: right; }
        
        .text-4xl { font-size: 38px; font-weight: 800; color: #4f46e5; margin-top: 12px; }
        .text-lg { font-size: 17px; }
        .text-base { font-size: 15px; }
        .text-center { text-align: center; }
        .text-xl { font-size: 18px; }
        .text-2xl { font-size: 22px; }
        
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        
        /* ===== LAYOUT ===== */
        div.grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 32px; 
          margin-bottom: 48px;
        }
        
        /* ===== INFO BOXES ===== */
        .bg-gray-50 { 
          background-color: #f9fafb; 
          padding: 20px; 
          border-radius: 8px; 
          border-left: 5px solid #4f46e5;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }
        
        .bg-gray-50 .space-y-3 > div { margin-bottom: 16px; }
        .bg-gray-50 .space-y-3 > div:last-child { margin-bottom: 0; }
        
        .bg-blue-50 { 
          background: linear-gradient(135deg, #f0f4ff 0%, #f8f5ff 100%);
          padding: 20px; 
          border-radius: 8px; 
          border-left: 5px solid #3b82f6;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }
        
        .bg-blue-50 .space-y-4 > div { 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          margin-bottom: 14px;
        }
        .bg-blue-50 .space-y-4 > div:last-child { margin-bottom: 0; }
        
        .border-b { 
          border-bottom: 2px solid #e5e7eb; 
          padding-bottom: 12px; 
          margin-bottom: 16px; 
          font-size: 16px; 
          color: #111827; 
          font-weight: 700;
          text-transform: uppercase;
          font-size: 13px;
          letter-spacing: 0.3px;
        }
        
        /* ===== SPACING ===== */
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-10 { margin-bottom: 40px; }
        .ml-2 { margin-left: 8px; }
        .mt-2 { margin-top: 8px; }
        .mt-3 { margin-top: 12px; }
        .mt-4 { margin-top: 16px; }
        .mt-5 { margin-top: 20px; }
        
        /* ===== COLOR UTILITIES ===== */
        .text-indigo-600 { color: #4f46e5; font-weight: 700; }
        .text-green-600 { color: #16a34a; font-weight: 700; }
        
        /* ===== TABLE STYLING ===== */
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 36px 0; 
          background-color: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          border-radius: 4px;
          overflow: hidden;
        }
        
        thead { background: linear-gradient(to right, #4f46e5 0%, #4338ca 100%); }
        th { 
          border: none;
          padding: 16px 14px;
          text-align: left; 
          font-size: 13px; 
          font-weight: 700; 
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        
        td { 
          border-bottom: 1px solid #e5e7eb; 
          padding: 14px; 
          font-size: 14px; 
          color: #374151;
          background-color: #ffffff;
        }
        
        tbody tr { background-color: #ffffff; }
        tbody tr:nth-child(even) { background-color: #fafbfc; }
        tbody tr:last-child td { border-bottom: none; }
        
        /* ===== SUMMARY BOX ===== */
        div.flex { 
          display: flex; 
          justify-content: flex-end; 
          margin-bottom: 40px; 
        }
        
        .w-80 { width: 100%; max-width: 380px; }
        
        .border-l-4 { 
          border-left: 5px solid #4f46e5; 
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.1);
        }
        
        .border-l-4 > div { display: flex; justify-content: space-between; align-items: center; }
        
        .border-t-2 { 
          border-top: 2px solid #e5e7eb; 
          padding-top: 16px; 
          margin-top: 16px;
        }
        .pt-4 { padding-top: 16px; }
        
        /* ===== NOTES BOX ===== */
        .bg-yellow-50 { 
          background: linear-gradient(135deg, #fffbeb 0%, #fef9c3 100%);
          border: 2px solid #fde047;
          border-radius: 8px; 
          padding: 20px; 
          margin-bottom: 40px;
          box-shadow: 0 2px 6px rgba(251, 191, 36, 0.1);
        }
        
        .bg-yellow-50 p { 
          color: #78350f; 
          font-size: 14px;
          font-weight: 500;
          line-height: 1.6;
        }
        
        /* ===== FOOTER ===== */
        div.border-t-4 { 
          border-top: 4px solid #4f46e5; 
          padding-top: 36px; 
          margin-top: 48px; 
          text-align: center; 
          color: #6b7280;
          min-height: 120px;
          display: block;
          page-break-inside: avoid;
        }
        
        div.border-t-4 p { 
          margin-top: 10px; 
          font-size: 14px; 
          color: #1f2937;
          font-weight: 500;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }
        
        div.border-t-4 p:first-child {
          margin-top: 0;
          font-weight: 600;
          font-size: 15px;
        }
        
        div.border-t-4 p:last-child { 
          color: #9ca3af; 
          font-size: 12px; 
          margin-top: 12px;
          font-style: italic;
          font-weight: 400;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        /* ===== UTILITIES ===== */
        button { display: none !important; }
        .bg-white { background-color: #ffffff; padding: 0; }
        .rounded-lg { border-radius: 6px; }
      `;
      clonedElement.insertBefore(styleTag, clonedElement.firstChild);

      // Hide buttons
      clonedElement.querySelectorAll('button').forEach(btn => {
        (btn as HTMLElement).style.display = 'none';
      });

      // Create temporary container with EXACT dimensions for A4 PDF
      // A4 width at 96 DPI = 794px, use 800px for safety margin
      const containerWidth = 800;
      const containerHeight = 1200; // Initial height, will be recalculated
      
      container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = containerWidth + 'px';
      container.style.minHeight = containerHeight + 'px';
      container.style.maxWidth = containerWidth + 'px';
      container.style.backgroundColor = '#ffffff';
      container.style.padding = '0';
      container.style.margin = '0';
      container.style.border = 'none';
      container.style.boxSizing = 'border-box';
      container.style.overflow = 'visible';
      
      container.appendChild(clonedElement);
      document.body.appendChild(container);

      // Let browser fully render and apply clean styles
      // Multiple checks to ensure accurate scrollHeight including footer
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force reflow to calculate accurate dimensions
      const scrollHeight1 = container.scrollHeight;
      await new Promise(resolve => setTimeout(resolve, 100));
      const scrollHeight2 = container.scrollHeight;
      
      // Use the larger value with buffer for footer
      const finalHeight = Math.max(scrollHeight1, scrollHeight2) + 40;
      container.style.minHeight = finalHeight + 'px';
      
      // Final render wait
      await new Promise(resolve => setTimeout(resolve, 100));

      // Render to canvas with exact viewport matching
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: containerWidth,
        windowHeight: finalHeight,
        ignoreElements: (el: Element) => {
          return el.tagName === 'BUTTON' || el.tagName === 'SCRIPT';
        }
      });

      // Validate canvas
      const imageData = canvas.toDataURL('image/png');
      if (!imageData || imageData.length < 1000) {
        throw new Error('Canvas rendering failed - image data too small');
      }

      // Create PDF with proper page sizing
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        precision: 2
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const maxWidth = pdfWidth - 2 * margin;
      
      // Calculate image dimensions correctly
      const imgWidth = maxWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image WITHOUT duplication
      pdf.addImage(imageData, 'PNG', margin, margin, imgWidth, imgHeight);
      
      // Only add additional pages if content truly exceeds one page
      if (imgHeight > pdfHeight - 2 * margin - 5) {
        // Content needs multiple pages - but don't duplicate
        const remainingHeight = imgHeight - (pdfHeight - 2 * margin);
        const pageHeight = pdfHeight - 2 * margin;
        const numPages = Math.ceil(remainingHeight / pageHeight);
        
        for (let i = 0; i < numPages; i++) {
          pdf.addPage();
          const yOffset = -(pdfHeight - 2 * margin) * (i + 1);
          pdf.addImage(imageData, 'PNG', margin, yOffset + margin, imgWidth, imgHeight);
        }
      }

      pdf.save(`hoa-don-${donHang.maDonHang}.pdf`);

      if (container && container.parentElement) {
        document.body.removeChild(container);
        container = null;
      }
    } catch (error) {
      console.error('Invoice download error:', error);
      
      if (container && container.parentElement) {
        try {
          document.body.removeChild(container);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(
        `Lỗi tải xuống hóa đơn:\n${errorMsg}\n\n` +
        `Vui lòng thử lại hoặc sử dụng nút "In hóa đơn" để lưu PDF.`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 btn-primary px-6 py-3 text-lg font-semibold"
        >
          <Printer className="w-5 h-5" /> In hóa đơn
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 btn-secondary px-6 py-3 text-lg font-semibold"
        >
          <Download className="w-5 h-5" /> Tải xuống
        </button>
        {onClose && (
          <button onClick={onClose} className="btn-outline px-6 py-3 text-lg font-semibold">
            Đóng
          </button>
        )}
      </div>

      {/* Invoice template for printing */}
      <div
        ref={printRef}
        className="bg-white print:p-0 rounded-lg"
        style={{ pageBreakAfter: 'avoid', fontSize: '16px', padding: '0' }}
      >
        {/* Header with gradient background */}
        <div className="border-b-4 border-indigo-600 pb-10 mb-10" style={{ padding: '32px' }}>
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-gray-900">CertainShop</h1>
              <p className="text-gray-600 text-lg mt-2">Premium T-Shirt Retailer</p>
              <p className="text-gray-500 text-sm mt-3">
                (111) 222-3333 | support@certainshop.vn
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-indigo-600">HÓA ĐƠN</p>
              <p className="text-gray-700 text-base font-semibold mt-3">{donHang.maDonHang}</p>  
               <QRCode value={donHang.maDonHang} size={120} />
              <p className="text-gray-500 text-xs mt-1">{formatDate(donHang.thoiGianTao)}</p>
            </div>
          </div>
        </div>

        {/* Customer Info and Order Status */}
        <div className="grid grid-cols-2 gap-12 mb-12" style={{ padding: '0 32px' }}>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="font-bold text-lg text-gray-900 mb-4 border-b border-indigo-300 pb-3 uppercase tracking-wide">Thông tin khách hàng</p>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Tên khách hàng</p>
                <p className="text-base font-bold text-indigo-600">{donHang.tenNguoiNhan}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Số điện thoại</p>
                <p className="text-base font-medium text-gray-800">{donHang.sdtNguoiNhan}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Địa chỉ nhận hàng</p>
                <p className="text-base font-medium text-gray-800 leading-relaxed">{donHang.diaChiGiaoHang}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <p className="font-bold text-lg text-gray-900 mb-4 border-b border-indigo-300 pb-3 uppercase tracking-wide">Trạng thái đơn hàng</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Trạng thái</p>
                <span className="inline-block px-4 py-2 bg-indigo-600 text-white rounded font-semibold text-sm">
                  {donHang.trangThaiDonHang}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Thanh toán</p>
                <p className="text-base font-bold">
                  {donHang.daThanhToan ? (
                    <span className="text-green-600">Đã thanh toán</span>
                  ) : (
                    <span className="text-orange-600">Chưa thanh toán</span>
                  )}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Phương thức</p>
                <p className="text-base font-medium text-gray-800">
                  {donHang.phuongThucThanhToan === 'COD' ? 'COD (Tiền mặt)' : 'VNPay'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order items table */}
        <div className="mb-10" style={{ padding: '0 32px' }}>
          <p className="font-bold text-lg text-gray-900 mb-4 border-b border-indigo-300 pb-3 uppercase tracking-wide">Chi tiết sản phẩm</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-indigo-50 border-b-2 border-indigo-600">
                <th className="border border-gray-300 px-4 py-4 text-left text-sm font-bold uppercase">STT</th>
                <th className="border border-gray-300 px-4 py-4 text-left text-sm font-bold uppercase">Sản phẩm</th>
                <th className="border border-gray-300 px-4 py-4 text-center text-sm font-bold uppercase">Đơn giá</th>
                <th className="border border-gray-300 px-4 py-4 text-center text-sm font-bold uppercase">SL</th>
                <th className="border border-gray-300 px-4 py-4 text-right text-sm font-bold uppercase">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {donHang.danhSachChiTiet?.map((ct, idx) => {
                const donGia = ct.giaTaiThoiDiemMua || 0;
                const displayThanhTien = ct.thanhTien || donGia * ct.soLuong;
                return (
                  <tr key={ct.id} className="border-b border-gray-300 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-4 text-sm text-gray-800 font-medium text-center">{idx + 1}</td>
                    <td className="border border-gray-300 px-4 py-4 text-sm text-gray-800">
                      <p className="font-semibold text-base text-indigo-600">{ct.bienThe?.tenSanPham}</p>
                      {(ct.bienThe?.tenMauSac || ct.bienThe?.kichThuoc) && (
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          {ct.bienThe?.tenMauSac && `Màu: ${ct.bienThe.tenMauSac}`}
                          {ct.bienThe?.tenMauSac && ct.bienThe?.kichThuoc && ' • '}
                          {ct.bienThe?.kichThuoc && `Size: ${ct.bienThe.kichThuoc}`}
                        </p>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-4 text-sm text-gray-800 text-center font-semibold">{formatCurrency(donGia)}</td>
                    <td className="border border-gray-300 px-4 py-4 text-sm text-gray-800 text-center font-bold">{ct.soLuong}</td>
                    <td className="border border-gray-300 px-4 py-4 text-sm text-gray-900 text-right font-bold text-indigo-600">{formatCurrency(displayThanhTien)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary section */}
        <div className="flex justify-end mb-12" style={{ padding: '0 32px' }}>
          <div className="w-80 border-l-4 border-indigo-600 bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between text-sm text-gray-700 mb-3">
              <span className="font-semibold">Tạm tính:</span>
              <span className="font-medium">{formatCurrency(donHang.tongTienHang)}</span>
            </div>
            {donHang.soTienGiamGia > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-semibold mb-3">
                <span>Giảm giá:</span>
                <span>-{formatCurrency(donHang.soTienGiamGia)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-700 mb-3">
              <span className="font-semibold">Phí vận chuyển:</span>
              <span className="font-medium">{formatCurrency(donHang.phiVanChuyen || 0)}</span>
            </div>
            <div className="border-t-2 border-indigo-300 pt-3 flex justify-between">
              <span className="font-bold text-base text-gray-900">TỔNG CỘNG:</span>
              <span className="font-bold text-lg text-indigo-600">{formatCurrency(donHang.tongTienThanhToan)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {donHang.ghiChu && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-10" style={{ margin: '0 32px 40px 32px' }}>
            <p className="font-bold text-lg text-gray-900 mb-3 uppercase tracking-wide">Ghi chú</p>
            <p className="text-base text-gray-800 font-medium">{donHang.ghiChu}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-4 border-indigo-600 pt-10 mt-12 text-center text-gray-600" style={{ padding: '0 32px 32px 32px', marginTop: '48px' }}>
          <p className="text-lg font-semibold text-gray-900">Cảm ơn bạn đã mua hàng tại CertainShop</p>
          <p className="mt-4 text-base">
            Hỗ trợ: <span className="font-bold text-indigo-600">support@certainshop.vn</span> | <span className="font-bold">(111) 222-3333</span>
          </p>
          <p className="mt-5 text-sm text-gray-500 italic" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            Hóa đơn được in vào {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:p-0 {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function getStyleCSS(): string {
  return `<style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
    }
    .invoice-container {
      width: 8.5in;
      padding: 0.75in;
      margin: 0 auto;
      background: white;
    }
    h1 { 
      font-size: 42px; 
      font-weight: 800; 
      color: #1f2937; 
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    h2 { 
      font-size: 18px; 
      font-weight: 700; 
      color: #4f46e5; 
      margin-top: 24px; 
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    p { 
      font-size: 15px; 
      margin-bottom: 6px; 
      color: #374151;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }
    thead { 
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    }
    th {
      border: none;
      padding: 14px 12px;
      text-align: left;
      font-size: 14px;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      border-bottom: 1px solid #e5e7eb;
      padding: 12px;
      text-align: left;
      font-size: 14px;
      color: #374151;
      background: white;
    }
    tbody tr { background: white; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .summary {
      width: 100%;
      max-width: 380px;
      margin-left: auto;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      margin: 10px 0;
      color: #374151;
    }
    .summary-row span:first-child { font-weight: 600; }
    .summary-row span:last-child { font-weight: 500; }
    .total-row {
      font-weight: bold;
      font-size: 18px;
      border-top: 2px solid #e5e7eb;
      padding-top: 12px;
      margin-top: 12px;
      color: #4f46e5;
    }
    .info-box {
      background: #f3f4f6;
      border-left: 4px solid #9ca3af;
      padding: 16px;
      margin: 16px 0;
      border-radius: 6px;
    }
    .info-box-blue {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-left: 4px solid #3b82f6;
    }
    .status-badge {
      display: inline-block;
      background: #4f46e5;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
      margin-top: 6px;
    }
    footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 4px solid #4f46e5;
      color: #6b7280;
      font-size: 14px;
    }
    footer p:first-child { color: #1f2937; font-weight: 500; font-size: 16px; }
  </style>`;
}
