# Mini ERP + CRM Operations Portal

A comprehensive full-stack ERP/CRM application designed for wholesale and distribution businesses. This system centralizes customer management, product inventory, stock tracking, and sales operations through an intuitive web interface.

**Case Study Project:** Fundsroom Full Stack Developer Case Study

> ⚠️ **Note:** The backend is hosted on Render's free tier. The first request after a period of inactivity may take 30–60 seconds to respond.

## 🔗 Quick Links

| Resource | URL |
|----------|-----|
| Live Application | https://mini-erp-crm-steel.vercel.app |
| Backend API | https://corevia-backend-pq6q.onrender.com |
| GitHub Repository | https://github.com/ankur-070/Mini-ERP-CRM |

---

## 📋 Overview

This ERP/CRM platform consolidates critical business operations into a single, role-based application. It enables coordination across sales, warehouse, and accounting teams through a modern web interface backed by a REST API.

**Core capabilities:**
- **Customer Management** — Create, update, and track customer details with GST and business information
- **Product Management** — Maintain product catalog with SKU, pricing, and stock levels
- **Inventory Management** — Monitor current stock and minimum stock thresholds across warehouses
- **Stock Movements** — Record and track stock IN/OUT transactions with movement history
- **Sales Challans** — Generate and manage sales documents linked to inventory
- **Access Control** — Role-based permissions for Admin, Sales, Warehouse, and Accounts roles

---

## ✨ Key Features

### Authentication & Authorization
- JWT-based token authentication
- Protected routes with middleware validation
- Role-based access control (RBAC)
- Role-specific feature availability

### Customer Management
- Create and maintain customer records
- Search and filter customers by status or type
- Track business and GST information
- Maintain follow-up records

### Product Management
- Create and catalog products with SKU and category
- Set unit pricing and cost tracking
- Monitor current and minimum stock levels
- Assign warehouse/location information

### Inventory & Stock Movements
- Record stock IN/OUT movements with quantity and reason
- View complete movement history
- Backend API-driven inventory updates

### Sales Challans
- Generate customer-specific sales documents
- Select products and specify quantities
- Manage challan status and lifecycle
- Automatic inventory integration

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React |
| **Backend** | Node.js, TypeScript, Express.js |
| **Database** | PostgreSQL |
| **API** | REST |
| **Authentication** | JWT (JSON Web Tokens) |
| **Authorization** | Role-Based Access Control |
| **Testing** | Postman |
| **Frontend Deployment** | Vercel |
| **Backend Deployment** | Render |

---

## 🏗️ Architecture

The application follows a layered backend architecture that separates concerns and keeps the codebase maintainable.

```
User Request
    ↓
React Frontend
    ↓
REST API
    ↓
Route Handler
    ↓
Controller Layer
    ↓
Service / Business Logic
    ↓
Database (PostgreSQL)
    ↓
API Response
    ↓
Frontend UI Update
```

**Backend Layers:**
- **Routes** — API endpoint definitions and HTTP method mappings
- **Controllers** — Request handling and response formatting
- **Services** — Business logic and data processing
- **Database** — PostgreSQL queries and data persistence

---

## 👥 Roles & Permissions

| Role | Responsibilities |
|------|------------------|
| **Admin** | Full system access and administrative operations |
| **Sales** | Customer management and sales operations |
| **Warehouse** | Product, inventory, and stock movement management |
| **Accounts** | Business and accounting-related operations |

---

## 🌐 REST API Endpoints

All endpoints require JWT authentication except login.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login and token generation |
| GET | `/api/v1/customers` | Retrieve all customers |
| POST | `/api/v1/customers` | Create new customer |
| GET | `/api/v1/products` | Retrieve all products |
| POST | `/api/v1/products` | Create new product |
| GET | `/api/v1/stock-movements` | Retrieve movement history |
| POST | `/api/v1/stock-movements` | Record stock movement |
| GET | `/api/v1/challans` | Retrieve all challans |
| POST | `/api/v1/challans` | Create new challan |

A Postman collection (`postman_collection.json`) is included in the repository. Run the authentication request first to get a token, then use it for the remaining endpoints.

---

## 📁 Project Structure

```
Mini-ERP-CRM/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── middleware/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   └── package.json
│
├── postman_collection.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm
- PostgreSQL
- Git

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/ankur-070/Mini-ERP-CRM.git
cd Mini-ERP-CRM
```

**2. Backend setup**
```bash
cd backend
npm install
```

Configure environment variables in `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/mini_erp
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

```bash
npm run build
npm start
```

**3. Frontend setup**
```bash
cd frontend
npm install
```

Configure environment variables in `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api/v1
```

```bash
npm start
```

The application will be available at `http://localhost:3000`.

---

## 🔐 Authentication

- User logs in via `POST /api/v1/auth/login`
- A JWT token is returned and stored on the frontend
- The token is sent in the `Authorization` header for all protected requests
- Backend middleware validates the token and applies role-based authorization on each request

---

## ☁️ Deployment

| | Frontend | Backend |
|---|---|---|
| **Platform** | Vercel | Render |
| **URL** | https://mini-erp-crm-steel.vercel.app | https://corevia-backend-pq6q.onrender.com |

---

## ⚠️ Known Limitations

This project was developed within the scope and timeline of the Fundsroom Full Stack Developer case study. The implementation covers the core ERP/CRM workflows required for the assignment. Some areas that could be extended for a production environment:

- Advanced reporting and analytics dashboard
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