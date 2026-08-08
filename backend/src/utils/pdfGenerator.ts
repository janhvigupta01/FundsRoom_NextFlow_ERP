import PDFDocument from 'pdfkit';

interface ChallanPDFData {
  challanNumber: string;
  createdAt: Date;
  status: string;
  totalQuantity: number;
  totalAmount: number;
  notes?: string | null;
  customer: {
    name: string;
    businessName: string;
    mobile: string;
    email: string;
    address: string;
    gstNumber?: string | null;
  };
  createdBy: {
    name: string;
    role: string;
  };
  items: Array<{
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productSnapshot: string; // JSON
  }>;
}

export function generateChallanPDF(data: ChallanPDFData): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Header Banner
  doc.rect(40, 40, 515, 65).fill('#1e293b');
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('NEXFLOW DISTRIBUTION ERP', 55, 55);
  doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('Official Delivery Challan & Dispatch Voucher', 55, 80);
  
  // Document Badge
  doc.rect(420, 50, 120, 35).fill('#3b82f6');
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text(`STATUS: ${data.status}`, 425, 62, { width: 110, align: 'center' });

  // Metadata Row
  let y = 120;
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Challan Details:', 40, y);
  doc.font('Helvetica').fontSize(9).fillColor('#475569');
  doc.text(`Challan No: ${data.challanNumber}`, 40, y + 16);
  doc.text(`Date: ${new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 40, y + 30);
  doc.text(`Prepared By: ${data.createdBy.name} (${data.createdBy.role})`, 40, y + 44);

  // Customer Details (Right Side)
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Consignee / Customer Details:', 300, y);
  doc.font('Helvetica').fontSize(9).fillColor('#475569');
  doc.text(`Name: ${data.customer.name}`, 300, y + 16);
  doc.text(`Business: ${data.customer.businessName}`, 300, y + 30);
  doc.text(`Contact: ${data.customer.mobile} | ${data.customer.email}`, 300, y + 44);
  if (data.customer.gstNumber) {
    doc.text(`GSTIN: ${data.customer.gstNumber}`, 300, y + 58);
  }
  doc.text(`Delivery Address: ${data.customer.address}`, 300, y + (data.customer.gstNumber ? 72 : 58), { width: 250 });

  // Divider Line
  y = y + 105;
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, y).lineTo(555, y).stroke();

  // Table Header
  y += 15;
  doc.rect(40, y, 515, 24).fill('#f1f5f9');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9);
  doc.text('#', 48, y + 7);
  doc.text('Product Description / SKU', 75, y + 7);
  doc.text('Qty', 330, y + 7, { width: 40, align: 'right' });
  doc.text('Rate ($)', 390, y + 7, { width: 60, align: 'right' });
  doc.text('Amount ($)', 470, y + 7, { width: 75, align: 'right' });

  // Table Items
  y += 26;
  doc.font('Helvetica').fontSize(8.5).fillColor('#334155');

  data.items.forEach((item, index) => {
    let snapshot: any = {};
    try {
      snapshot = JSON.parse(item.productSnapshot);
    } catch {
      snapshot = { name: 'Item', sku: 'N/A' };
    }

    if (index % 2 === 1) {
      doc.rect(40, y - 2, 515, 20).fill('#f8fafc');
    }

    doc.fillColor('#334155');
    doc.text(String(index + 1), 48, y + 3);
    doc.text(`${snapshot.name || 'Product'} (${snapshot.sku || 'SKU'})`, 75, y + 3, { width: 240, ellipsis: true });
    doc.text(String(item.quantity), 330, y + 3, { width: 40, align: 'right' });
    doc.text(item.unitPrice.toFixed(2), 390, y + 3, { width: 60, align: 'right' });
    doc.text(item.totalPrice.toFixed(2), 470, y + 3, { width: 75, align: 'right' });

    y += 22;
  });

  // Table Bottom Line
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, y).lineTo(555, y).stroke();

  // Summary Totals
  y += 10;
  doc.rect(320, y, 235, 55).fill('#f8fafc').stroke('#e2e8f0');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5);
  doc.text(`Total Dispatched Items: ${data.totalQuantity} units`, 335, y + 12);
  doc.fontSize(11).fillColor('#2563eb').text(`Total Valuation: $${data.totalAmount.toFixed(2)}`, 335, y + 30);

  // Notes if any
  if (data.notes) {
    doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Oblique').text(`Remarks: ${data.notes}`, 40, y + 15, { width: 260 });
  }

  // Signatures at Bottom
  const bottomY = 700;
  doc.strokeColor('#cbd5e1').lineWidth(1);
  doc.moveTo(50, bottomY).lineTo(200, bottomY).stroke();
  doc.moveTo(380, bottomY).lineTo(530, bottomY).stroke();

  doc.font('Helvetica').fontSize(9).fillColor('#64748b');
  doc.text('Receiver\'s Signature & Seal', 50, bottomY + 8, { width: 150, align: 'center' });
  doc.text('Authorized Warehouse Signatory', 380, bottomY + 8, { width: 150, align: 'center' });

  doc.fontSize(7.5).fillColor('#94a3b8').text('Generated automatically by NexFlow ERP Operations Portal • Valid without physical seal when digitally confirmed', 40, 770, { align: 'center', width: 515 });

  return doc;
}
