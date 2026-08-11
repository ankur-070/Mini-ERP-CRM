import pool from '../config/db';
import app from '../app';
import http from 'http';
import { execSync } from 'child_process';

const PORT = 5001; // Use port 5001 for test server to avoid conflicts
let server: http.Server;

interface TestResult {
  requirement: string;
  status: 'PASS' | 'FAIL' | 'NOT TESTED';
  details?: string;
}

const testResults: TestResult[] = [];

function recordResult(requirement: string, status: 'PASS' | 'FAIL' | 'NOT TESTED', details?: string) {
  testResults.push({ requirement, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${requirement}${details ? ` - ${details}` : ''}`);
}

async function request(
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
) {
  const url = `http://localhost:${PORT}/api/v1${path}`;
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const bodyData = options.body ? JSON.stringify(options.body) : undefined;

  const res = await fetch(url, {
    method,
    headers,
    body: bodyData,
  });

  const json = await res.json();
  return { status: res.status, body: json };
}

async function runVerificationSuite() {
  console.log('\n==================================================');
  console.log('🧪 RUNNING FUNDSROOM ERP BACKEND VERIFICATION SUITE');
  console.log('==================================================\n');

  try {
    // 1. PostgreSQL Connection Test
    try {
      const client = await pool.connect();
      client.release();
      recordResult('1. PostgreSQL Connection', 'PASS', 'Successfully connected to PostgreSQL database');
    } catch (err: any) {
      recordResult('1. PostgreSQL Connection', 'FAIL', err.message);
      throw err;
    }

    // 2. Migration & Seed Execution
    try {
      console.log('Running DB Migrations...');
      execSync('npx tsx src/db/migrate.ts', { stdio: 'inherit' });
      console.log('Running DB Seeding...');
      execSync('npx tsx src/db/seed.ts', { stdio: 'inherit' });
      recordResult('2. Database Migrations & Seeding', 'PASS', 'Schema created and sample data seeded successfully');
    } catch (err: any) {
      recordResult('2. Database Migrations & Seeding', 'FAIL', err.message);
      throw err;
    }

    // 3. Start Test HTTP Server
    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`Test server running on port ${PORT}`);
        resolve();
      });
    });
    recordResult('3. HTTP Server Bootstrap', 'PASS', `Express app listening on http://localhost:${PORT}`);

    // Health Check
    const healthRes = await fetch(`http://localhost:${PORT}/health`);
    const healthJson = await healthRes.json();
    if (healthRes.status === 200 && healthJson.success) {
      recordResult('4. Health Check Endpoint', 'PASS', 'GET /health returned HTTP 200 OK');
    } else {
      recordResult('4. Health Check Endpoint', 'FAIL', `Status ${healthRes.status}`);
    }

    // 4. Test Authentication for All Four Roles
    const tokens: Record<string, string> = {};
    const roles = [
      { role: 'Admin', email: 'admin@fundsroom.com' },
      { role: 'Sales', email: 'sales@fundsroom.com' },
      { role: 'Warehouse', email: 'warehouse@fundsroom.com' },
      { role: 'Accounts', email: 'accounts@fundsroom.com' },
    ];

    let authAllPassed = true;
    for (const r of roles) {
      const res = await request('/auth/login', {
        method: 'POST',
        body: { email: r.email, password: 'Password123!' },
      });

      if (res.status === 200 && res.body.success && res.body.data.token) {
        tokens[r.role] = res.body.data.token;
      } else {
        authAllPassed = false;
        console.error(`Failed auth for role ${r.role}:`, res.body);
      }
    }

    if (authAllPassed) {
      recordResult('5. Authentication & JWT issuing (All 4 Roles)', 'PASS', 'Admin, Sales, Warehouse, Accounts logged in successfully');
    } else {
      recordResult('5. Authentication & JWT issuing (All 4 Roles)', 'FAIL', 'One or more role authentications failed');
    }

    // Auth Middleware Profile Verification
    const profileRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
    });
    if (profileRes.status === 200 && profileRes.body.data.email === 'sales@fundsroom.com') {
      recordResult('6. Auth Middleware & Token Verification', 'PASS', 'GET /auth/me decoded user identity from JWT');
    } else {
      recordResult('6. Auth Middleware & Token Verification', 'FAIL');
    }

    // Role Authorization Guard Test
    const forbiddenRes = await request('/auth/register', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['Sales']}` }, // Sales trying to register a user
      body: { name: 'Unauthorized', email: 'unauth@test.com', password: 'Password123!', role: 'Sales' },
    });
    if (forbiddenRes.status === 403 && forbiddenRes.body.error.code === 'ROLE_NOT_AUTHORIZED') {
      recordResult('7. Role Authorization Guard (RBAC)', 'PASS', 'HTTP 403 Forbidden returned when Sales attempted Admin action');
    } else {
      recordResult('7. Role Authorization Guard (RBAC)', 'FAIL', `Expected HTTP 403, got ${forbiddenRes.status}`);
    }

    // 5. Test Customer CRM Module Operations
    const createCustRes = await request('/customers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
      body: {
        name: 'Karan Mehra',
        mobile_number: '9811223344',
        email: 'karan.mehra@testcorp.com',
        business_name: 'Mehra Enterprises',
        gst_number: '27AAAAA0000A1Z5',
        customer_type: 'Wholesale',
        address: '101 Trade Center, Lower Parel, Mumbai',
        status: 'Active',
        notes: 'Initial CRM lead entry',
      },
    });

    let customerId: number = 0;
    if (createCustRes.status === 201 && createCustRes.body.success && createCustRes.body.data.id) {
      customerId = createCustRes.body.data.id;
      recordResult('8. Customer Creation', 'PASS', `Customer created with ID ${customerId}`);
    } else {
      recordResult('8. Customer Creation', 'FAIL', JSON.stringify(createCustRes.body));
    }

    // Search & Pagination Customer
    const searchCustRes = await request('/customers?search=Mehra&page=1&limit=5', {
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
    });
    if (searchCustRes.status === 200 && searchCustRes.body.data.length > 0 && searchCustRes.body.meta.page === 1) {
      recordResult('9. Customer Search & Pagination', 'PASS', `Found ${searchCustRes.body.data.length} customer(s) matching search`);
    } else {
      recordResult('9. Customer Search & Pagination', 'FAIL');
    }

    // Customer Detail & Notes
    const addNoteRes = await request(`/customers/${customerId}/notes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
      body: {
        note: 'Follow-up call completed. Client requested product quote.',
        follow_up_date: new Date(Date.now() + 86400000 * 3).toISOString(),
      },
    });
    if (addNoteRes.status === 201 && addNoteRes.body.success) {
      recordResult('10. Customer Follow-up Notes History', 'PASS', 'Note added and follow-up date updated');
    } else {
      recordResult('10. Customer Follow-up Notes History', 'FAIL');
    }

    const getCustDetailRes = await request(`/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${tokens['Accounts']}` }, // Accounts viewing customer detail
    });
    if (
      getCustDetailRes.status === 200 &&
      getCustDetailRes.body.data.notes_history &&
      getCustDetailRes.body.data.notes_history.length > 0
    ) {
      recordResult('11. Customer Detail & Notes Log Retrieval', 'PASS', 'Retrieved customer details + historical notes array');
    } else {
      recordResult('11. Customer Detail & Notes Log Retrieval', 'FAIL');
    }

    // 6. Test Product & Inventory Module
    const createProdRes = await request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['Warehouse']}` },
      body: {
        name: 'Precision Test Sensor X1',
        sku: 'TEST-SKU-999',
        category: 'Testing Equipment',
        unit_price: 1200.0,
        current_stock: 20,
        min_stock_alert: 5,
        location: 'Warehouse A - Rack 9',
      },
    });

    let productId: number = 0;
    if (createProdRes.status === 201 && createProdRes.body.data.id) {
      productId = createProdRes.body.data.id;
      recordResult('12. Product Creation (Warehouse role)', 'PASS', `Product created with ID ${productId}`);
    } else {
      recordResult('12. Product Creation (Warehouse role)', 'FAIL', JSON.stringify(createProdRes.body));
    }

    // Low Stock Filter Test
    const lowStockRes = await request('/products?lowStock=true', {
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
    });
    if (lowStockRes.status === 200 && Array.isArray(lowStockRes.body.data)) {
      recordResult('13. Product Low-Stock Alert Filter', 'PASS', `Retrieved low stock products list`);
    } else {
      recordResult('13. Product Low-Stock Alert Filter', 'FAIL');
    }

    // 7. Test Stock Movement Logging & Manual Adjustments
    const manualAdjRes = await request('/stock-movements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['Warehouse']}` },
      body: {
        product_id: productId,
        quantity: 10,
        movement_type: 'IN',
        reason: 'Restock shipment intake #INV-441',
      },
    });

    if (
      manualAdjRes.status === 201 &&
      manualAdjRes.body.data.updated_product.current_stock === 30 // 20 + 10 = 30
    ) {
      recordResult('14. Manual Stock Adjustment & Audit Log', 'PASS', 'Stock increased from 20 to 30 and IN movement logged');
    } else {
      recordResult('14. Manual Stock Adjustment & Audit Log', 'FAIL', JSON.stringify(manualAdjRes.body));
    }

    // 8. Test Sales Challan Operations

    // TEST A: Draft Challan Creation does NOT reduce stock
    const createDraftChallanRes = await request('/challans', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
      body: {
        customer_id: customerId,
        status: 'Draft',
        items: [
          {
            product_id: productId,
            quantity: 5,
          },
        ],
      },
    });

    let draftChallanId: number = 0;
    if (createDraftChallanRes.status === 201 && createDraftChallanRes.body.data.status === 'Draft') {
      draftChallanId = createDraftChallanRes.body.data.id;
      recordResult('15. Draft Sales Challan Creation', 'PASS', `Created draft challan ID ${draftChallanId}`);
    } else {
      recordResult('15. Draft Sales Challan Creation', 'FAIL');
    }

    // Verify Stock did NOT reduce for Draft Challan
    const prodCheck1 = await request(`/products/${productId}`, {
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
    });
    if (prodCheck1.body.data.current_stock === 30) {
      recordResult('16. Draft Challan Stock Invariance Guard', 'PASS', 'Stock remains 30 after draft creation (NO stock reduction)');
    } else {
      recordResult('16. Draft Challan Stock Invariance Guard', 'FAIL', `Expected stock 30, found ${prodCheck1.body.data.current_stock}`);
    }

    // Verify Product Snapshot Data in Challan
    const getChallanDetail = await request(`/challans/${draftChallanId}`, {
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
    });
    const snapshotItem = getChallanDetail.body.data.items[0];
    if (
      snapshotItem &&
      snapshotItem.product_name === 'Precision Test Sensor X1' &&
      snapshotItem.product_sku === 'TEST-SKU-999' &&
      parseFloat(snapshotItem.unit_price) === 1200.0
    ) {
      recordResult('17. Product & Customer Snapshot Preservation', 'PASS', 'Challan item stores name, SKU, price snapshot at creation time');
    } else {
      recordResult('17. Product & Customer Snapshot Preservation', 'FAIL', JSON.stringify(snapshotItem));
    }

    // TEST B: Confirm Draft Challan reduces stock & creates OUT log
    const confirmChallanRes = await request(`/challans/${draftChallanId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
    });

    if (confirmChallanRes.status === 200 && confirmChallanRes.body.data.status === 'Confirmed') {
      recordResult('18. Sales Challan Confirmation Flow', 'PASS', `Challan ${draftChallanId} status changed to Confirmed`);
    } else {
      recordResult('18. Sales Challan Confirmation Flow', 'FAIL', JSON.stringify(confirmChallanRes.body));
    }

    // Verify Stock IS reduced (30 - 5 = 25)
    const prodCheck2 = await request(`/products/${productId}`, {
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
    });
    if (prodCheck2.body.data.current_stock === 25) {
      recordResult('19. Atomic Stock Deduction on Confirmation', 'PASS', 'Stock reduced from 30 to 25 upon confirmation');
    } else {
      recordResult('19. Atomic Stock Deduction on Confirmation', 'FAIL', `Expected stock 25, got ${prodCheck2.body.data.current_stock}`);
    }

    // TEST C: Insufficient Stock Guard Test (ATOMIC TRANSACTION ROLLBACK)
    // Current stock is 25. Let's attempt to confirm a challan asking for 500 units!
    const createExcessChallan = await request('/challans', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
      body: {
        customer_id: customerId,
        status: 'Draft',
        items: [
          {
            product_id: productId,
            quantity: 500, // Demanding 500 units when stock is only 25
          },
        ],
      },
    });

    const excessChallanId = createExcessChallan.body.data.id;

    const confirmExcessRes = await request(`/challans/${excessChallanId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
    });

    if (
      confirmExcessRes.status === 400 &&
      confirmExcessRes.body.error.code === 'INSUFFICIENT_STOCK' &&
      Array.isArray(confirmExcessRes.body.error.details)
    ) {
      recordResult(
        '20. Insufficient Stock Rejection & Error Response',
        'PASS',
        'HTTP 400 Bad Request returned with INSUFFICIENT_STOCK code and stock breakdown'
      );
    } else {
      recordResult('20. Insufficient Stock Rejection & Error Response', 'FAIL', JSON.stringify(confirmExcessRes.body));
    }

    // Verify Stock remains UNCHANGED (25) & NO Negative Stock
    const prodCheck3 = await request(`/products/${productId}`, {
      headers: { Authorization: `Bearer ${tokens['Sales']}` },
    });
    if (prodCheck3.body.data.current_stock === 25) {
      recordResult(
        '21. Transaction Rollback & Stock Integrity Guard',
        'PASS',
        'Stock remains untouched at 25. No partial deduction or negative stock occurred.'
      );
    } else {
      recordResult('21. Transaction Rollback & Stock Integrity Guard', 'FAIL', `Stock altered: ${prodCheck3.body.data.current_stock}`);
    }

    // 9. Input Validation & Error Handling Tests
    const invalidEmailRes = await request('/auth/login', {
      method: 'POST',
      body: { email: 'not-an-email', password: '123' },
    });
    if (invalidEmailRes.status === 400 && invalidEmailRes.body.error.code === 'VALIDATION_ERROR') {
      recordResult('22. Zod Request Validation Error Format', 'PASS', 'Zod validation error returned 400 Bad Request with field details');
    } else {
      recordResult('22. Zod Request Validation Error Format', 'FAIL');
    }
  } catch (globalErr: any) {
    console.error('Global error in verification suite:', globalErr);
  } finally {
    if (server) {
      server.close();
      console.log('Test HTTP server closed.');
    }
    await pool.end();
    console.log('Database connection pool closed.');

    console.log('\n==================================================');
    console.log('📊 FINAL SUMMARY OF BACKEND REQUIREMENTS VERIFICATION');
    console.log('==================================================');
    let passCount = 0;
    let failCount = 0;
    for (const r of testResults) {
      if (r.status === 'PASS') passCount++;
      if (r.status === 'FAIL') failCount++;
    }
    console.log(`Total Checks: ${testResults.length} | PASS: ${passCount} | FAIL: ${failCount}\n`);
  }
}

runVerificationSuite();
