import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type InvoiceData = {
  invoiceNumber: string;
  tableNumber: number;
  customerName?: string;
  customerPhone?: string;
  cashierName?: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentMode: string;
};

export const generateInvoicePDF = (data: InvoiceData) => {
  const doc = new jsPDF({
    unit: "mm",
    format: [80, 200], // 80mm width (thermal printer style)
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CAFE REPUBLIC", pageWidth / 2, 10, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Wardha Rd, below Chhatrapati Square Metro Station", pageWidth / 2, 15, { align: "center" });
  doc.text("beside Santaji Mahavidyalaya, New Sneh Nagar", pageWidth / 2, 19, { align: "center" });
  doc.text("Nagpur, Maharashtra 440015", pageWidth / 2, 23, { align: "center" });
  doc.text("Contact: +91 98765 43210", pageWidth / 2, 27, { align: "center" });

  doc.setLineWidth(0.2);
  doc.line(5, 30, pageWidth - 5, 30);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`INVOICE: ${data.invoiceNumber}`, 5, 35);
  doc.text(`DATE: ${data.date}`, pageWidth - 5, 35, { align: "right" });

  // Customer & Cashier Section
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  let yPos = 40;

  if (data.customerName) {
    doc.text(`Customer: ${data.customerName}`, 5, yPos);
    yPos += 4;
  }
  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, 5, yPos);
    yPos += 4;
  }

  doc.text(`Cashier: ${data.cashierName || 'Admin'}`, pageWidth - 5, 40, { align: "right" });
  doc.text(`Table: ${data.tableNumber}`, 5, yPos);
  doc.text(`Payment: ${data.paymentMode.toUpperCase()}`, pageWidth - 5, yPos, { align: "right" });

  yPos += 5;

  // Table Data using autoTable as a function
  autoTable(doc, {
    startY: yPos,
    margin: { left: 5, right: 5 },
    head: [["Item", "Qty", "Rate", "Amt"]],
    body: data.items.map((item) => [
      item.name,
      item.quantity.toString(),
      item.price.toFixed(0),
      (item.price * item.quantity).toFixed(0),
    ]),
    theme: "plain",
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fontStyle: "bold", borderBottomWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 10 },
      2: { halign: "right", cellWidth: 12 },
      3: { halign: "right", cellWidth: 15 },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 5;

  // Totals
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", pageWidth - 30, finalY, { align: "right" });
  doc.text(`Rs. ${data.total.toFixed(0)}`, pageWidth - 5, finalY, { align: "right" });

  // Footer
  const footerY = finalY + 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank You for Visiting!", pageWidth / 2, footerY, { align: "center" });
  doc.text("Open Daily: 10AM - 10PM", pageWidth / 2, footerY + 5, { align: "center" });
  doc.text("Follow us @caferepublic", pageWidth / 2, footerY + 10, { align: "center" });

  // Save the PDF
  doc.save(`Invoice_${data.invoiceNumber}.pdf`);
};

// sync: 2026-01-23 00:35:39
