import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as path from 'path';

const prisma = new PrismaClient();

async function run() {
  const dbPath = 'C:\\Users\\Tawan\\AppData\\Roaming\\my-vite-app\\inventory.db';
  console.log(`Open SQLite DB: ${dbPath}`);
  
  const db = (await open({
    filename: dbPath,
    driver: sqlite3.Database
  })) as any;

  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables:', tables);

  // Migrate Products
  console.log('Migrating Products...');
  try {
    const products = await db.all('SELECT * FROM products');
    for (const p of products) {
      await prisma.product.upsert({
        where: { id: Number(p.id) },
        update: {},
        create: {
          id: Number(p.id),
          barcode: String(p.barcode),
          name: String(p.name),
          brand: p.brand ? String(p.brand) : null,
          size: p.size ? String(p.size) : null,
          color: p.color ? String(p.color) : null,
          price: Number(p.price) || 0,
          quantity: Number(p.quantity) || 0
        }
      });
    }
    console.log(`Migrated ${products.length} products.`);
  } catch(e: any) { console.log('Products table error/skip:', e.message); }

  // Migrate Sales
  console.log('Migrating Sales...');
  try {
    const sales = await db.all('SELECT * FROM sales');
    for (const s of sales) {
      await prisma.sale.upsert({
        where: { id: Number(s.id) },
        update: {},
        create: {
          id: Number(s.id),
          invoiceNumber: s.invoice_number ? String(s.invoice_number) : `INV-${s.id}`,
          paymentMethod: s.payment_method ? String(s.payment_method) : null,
          subtotal: Number(s.subtotal) || 0,
          discount: Number(s.discount) || 0,
          extraCost: Number(s.extra_cost) || 0,
          total: Number(s.total) || 0,
          date: String(s.date)
        }
      });
    }
    console.log(`Migrated ${sales.length} sales.`);
  } catch(e: any) { console.log('Sales table error/skip:', e.message); }

  // Migrate Sale Items
  console.log('Migrating Sale Items...');
  try {
    const saleItems = await db.all('SELECT * FROM sale_items');
    for (const si of saleItems) {
      await prisma.saleItem.upsert({
        where: { id: Number(si.id) },
        update: {},
        create: {
          id: Number(si.id),
          sale_id: Number(si.sale_id),
          product_id: si.product_id ? Number(si.product_id) : null,
          name: si.name ? String(si.name) : null,
          price: si.price ? Number(si.price) : null,
          qty: si.qty ? Number(si.qty) : null
        }
      });
    }
    console.log(`Migrated ${saleItems.length} sale items.`);
  } catch(e: any) { console.log('Sale Items table error/skip:', e.message); }

  console.log('Migration complete!');
  await db.close();
  await prisma.$disconnect();
}

run().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
