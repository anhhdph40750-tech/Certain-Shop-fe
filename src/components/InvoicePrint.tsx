import { useRef } from 'react';
import { Printer, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import type { DonHang } from '../services/api';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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

  // Download as PDF with direct file download - PROVEN ENTERPRISE PATTERN
  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    let container: HTMLElement | null = null;
    try {
      // Step 1: Clone element to preserve original
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Step 2: Remove all Tailwind classes (prevents CSS parser conflicts)
      clonedElement.querySelectorAll('*').forEach(el => {
        (el as HTMLElement).removeAttribute('class');
      });

      // Step 3: Hide buttons and interactive elements
      clonedElement.querySelectorAll('button').forEach(btn => {
        (btn as HTMLElement).style.display = 'none';
      });

      // Step 4: Create temporary container with explicit styling
      container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '210mm';
      container.style.height = 'auto';
      container.style.backgroundColor = '#ffffff';
      container.style.padding = '0';
      container.style.margin = '0';
      container.style.border = 'none';
      container.style.boxSizing = 'border-box';
      
      container.appendChild(clonedElement);
      document.body.appendChild(container);

      // Step 5: Give browser time to render in new context
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 6: Render to canvas with proven options
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 800,
        windowHeight: clonedElement.scrollHeight,
        ignoreElements: (el: Element) => {
          return el.tagName === 'BUTTON';
        }
      });

      // Step 7: Validate canvas
      const imageData = canvas.toDataURL('image/png');
      if (!imageData || imageData.length < 1000) {
        throw new Error('Canvas rendering failed - image too small');
      }

      // Step 8: Create PDF with proper dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Step 9: Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const imgWidth = pdfWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Step 10: Add image to PDF (handles pagination automatically)
      pdf.addImage(imageData, 'PNG', margin, margin, imgWidth, imgHeight);

      // Step 11: If multiple pages needed, add them
      if (imgHeight > pdfHeight - 2 * margin) {
        let remainingHeight = imgHeight - (pdfHeight - 2 * margin);
        while (remainingHeight > 0) {
          pdf.addPage();
          pdf.addImage(imageData, 'PNG', margin, margin, imgWidth, imgHeight);
          remainingHeight -= (pdfHeight - 2 * margin);
        }
      }

      // Step 12: Direct download (NO print dialog)
      pdf.save(`hoa-don-${donHang.maDonHang}.pdf`);

      // Step 13: Cleanup container
      if (container && container.parentElement) {
        document.body.removeChild(container);
        container = null;
      }
    } catch (error) {
      console.error('Invoice download error:', error);
      
      // Cleanup on error
      if (container && container.parentElement) {
        document.body.removeChild(container);
      }

      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(
        `Lỗi tải xuống hóa đơn: ${errorMsg}\n\n` +
        `Vui lòng thử lại. Nếu lỗi vẫn tiếp tục, sử dụng nút "In hóa đơn" để lưu PDF.`
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
        className="bg-white p-12 print:p-0 rounded-lg"
        style={{ pageBreakAfter: 'avoid', fontSize: '16px' }}
      >
        {/* Header */}
        <div className="border-b-4 border-indigo-600 pb-10 mb-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold text-gray-900">CertainShop</h1>
              <p className="text-gray-600 text-lg mt-3">Cửa hàng bán lẻ trực tuyến chuyên áo phong chất lượng cao</p>
              <p className="text-gray-500 text-base mt-4">
                Điện thoại: (111) 222-3333 | Email: support@certainshop.vn
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-indigo-600">HÓA ĐƠN</p>
              <p className="text-gray-600 text-lg mt-4">Số hóa đơn: {donHang.maDonHang}</p>
              <p className="text-gray-500 text-base">Ngày: {formatDate(donHang.thoiGianTao)}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="font-bold text-lg text-gray-900 mb-4 border-b border-indigo-300 pb-3">THÔNG TIN KHÁCH HÀNG</p>
            <p className="text-lg text-gray-800 mb-3"><span className="font-semibold">Tên:</span> {donHang.tenNguoiNhan}</p>
            <p className="text-lg text-gray-700 mb-3"><span className="font-semibold">SĐT:</span> {donHang.sdtNguoiNhan}</p>
            <p className="text-lg text-gray-700"><span className="font-semibold">Địa chỉ:</span> {donHang.diaChiGiaoHang}</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <p className="font-bold text-lg text-gray-900 mb-4 border-b border-indigo-300 pb-3">TRẠNG THÁI ĐƠN HÀNG</p>
            <p className="text-lg text-gray-800 mb-3">
              <span className="font-semibold">Trạng thái:</span> <span className="text-indigo-600 font-bold text-xl ml-2">{donHang.trangThaiDonHang}</span>
            </p>
            <p className="text-lg text-gray-700 mb-3">
              <span className="font-semibold">Thanh toán:</span> {donHang.daThanhToan ? '✓ Đã thanh toán' : '○ Chưa thanh toán'}
            </p>
            <p className="text-lg text-gray-700">
              <span className="font-semibold">PT:</span> {donHang.phuongThucThanhToan === 'COD' ? 'COD (Tiền mặt)' : 'VNPay'}
            </p>
          </div>
        </div>

        {/* Order items table */}
        {/* Order items table */}
        <div className="mb-10">
          <p className="font-bold text-lg text-gray-900 mb-4 border-b border-indigo-300 pb-3">CHI TIẾT ĐƠN HÀNG</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-indigo-50 border-b-2 border-indigo-600">
                <th className="border border-gray-300 px-4 py-4 text-left text-lg font-bold">
                  STT
                </th>
                <th className="border border-gray-300 px-4 py-4 text-left text-lg font-bold">
                  Sản phẩm
                </th>
                <th className="border border-gray-300 px-4 py-4 text-center text-lg font-bold">
                  Đơn giá
                </th>
                <th className="border border-gray-300 px-4 py-4 text-center text-lg font-bold">
                  Số lượng
                </th>
                <th className="border border-gray-300 px-4 py-4 text-right text-lg font-bold">
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody>
              {donHang.danhSachChiTiet?.map((ct, idx) => {
                const donGia = ct.giaTaiThoiDiemMua || 0;
                const displayThanhTien = ct.thanhTien || donGia * ct.soLuong;
                return (
                  <tr key={ct.id} className="border-b border-gray-300 hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-4 text-lg text-gray-800 font-medium">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-300 px-4 py-4 text-lg text-gray-800">
                      <p className="font-semibold">{ct.bienThe?.tenSanPham}</p>
                      {(ct.bienThe?.tenMauSac || ct.bienThe?.kichThuoc) && (
                        <p className="text-base text-gray-600 mt-2">
                          {ct.bienThe?.tenMauSac && `Màu: ${ct.bienThe.tenMauSac}`}
                          {ct.bienThe?.tenMauSac && ct.bienThe?.kichThuoc && ' | '}
                          {ct.bienThe?.kichThuoc && `Size: ${ct.bienThe.kichThuoc}`}
                        </p>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-4 text-lg text-gray-800 text-center font-medium">
                      {formatCurrency(donGia)}
                    </td>
                    <td className="border border-gray-300 px-4 py-4 text-lg text-gray-800 text-center font-semibold">
                      {ct.soLuong}
                    </td>
                    <td className="border border-gray-300 px-4 py-4 text-lg text-gray-900 text-right font-bold text-indigo-600">
                      {formatCurrency(displayThanhTien)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary section */}
        <div className="flex justify-end mb-12">
          <div className="w-80 space-y-4 border-l-4 border-indigo-600 pl-10 bg-gray-50 p-8 rounded-lg">
            <div className="flex justify-between text-lg text-gray-800">
              <span className="font-semibold">Tạm tính:</span>
              <span className="font-medium">{formatCurrency(donHang.tongTienHang)}</span>
            </div>
            {donHang.soTienGiamGia > 0 && (
              <div className="flex justify-between text-lg text-green-600 font-semibold">
                <span>Giảm giá:</span>
                <span>-{formatCurrency(donHang.soTienGiamGia)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg text-gray-800">
              <span className="font-semibold">Phí vận chuyển:</span>
              <span className="font-medium">{formatCurrency(donHang.phiVanChuyen || 0)}</span>
            </div>
            <div className="border-t-2 border-indigo-300 pt-4 flex justify-between font-bold text-2xl text-indigo-600">
              <span>TỔNG CỘNG:</span>
              <span>{formatCurrency(donHang.tongTienThanhToan)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {donHang.ghiChu && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-10">
            <p className="font-bold text-lg text-gray-900 mb-3">GHI CHÚ</p>
            <p className="text-lg text-gray-800">{donHang.ghiChu}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-4 border-indigo-600 pt-10 mt-12 text-center text-gray-600">
          <p className="text-lg font-semibold text-gray-900">Cảm ơn bạn đã mua hàng tại CertainShop!</p>
          <p className="mt-4 text-lg">
            Nếu có câu hỏi, vui lòng liên hệ: <span className="font-semibold text-indigo-600">support@certainshop.vn</span> | Hotline: <span className="font-semibold">(111) 222-3333</span>
          </p>
          <p className="mt-5 text-base text-gray-500">
            Hóa đơn này được in ngày {formatDate(new Date().toISOString())}
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
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.8;
      color: #333;
      background: white;
    }
    .invoice-container {
      width: 8.5in;
      padding: 0.75in;
      margin: 0 auto;
      background: white;
    }
    h1 { font-size: 36px; margin-bottom: 8px; font-weight: bold; }
    h2 { font-size: 18px; margin-top: 18px; margin-bottom: 12px; font-weight: bold; }
    p { font-size: 16px; margin-bottom: 5px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #999;
      padding: 12px;
      text-align: left;
      font-size: 15px;
    }
    th {
      background: #f0f0f0;
      font-weight: bold;
      font-size: 16px;
    }
    .summary {
      width: 100%;
      max-width: 350px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      margin: 8px 0;
    }
    .total-row {
      font-weight: bold;
      font-size: 18px;
      border-top: 2px solid #333;
      padding-top: 8px;
    }
  </style>`;
}
