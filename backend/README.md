# Fundsroom ERP/CRM - Backend API

Production-ready Node.js, TypeScript, Express, and PostgreSQL backend for the Fundsroom ERP/CRM system.

## Features & Modules

1. **Authentication & Role-Based Access Control (RBAC)**:
   - Roles: `Admin`, `Sales`, `Warehouse`, `Accounts`.
   - JWT-based stateless authentication with password hashing (`bcryptjs`).
2. **Customer CRM Module**:
   - Customer management (Retail, Wholesale, Distributor types).
   - Status tracking (`Lead`, `Active`, `Inactive`).
   - Follow-up date scheduling and notes audit log.
   - Dynamic search, status/type filters, and pagination.
3. **Product & Inventory Module**:
   - Product tracking with SKU, category, unit price, stock, minimum stock alert limit, and warehouse location.
   - Low stock alert flagging (`current_stock <= min_stock_alert`).
   - Audit log of stock movements (`IN` / `OUT`).
   - Manual stock intake/adjustment endpoints.
4. **Sales Challan & Atomic Inventory Logic**:
   - Challan creation as `Draft` or `Confirmed`.
   - Automatic, unique challan number generation (`CH-YYYYMMDD-0001`).
   - Customer and Product **Snapshot Data** preserved at the time of creation.
   - **Atomic Stock Reduction**: Confirmation runs within PostgreSQL transaction (`BEGIN`, `FOR UPDATE`, stock availability check, stock reduction, movement log creation, `COMMIT`).
   - If stock is insufficient for ANY product, the operation is rejected immediately (`400 Bad Request`), and stock is untouched.

---

## Technical Stack
- **Node.js** (v18+)
- **TypeScript** (v5+)
- **Express.js** (v4)
- **PostgreSQL** (with `pg` connection pool)
- **Zod** (Request validation)
- **JWT & Bcrypt** (Security)

---

## Project Structure
```
fundsroom-erp/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Environment configuration
│   │   ├── controllers/     # Express route handlers
│   │   ├── db/              # SQL schema, migration & seed scripts
│   │   ├── middleware/      # Auth, Role, Validation & Error middlewares
│   │   ├── routes/          # REST API route endpoints
│   │   ├── services/        # Core business logic & database transactions
│   │   ├── utils/           # Helper functions & standard response wrappers
│   │   ├── validators/      # Zod validation schemas
│   │   ├── app.ts           # Express application setup
│   │   └── server.ts        # Server entrypoint
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
```

---

## Environment Variables

Copy `.env.example` to `.env` in the `backend` folder:

```env
PORT=5000
NODE_ENV=development

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fundsroom_erp
DB_USER=postgres
DB_PASSWORD=postgres
# Or full connection string (e.g. Neon / Supabase):
# DATABASE_URL=postgresql://user:pass@ep-host.neon.tech/fundsroom_erp?sslmode=require

# Auth
JWT_SECRET=super_secret_jwt_key_fundsroom_erp_2026
JWT_EXPIRES_IN=1d

# CORS
CORS_ORIGIN=*
```

---

## Setup & Running Locally

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Database Migration & Seeding
Ensure PostgreSQL is running locally or provide a Neon/Supabase `DATABASE_URL` in `.env`.

Run migrations to create tables, indexes, and enums:
```bash
npm run db:migrate
```

Run seed to populate default users, initial products, and customers:
```bash
npm run db:seed
```

### 3. Start Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

---

## Pre-seeded Credentials for Testing

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@fundsroom.com` | `Password123!` |
| **Sales** | `sales@fundsroom.com` | `Password123!` |
| **Warehouse** | `warehouse@fundsroom.com` | `Password123!` |
| **Accounts** | `accounts@fundsroom.com` | `Password123!` |

---

## REST API Specification

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login` - Public login endpoint.
- `POST /api/v1/auth/register` - Register user (Admin only).
- `GET /api/v1/auth/me` - Authenticated user profile.

### Customers (`/api/v1/customers`)
- `POST /api/v1/customers` - Create customer (`Admin`, `Sales`).
- `GET /api/v1/customers` - Search/list customers with pagination (`Admin`, `Sales`, `Accounts`).
- `GET /api/v1/customers/:id` - View customer detail + follow-up notes history (`Admin`, `Sales`, `Accounts`).
- `PUT /api/v1/customers/:id` - Edit customer details (`Admin`, `Sales`).
- `POST /api/v1/customers/:id/notes` - Add follow-up note (`Admin`, `Sales`).

### Products (`/api/v1/products`)
- `POST /api/v1/products` - Create product (`Admin`, `Warehouse`).
- `GET /api/v1/products` - List products with low-stock filter (`Admin`, `Sales`, `Warehouse`, `Accounts`).
- `GET /api/v1/products/:id` - View single product details (`Admin`, `Sales`, `Warehouse`, `Accounts`).
- `PUT /api/v1/products/:id` - Update product details (`Admin`, `Warehouse`).

### Stock Movements (`/api/v1/stock-movements`)
- `GET /api/v1/stock-movements` - View audit log of movements (`Admin`, `Warehouse`, `Accounts`).
- `POST /api/v1/stock-movements` - Manual stock adjustment (`Admin`, `Warehouse`).

### Sales Challans (`/api/v1/challans`)
- `POST /api/v1/challans` - Create challan as `Draft` or `Confirmed` (`Admin`, `Sales`).
- `GET /api/v1/challans` - List sales challans (`Admin`, `Sales`, `Warehouse`, `Accounts`).
- `GET /api/v1/challans/:id` - View sales challan detail (`Admin`, `Sales`, `Warehouse`, `Accounts`).
- `POST /api/v1/challans/:id/confirm` - Trigger atomic confirmation flow (`Admin`, `Sales`).
- `POST /api/v1/challans/:id/cancel` - Cancel sales challan (`Admin`, `Sales`).

---

## End-to-End Postman Business Flow Test

1. **Login as Sales**:
   - `POST /api/v1/auth/login` with `{"email": "sales@fundsroom.com", "password": "Password123!"}`
   - Save the returned `token`. Set Authorization header `Bearer <token>` for subsequent requests.
2. **Create Customer**:
   - `POST /api/v1/customers`
3. **List Products**:
   - `GET /api/v1/products` to note available stock and product IDs.
4. **Create Draft Sales Challan**:
   - `POST /api/v1/challans` with `status: "Draft"`.
   - Observe stock is **NOT** reduced.
5. **Confirm Sales Challan**:
   - `POST /api/v1/challans/:id/confirm`
   - Observe:
     - Challan status changes to `Confirmed`.
     - Stock of each product decreases by quantity.
     - `OUT` stock movement records created automatically.
6. **Test Insufficient Stock Guard**:
   - Attempt to create/confirm a challan requesting more quantity than current stock.
   - Observe:
     - HTTP `400 Bad Request` with `code: "INSUFFICIENT_STOCK"`.
     - Stock remains untouched.

---

## Free Cloud Deployment (Render / Railway / Neon)

1. **Database**: Create a free PostgreSQL instance on [Neon](https://neon.tech) or Supabase. Obtain the connection string (`DATABASE_URL`).
2. **Backend Service**: Deploy this repository on Render or Railway:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Pre-deploy Command (optional): `npm run db:migrate && npm run db:seed`
3. Set environment variables on Render/Railway dashboard (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`).
