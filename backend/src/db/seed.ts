import bcrypt from 'bcryptjs';
import pool from '../config/db';

async function seed() {
  console.log('🌱 Seeding database with initial sample data...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed Users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    const usersData = [
      { name: 'System Admin', email: 'admin@fundsroom.com', role: 'Admin' },
      { name: 'Rajesh Sales Executive', email: 'sales@fundsroom.com', role: 'Sales' },
      { name: 'Vikram Warehouse Manager', email: 'warehouse@fundsroom.com', role: 'Warehouse' },
      { name: 'Ananya Accountant', email: 'accounts@fundsroom.com', role: 'Accounts' },
    ];

    const userIds: Record<string, number> = {};

    for (const u of usersData) {
      const res = await client.query(
        `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
        RETURNING id, role
        `,
        [u.name, u.email, passwordHash, u.role]
      );
      userIds[u.role] = res.rows[0].id;
    }

    console.log('  [+] Users seeded (Admin, Sales, Warehouse, Accounts)');

    // 2. Seed Customers
    const customersData = [
      {
        name: 'Amit Sharma',
        mobile_number: '9876543210',
        email: 'amit.sharma@apexind.com',
        business_name: 'Apex Industries Pvt Ltd',
        gst_number: '27AAACA123411Z5',
        customer_type: 'Wholesale',
        address: 'Plot 42, MIDC Industrial Area, Andheri East, Mumbai, MH',
        status: 'Active',
        notes: 'Key distributor for West region. Prefers 30-day billing cycle.',
      },
      {
        name: 'Priya Patel',
        mobile_number: '9123456789',
        email: 'priya@techtronics.in',
        business_name: 'Techtronics Retail Store',
        gst_number: '24BBBBB567822Z9',
        customer_type: 'Retail',
        address: 'Shop 12, Sunrise Commercial Complex, Satellite, Ahmedabad, GJ',
        status: 'Lead',
        notes: 'Interested in bulk order of smart sensors. Scheduled demo next week.',
      },
      {
        name: 'Sunil Verma',
        mobile_number: '9988776655',
        email: 's.verma@verma-logistics.com',
        business_name: 'Verma Logistics & Supplies',
        gst_number: '07CCCCC901233Z1',
        customer_type: 'Distributor',
        address: 'Transport Nagar, Sector 18, Gurugram, HR',
        status: 'Active',
        notes: 'Regular buyer for industrial motors.',
      },
    ];

    const customerIds: number[] = [];
    for (const c of customersData) {
      const res = await client.query(
        `
        INSERT INTO customers (name, mobile_number, email, business_name, gst_number, customer_type, address, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
        `,
        [
          c.name,
          c.mobile_number,
          c.email,
          c.business_name,
          c.gst_number,
          c.customer_type,
          c.address,
          c.status,
          c.notes,
        ]
      );
      customerIds.push(res.rows[0].id);
    }
    console.log('  [+] Sample Customers seeded');

    // 3. Seed Products
    const productsData = [
      {
        name: 'Industrial Heavy Motor 5HP',
        sku: 'MOT-IND-001',
        category: 'Electrical Motors',
        unit_price: 15500.00,
        current_stock: 50,
        min_stock_alert: 10,
        location: 'Warehouse A - Bay 3',
      },
      {
        name: 'Digital Hydraulic Pressure Gauge',
        sku: 'GAU-HYD-002',
        category: 'Instrumentation',
        unit_price: 3200.00,
        current_stock: 5, // Low stock on purpose to test alerts!
        min_stock_alert: 8,
        location: 'Warehouse B - Shelf 12',
      },
      {
        name: 'Automated Control Sensor Module',
        sku: 'SEN-AUT-003',
        category: 'Electronics',
        unit_price: 8900.00,
        current_stock: 100,
        min_stock_alert: 15,
        location: 'Warehouse A - Bay 1',
      },
      {
        name: 'High Precision Pneumatic Valve',
        sku: 'VAL-PNE-004',
        category: 'Pneumatics',
        unit_price: 4500.00,
        current_stock: 0, // Out of stock to test failure on challan confirmation!
        min_stock_alert: 5,
        location: 'Warehouse B - Shelf 4',
      },
    ];

    for (const p of productsData) {
      const prodRes = await client.query(
        `
        INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (sku) DO UPDATE SET current_stock = EXCLUDED.current_stock
        RETURNING id
        `,
        [p.name, p.sku, p.category, p.unit_price, p.current_stock, p.min_stock_alert, p.location]
      );

      const prodId = prodRes.rows[0].id;

      // Seed initial stock movement log (IN)
      if (p.current_stock > 0) {
        await client.query(
          `
          INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
          VALUES ($1, $2, 'IN', 'Initial Stock Intake Seed', $3)
          `,
          [prodId, p.current_stock, userIds['Warehouse']]
        );
      }
    }
    console.log('  [+] Sample Products & Stock Movements seeded');

    await client.query('COMMIT');
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
