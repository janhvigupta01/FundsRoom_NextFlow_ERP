import prisma from '../prisma';

export async function generateChallanNumber(): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const prefix = `CH-${dateStr}`;

  // Count challans created today
  const count = await prisma.salesChallan.count({
    where: {
      challanNumber: {
        startsWith: prefix
      }
    }
  });

  const nextSeq = String(count + 1).padStart(4, '0');
  return `${prefix}-${nextSeq}`;
}

export async function generateInvoiceNumber(): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${dateStr}`;

  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: {
        startsWith: prefix
      }
    }
  });

  const nextSeq = String(count + 1).padStart(4, '0');
  return `${prefix}-${nextSeq}`;
}
