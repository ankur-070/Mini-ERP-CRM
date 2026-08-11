-- Drop existing tables & types if executing fresh schema migration
DROP TABLE IF EXISTS sales_challan_items CASCADE;
DROP TABLE IF EXISTS sales_challans CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customer_notes CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS customer_type CASCADE;
DROP TYPE IF EXISTS customer_status CASCADE;
DROP TYPE IF EXISTS challan_status CASCADE;
DROP TYPE IF EXISTS movement_type CASCADE;

-- Enums
CREATE TYPE user_role AS ENUM ('Admin', 'Sales', 'Warehouse', 'Accounts');
CREATE TYPE customer_type AS ENUM ('Retail', 'Wholesale', 'Distributor');
CREATE TYPE customer_status AS ENUM ('Lead', 'Active', 'Inactive');
CREATE TYPE challan_status AS ENUM ('Draft', 'Confirmed', 'Cancelled');
CREATE TYPE movement_type AS ENUM ('IN', 'OUT');

-- 1. Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'Sales',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers Table
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL,
  business_name VARCHAR(150) NOT NULL,
  gst_number VARCHAR(20),
  customer_type customer_type NOT NULL DEFAULT 'Retail',
  address TEXT NOT NULL,
  status customer_status NOT NULL DEFAULT 'Lead',
  follow_up_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_search ON customers (name, business_name, mobile_number, email);
CREATE INDEX idx_customers_status ON customers (status);
CREATE INDEX idx_customers_type ON customers (customer_type);

-- 3. Customer Notes / Follow-up History Table
CREATE TABLE customer_notes (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  current_stock INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  min_stock_alert INT NOT NULL DEFAULT 0 CHECK (min_stock_alert >= 0),
  location VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_sku ON products (sku);
CREATE INDEX idx_products_category ON products (category);

-- 5. Stock Movements Log Table
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  movement_type movement_type NOT NULL,
  reason VARCHAR(255) NOT NULL,
  challan_id INT,
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_product ON stock_movements (product_id);

-- 6. Sales Challans Table
CREATE TABLE sales_challans (
  id SERIAL PRIMARY KEY,
  challan_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT NOT NULL REFERENCES customers(id),
  customer_snapshot JSONB NOT NULL,
  total_quantity INT NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status challan_status NOT NULL DEFAULT 'Draft',
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_challans_number ON sales_challans (challan_number);
CREATE INDEX idx_challans_customer ON sales_challans (customer_id);
CREATE INDEX idx_challans_status ON sales_challans (status);

-- 7. Sales Challan Items Table (Product Snapshot Data)
CREATE TABLE sales_challan_items (
  id SERIAL PRIMARY KEY,
  challan_id INT NOT NULL REFERENCES sales_challans(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  product_name VARCHAR(150) NOT NULL,
  product_sku VARCHAR(50) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(12, 2) NOT NULL
);
