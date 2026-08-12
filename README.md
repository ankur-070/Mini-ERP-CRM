# Mini ERP + CRM Operations Portal

A full-stack ERP/CRM application developed for the **Fundsroom Full Stack Developer Case Study**. Designed for wholesale and distribution businesses to manage customers, products, inventory, stock movements, and sales challans from a single platform.

> ⚠️ **Note:** The backend is hosted on Render's free tier. The first request after a period of inactivity may take 30–60 seconds to respond.

## 🔗 Links

| Resource | URL |
|----------|-----|
| Live Application | https://mini-erp-crm-steel.vercel.app |
| Backend API | https://corevia-backend-pq6q.onrender.com |
| GitHub Repository | https://github.com/ankur-070/Mini-ERP-CRM |

---

## 📋 Overview

This platform consolidates the core operations of a wholesale/distribution business into a single role-based application. The frontend communicates with the backend through REST APIs, while the backend handles authentication, authorization, business logic, validation, and database operations.

**Modules covered:**
- Customer management
- Product management
- Inventory management
- Stock movement tracking
- Sales challan management
- JWT authentication
- Role-based access control

---

## ✨ Key Features

### Authentication
- User login with JWT-based authentication
- Protected API routes and authenticated frontend sessions
- Unauthorized users are redirected to the login page

### Role-Based Access Control
Four roles with access scoped to relevant functionality:

| Role | Responsibilities |
|------|-----------------|
| **Admin** | Overall system administration and access |
| **Sales** | Customer and sales-related operations |
| **Warehouse** | Product, inventory, and stock operations |
| **Accounts** | Account and business operations |

Role-based authorization is enforced on the backend. The frontend also provides role-aware navigation.

### Customer Management
- Create, list, view, and update customers
- Search by name, status, or type
- Manage customer type, business info, GST details, and follow-up records

### Product Management
- Create, list, view, and update products
- SKU and category management
- Unit price, current stock, and minimum stock tracking
- Warehouse/location assignment

### Inventory & Stock Movements
- Track current stock per product
- Record stock IN/OUT with quantity and reason
- View complete movement history

### Sales Challan Management
- Create challans with customer and product selection
- Manage challan status through its lifecycle
- Integrated with product and inventory data

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React |
| **Backend** | Node.js, TypeScript, Express.js |
| **Database** | PostgreSQL |
| **API** | REST |
| **Authentication** | JWT |
| **Authorization** | Role-Based Access Control |
| **API Testing** | Postman |
| **Frontend Deployment** | Vercel |
| **Backend Deployment** | Render |

---

## 🏗️ Architecture

The application follows a layered backend architecture where each layer has a single responsibility.

```
React Frontend
      ↓  REST API
    Routes          → Define API endpoints
      ↓
  Controllers       → Handle requests and responses
      ↓
   Services         → Business logic and validation
      ↓
  PostgreSQL        → Data persistence
```

### Request Flow

```
User → React Frontend → REST API → Route → Controller → Service → Database → Response → Frontend
```

### Core Business Flow

```
Login → Customer Management → Product Management → Inventory Management → Stock Movements → Sales Challan
```

Each module builds on the previous, representing an actual business workflow rather than isolated CRUD screens.

---

## 🌐 REST API Endpoints

All endpoints except login require a valid JWT token in the `Authorization` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login and token generation |
| GET | `/api/v1/customers` | List all customers |
| POST | `/api/v1/customers` | Create a customer |
| GET | `/api/v1/products` | List all products |
| POST | `/api/v1/products` | Create a product |
| GET | `/api/v1/stock-movements` | List stock movements |
| POST | `/api/v1/stock-movements` | Record a stock movement |
| GET | `/api/v1/challans` | List all challans |
| POST | `/api/v1/challans` | Create a challan |

A Postman collection (`postman_collection.json`) is included in the repository. Run the login request first to obtain a token, then use it for all subsequent requests.

---

## 📁 Project Structure

```
Mini-ERP-CRM/
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── ...
├── frontend/
│   ├── components/
│   ├── pages/
│   └── ...
├── postman_collection.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js
- npm
- PostgreSQL

### Setup

**1. Clone the repository**
```bash
git clone https://github.com/ankur-070/Mini-ERP-CRM.git
cd Mini-ERP-CRM
```

**2. Backend**
```bash
cd backend
npm install
# Configure environment variables and database connection
npm run build
npm start
```

**3. Frontend**
```bash
cd frontend
npm install
# Configure backend API URL in environment config
npm start
```

### Local Ports

| Service | Port |
|---------|------|
| Frontend | `5173` |
| Backend API | `5000` |
| PostgreSQL | `5432` |

---

## 🔐 Authentication Flow

```
Login Form → POST /api/v1/auth/login → Credential Validation
          → JWT Generated → Stored on Frontend
          → Sent in Authorization header for protected requests
          → Backend validates JWT → Role-based authorization applied
```

---

## 📦 Inventory & Stock Flow

```
Product → Current Stock
               ↓
        Stock IN / Stock OUT
               ↓
        Stock Movement recorded (product, quantity, type, reason)
               ↓
        Inventory Updated
```

---

## 🧾 Sales Challan Flow

```
Select Customer → Select Product → Enter Quantity
              → Create Challan → Process Challan → Inventory Operation
```

---

## ☁️ Deployment

| | Frontend | Backend |
|---|---|---|
| **Platform** | Vercel | Render |
| **URL** | https://mini-erp-crm-steel.vercel.app | https://corevia-backend-pq6q.onrender.com |

---

## ⚠️ Known Limitations

This project was developed within the scope and timeline of the case study. The implementation focuses on the core ERP/CRM workflows required for the assignment. Additional functionality and production-level hardening can be added as the system evolves:

- Advanced reporting and analytics
- Batch import/export for customers and products
- Real-time notifications for low stock or challan updates
- API rate limiting and response caching
- Audit logging for sensitive operations

---

## 👨‍💻 Author

**Ankur Singh**
B.E. Computer Science and Design
Dayananda Sagar College of Engineering (2023–2027)

- GitHub: [ankur-070](https://github.com/ankur-070)
- LinkedIn: [ankursingh070](https://linkedin.com/in/ankursingh070)