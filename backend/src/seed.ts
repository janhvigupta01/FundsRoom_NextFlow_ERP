import bcrypt from 'bcryptjs';
import prisma from './prisma';

async function main() {
  console.log('🌱 Starting Database Seeding for Mini ERP + CRM...');

  // 1. Clean existing records in correct foreign-key sequence
  await prisma.invoice.deleteMany();
  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create Users for all 4 Roles
  console.log('👤 Creating users for all 4 roles...');
  const adminUser = await prisma.user.create({
    data: {
      name: 'Alexander Wright (Admin)',
      email: 'admin@erp.com',
      passwordHash,
      role: 'ADMIN'
    }
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins (Sales Exec)',
      email: 'sales@erp.com',
      passwordHash,
      role: 'SALES'
    }
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Marcus Vance (Warehouse Mgr)',
      email: 'warehouse@erp.com',
      passwordHash,
      role: 'WAREHOUSE'
    }
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Elena Rostova (Accounts Lead)',
      email: 'accounts@erp.com',
      passwordHash,
      role: 'ACCOUNTS'
    }
  });

  // 3. Create Sample Customers
  console.log('🏢 Creating sample customers...');
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Rajesh Sharma',
      businessName: 'Apex Industrial Supplies Pvt Ltd',
      mobile: '+91 98200 12345',
      email: 'rajesh@apexsupplies.com',
      gstNumber: '27AABCA1234F1Z8',
      customerType: 'DISTRIBUTOR',
      address: 'Plot 45, MIDC Industrial Area, Andheri East, Mumbai, MH 400093',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days ahead
      notes: 'Key distributor for Western Region. Prefers Net 30 payment terms.'
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Anita Desai',
      businessName: 'Metro Electronics & Hardware',
      mobile: '+91 97111 88990',
      email: 'anita.desai@metrohardware.in',
      gstNumber: '07AAECM4432K1ZP',
      customerType: 'WHOLESALE',
      address: 'Shop 12, Nehru Place Commercial Complex, New Delhi, DL 110019',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      notes: 'Interested in bulk orders of industrial switches and heavy duty fasteners.'
    }
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Vikram Mehta',
      businessName: 'Sunrise Tech Hardware',
      mobile: '+91 98450 77665',
      email: 'vikram@sunrisetech.org',
      gstNumber: '29AAECS9988D1Z2',
      customerType: 'RETAIL',
      address: '88 Brigade Road, Ashok Nagar, Bengaluru, KA 560025',
      status: 'LEAD',
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Inquired about distributor pricing tier. Sales call scheduled for Thursday.'
    }
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: 'Priya Sundaram',
      businessName: 'Coastline Logistics & Spares',
      mobile: '+91 94440 33221',
      email: 'priya@coastlinespares.com',
      gstNumber: '33AABCC5544E1ZX',
      customerType: 'DISTRIBUTOR',
      address: '24 Mount Road, Guindy Industrial Estate, Chennai, TN 600032',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Overdue follow-up
      notes: 'Monthly requirement of packaging materials and hydraulic valves.'
    }
  });

  // 4. Create Follow-up Notes
  console.log('📝 Creating CRM follow-up logs...');
  await prisma.customerNote.createMany({
    data: [
      {
        customerId: customer1.id,
        note: 'Customer inquired regarding Q3 discount structure on bulk orders above $10,000.',
        createdById: salesUser.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        customerId: customer1.id,
        note: 'Followed up via telephone. Shared updated catalog and wholesale price sheet.',
        createdById: salesUser.id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        customerId: customer3.id,
        note: 'Initial inquiry received via portal website form. Sent introductory brochure.',
        createdById: salesUser.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  // 5. Create Products & Inventory
  console.log('📦 Creating products & stock entries...');
  const p1 = await prisma.product.create({
    data: {
      name: 'Industrial Heavy Duty Drill Machine 850W',
      sku: 'PWR-DRL-850',
      category: 'Power Tools',
      unitPrice: 125.0,
      currentStock: 45,
      minStockAlert: 15,
      location: 'Warehouse A - Bay 04, Rack 2'
    }
  });

  const p2 = await prisma.product.create({
    data: {
      name: 'High Precision Digital Caliper 150mm',
      sku: 'MSR-CAL-150',
      category: 'Measuring Instruments',
      unitPrice: 42.5,
      currentStock: 80,
      minStockAlert: 20,
      location: 'Warehouse A - Bay 01, Shelf A'
    }
  });

  const p3 = await prisma.product.create({
    data: {
      name: 'Hydraulic Pressure Valve 3/4 Inch',
      sku: 'HYD-VLV-075',
      category: 'Hydraulics & Pneumatics',
      unitPrice: 210.0,
      currentStock: 6, // Low stock alert!
      minStockAlert: 12,
      location: 'Warehouse B - Secure Room 2'
    }
  });

  const p4 = await prisma.product.create({
    data: {
      name: 'Reinforced Corrugated Packaging Box (Large)',
      sku: 'PKG-BOX-LRG',
      category: 'Packaging Supplies',
      unitPrice: 4.8,
      currentStock: 450,
      minStockAlert: 100,
      location: 'Warehouse C - Staging Zone'
    }
  });

  const p5 = await prisma.product.create({
    data: {
      name: 'Safety Helmet with Visor & Ear Muffs',
      sku: 'SAF-HLM-PRO',
      category: 'Safety & PPE',
      unitPrice: 28.0,
      currentStock: 5, // Low stock alert!
      minStockAlert: 25,
      location: 'Warehouse A - PPE Section'
    }
  });

  const p6 = await prisma.product.create({
    data: {
      name: 'Stainless Steel Bolt & Nut Assortment (Pack of 500)',
      sku: 'FST-SS-500',
      category: 'Fasteners & Hardware',
      unitPrice: 65.0,
      currentStock: 0, // Out of stock!
      minStockAlert: 15,
      location: 'Warehouse B - Bin 88'
    }
  });

  // 6. Create Stock Movement Audit Trail
  console.log('📋 Creating stock movement ledger...');
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: p1.id,
        quantity: 50,
        movementType: 'IN',
        reason: 'PO-2026-0801 Supplier Delivery Batch #114',
        createdById: warehouseUser.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        productId: p1.id,
        quantity: 5,
        movementType: 'OUT',
        reason: 'Sales Challan Dispatch - CH-20260804-0001 (Apex Industrial Supplies)',
        createdById: warehouseUser.id,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        productId: p2.id,
        quantity: 100,
        movementType: 'IN',
        reason: 'Opening Inventory Stock Count Verification',
        createdById: warehouseUser.id,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        productId: p2.id,
        quantity: 20,
        movementType: 'OUT',
        reason: 'Sales Challan Dispatch - CH-20260805-0002 (Metro Electronics)',
        createdById: warehouseUser.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        productId: p3.id,
        quantity: 15,
        movementType: 'IN',
        reason: 'Emergency Vendor Shipment Receipt',
        createdById: warehouseUser.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        productId: p3.id,
        quantity: 9,
        movementType: 'OUT',
        reason: 'Sales Challan Dispatch - CH-20260806-0003 (Coastline Logistics)',
        createdById: warehouseUser.id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  // 7. Create Sample Sales Challans
  console.log('🚚 Creating sample Sales Challans...');
  
  // Confirmed Challan 1
  const challan1 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-20260804-0001',
      customerId: customer1.id,
      totalQuantity: 5,
      totalAmount: 625.0,
      status: 'CONFIRMED',
      createdById: salesUser.id,
      notes: 'Priority dispatch requested via Bluedart Express.',
      confirmedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: p1.id,
            productSnapshot: JSON.stringify({
              id: p1.id,
              name: p1.name,
              sku: p1.sku,
              category: p1.category,
              unitPrice: 125.0,
              location: p1.location
            }),
            quantity: 5,
            unitPrice: 125.0,
            totalPrice: 625.0
          }
        ]
      }
    }
  });

  // Confirmed Challan 2 with multiple items
  const challan2 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-20260805-0002',
      customerId: customer2.id,
      totalQuantity: 30,
      totalAmount: 1340.0,
      status: 'CONFIRMED',
      createdById: salesUser.id,
      notes: 'Dispatched from Warehouse A. Consignee received in good condition.',
      confirmedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: p2.id,
            productSnapshot: JSON.stringify({
              id: p2.id,
              name: p2.name,
              sku: p2.sku,
              category: p2.category,
              unitPrice: 42.5,
              location: p2.location
            }),
            quantity: 20,
            unitPrice: 42.5,
            totalPrice: 850.0
          },
          {
            productId: p4.id,
            productSnapshot: JSON.stringify({
              id: p4.id,
              name: p4.name,
              sku: p4.sku,
              category: p4.category,
              unitPrice: 49.0,
              location: p4.location
            }),
            quantity: 10,
            unitPrice: 49.0,
            totalPrice: 490.0
          }
        ]
      }
    }
  });

  // Draft Challan 3 (Pending Sales confirmation)
  await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-20260808-0003',
      customerId: customer3.id,
      totalQuantity: 2,
      totalAmount: 250.0,
      status: 'DRAFT',
      createdById: salesUser.id,
      notes: 'Customer awaiting internal finance approval before physical dispatch.',
      items: {
        create: [
          {
            productId: p1.id,
            productSnapshot: JSON.stringify({
              id: p1.id,
              name: p1.name,
              sku: p1.sku,
              category: p1.category,
              unitPrice: 125.0,
              location: p1.location
            }),
            quantity: 2,
            unitPrice: 125.0,
            totalPrice: 250.0
          }
        ]
      }
    }
  });

  // 8. Create Invoices for Accounts Module
  console.log('🧾 Creating billing invoices...');
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-20260804-0001',
      challanId: challan1.id,
      customerId: customer1.id,
      subTotal: 625.0,
      taxAmount: 112.5, // 18% GST
      grandTotal: 737.5,
      status: 'PAID',
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-20260805-0002',
      challanId: challan2.id,
      customerId: customer2.id,
      subTotal: 1340.0,
      taxAmount: 241.2,
      grandTotal: 1581.2,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('✅ Seeding completed successfully!');
  console.log('\n--- DEMO LOGIN CREDENTIALS ---');
  console.log('1. Admin:     admin@erp.com     / password123 (Full Access)');
  console.log('2. Sales:     sales@erp.com     / password123 (CRM, Challans)');
  console.log('3. Warehouse: warehouse@erp.com / password123 (Stock, Inventory, Dispatch)');
  console.log('4. Accounts:  accounts@erp.com  / password123 (Invoices, Billing)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
