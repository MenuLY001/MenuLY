<div align="center">
  <br />
  <h1>🍽️ MenuLY</h1>
  <p><strong>A beautifully designed, multi-tenant QR-code menu platform for modern restaurants.</strong></p>
  <br />

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express" alt="Express" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turborepo" />
  </p>
</div>

<hr />

## 🌟 Overview

**MenuLY** is a high-performance, multi-tenant digital menu platform built for the modern dining experience. It allows restaurants to easily register, build their digital menus, upload item images, and instantly generate QR codes for tables. 

Customers scan the QR code to access a lightning-fast, beautifully designed, mobile-first menu where they can browse items, build an order cart, and display it directly to the waiter.

## ✨ Key Features

- **📱 Mobile-First Customer Experience**: Smooth, native-like interface with tactile scroll-snapping, floating bottom carts, and interactive list/grid layouts.
- **🎨 Dynamic Theming**: Customers can instantly toggle between a premium Dark Mode and a crisp Light Mode.
- **🛒 Intelligent Cart & Ordering**: Customers can build their orders at the table and generate a high-contrast, full-screen "Waiter Display" to seamlessly place their order.
- **🔐 Multi-Tenant Architecture**: Built from the ground up to support hundreds of unique restaurants concurrently, completely isolated from one another.
- **🛡️ Secure Admin Dashboard**: Real-time CRUD operations for menu categories, items, and restaurant profiles protected by JWT authentication.
- **☁️ Supabase Storage Integration**: Direct, secure image uploads for gorgeous menu photography.
- **🔒 Hidden Registration**: A fully locked-down registration flow accessible only via a configurable cryptographically secure secret URL.

---

## 🛠️ Technology Stack

This project is structured as a powerful **Monorepo** using [Turborepo](https://turbo.build/repo) for blazing-fast local development and builds.

- **Frontend**: React, Vite, Custom CSS (No external bloat)
- **Backend API**: Node.js, Express.js
- **Database & Auth**: Supabase (PostgreSQL, Auth, Storage)
- **Tooling**: TypeScript, Turborepo, NPM Workspaces

---

## 🚀 Local Development

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Supabase](https://supabase.com/) account and project.

### 2. Environment Setup
Create a `.env` file in `apps/api/` and `apps/web/`:

**`apps/api/.env`**
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PLATFORM_REGISTRATION_KEY=generate_a_random_32_char_string
FRONTEND_URL=http://localhost:5173
```

**`apps/web/.env`**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
API_URL=/api
```

### 3. Install & Run
Run everything concurrently with a single command from the root directory:

```bash
npm install
npm run dev
```

* The Frontend will run on `http://localhost:5173`
* The Backend API will run on `http://localhost:3001`

---

## 📦 Deployment Strategy

Because of the monorepo structure and the Node.js Express backend (handling file uploads), we recommend a split deployment strategy for the best performance.

### Frontend ➡️ Vercel
1. Import the repository into Vercel.
2. Set the Root Directory to `apps/web`.
3. Add your Environment Variables (ensure `API_URL` points to your deployed backend, e.g., `https://api.yourdomain.com/api`).
4. Vercel handles the Vite build automatically.

### Backend ➡️ Railway (or Render)
1. Import the repository into Railway.
2. Railway will automatically detect the custom `Dockerfile` in the root of the repository, which intelligently builds only the backend and shared types.
3. Add your backend `.env` variables to Railway.
4. Railway will automatically expose the Express server.

---

<div align="center">
  <i>Designed & Built with ❤️ for better dining experiences.</i>
</div>
