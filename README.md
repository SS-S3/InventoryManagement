# 🤖 Robotics Lab Inventory Management System

A modern, full-stack inventory management system designed for college robotics labs. Built with React, TypeScript, Node.js, Express, and Turso (libSQL).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

---

## 📁 Project Structure

```
InventoryManagement/
├── .env.example          # Environment variables template
├── .gitignore
├── package.json          # Root workspace scripts
├── README.md
│
├── server/               # 🖥️ Express.js Backend (→ Render)
│   ├── .env.example
│   ├── package.json
│   ├── server.js         # Main server entry point
│   └── scripts/
│       ├── migrate.js    # Database migrations
│       └── seed.js       # Seed data
│
└── client/               # ⚛️ React + Vite Frontend (→ Vercel)
    ├── .env.example
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        └── app/
            ├── components/
            ├── stores/
            └── lib/
                └── api.ts  # API client with env config
```

---

## ✨ Features

### Core Functionality

- 🔐 **Authentication**: JWT-based login/registration with role-based access (Admin/Member)
- 📦 **Inventory Management**: Full CRUD for lab equipment with search and filtering
- 🗺️ **Lab Layout**: Interactive cabinet grid visualization
- 📊 **Transactions**: Track item issues and returns
- 📁 **Projects**: Manage projects and allocate resources
- 📅 **Borrowings**: Track borrowed items with return dates
- 🏆 **Competitions**: Manage events and equipment allocation
- 👥 **User Management**: Admin controls for user roles and verification
- 📰 **RSS Articles**: Auto-fetch robotics news (optional)

### Tech Highlights

- ⚡ **Vite** for blazing fast development
- 🎨 **TailwindCSS** with dark mode support
- 🔄 **Zustand** for state management
- 📱 **Fully Responsive** design
- 🧪 **Jest + Vitest** for testing

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18 or higher
- npm or yarn

### Local Development

1. **Clone & Install**

   ```bash
   git clone https://github.com/SS-S3/InventoryManagement.git
   cd InventoryManagement
   npm run install:all
   ```

2. **Configure Environment**

   ```bash
   # Copy environment templates
   cp .env.example .env
   cp server/.env.example server/.env
   cp client/.env.example client/.env.local
   ```

3. **Initialize Database**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start Development Servers**

   ```bash
   npm run dev
   ```

   - Server: `http://localhost:8080`
   - Client: `http://localhost:5173`

5. **Login**
   - Username: `admin`
   - Password: `admin123`

---

## 🌐 Deployment

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│   Render    │────▶│    Turso    │
│   (Client)  │     │   (Server)  │     │  (Database) │
└─────────────┘     └─────────────┘     └─────────────┘
   React App         Express API         libSQL (Turso)
```

### 1. Database - Turso

1. Create account at [turso.tech](https://turso.tech)
2. Create a new database
3. Copy your database URL and auth token

```bash
# Your credentials will look like:
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=eyJ...your-token
```

### 2. Backend - Render

1. Create a **Web Service** at [render.com](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=8080
   JWT_SECRET=<generate-strong-secret>
   TURSO_DATABASE_URL=<your-turso-url>
   TURSO_AUTH_TOKEN=<your-turso-token>
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```

### 3. Frontend - Vercel

1. Import project at [vercel.com](https://vercel.com)
2. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variables:
   ```
   VITE_API_BASE=https://your-app.onrender.com
   ```

---

## 📝 Environment Variables

### Root `.env`

```bash
# Database (Turso - Production)
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your_auth_token

# Server
PORT=8080
NODE_ENV=development
JWT_SECRET=your_jwt_secret

# Client
VITE_API_BASE=http://localhost:8080
```

### Server `.env`

```bash
PORT=8080
NODE_ENV=development
JWT_SECRET=your_jwt_secret
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your_auth_token_here
ALLOWED_ORIGINS=http://localhost:5173
```

### Client `.env.local`

```bash
VITE_API_BASE=http://localhost:8080
```

---

## 🛠️ Available Scripts

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Start both server and client in development mode |
| `npm run dev:server`  | Start only the server                            |
| `npm run dev:client`  | Start only the client                            |
| `npm run build`       | Build client for production                      |
| `npm run start`       | Start server in production mode                  |
| `npm run install:all` | Install all dependencies                         |
| `npm run db:migrate`  | Run database migrations                          |
| `npm run db:seed`     | Seed the database                                |
| `npm test`            | Run server tests                                 |

---

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT authentication (24h expiration)
- ✅ Role-based access control (Admin/Member)
- ✅ Rate limiting (100 req/15min in production)
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Input validation with express-validator
- ✅ SQL injection protection (parameterized queries)

---

## 📝 API Endpoints

### Authentication

| Method | Endpoint    | Description       |
| ------ | ----------- | ----------------- |
| POST   | `/register` | Register new user |
| POST   | `/login`    | User login        |
| GET    | `/health`   | Health check      |

### Inventory

| Method | Endpoint     | Description         |
| ------ | ------------ | ------------------- |
| GET    | `/items`     | Get all items       |
| POST   | `/items`     | Create item (Admin) |
| PUT    | `/items/:id` | Update item (Admin) |
| DELETE | `/items/:id` | Delete item (Admin) |

### Transactions & Borrowings

| Method | Endpoint                 | Description             |
| ------ | ------------------------ | ----------------------- |
| GET    | `/transactions`          | Get transaction history |
| POST   | `/issue`                 | Issue an item           |
| POST   | `/return`                | Return an item          |
| GET    | `/borrowings`            | Get borrowings          |
| POST   | `/borrowings`            | Borrow item             |
| PUT    | `/borrowings/:id/return` | Return borrowed item    |

### Projects & Allocations

| Method | Endpoint       | Description       |
| ------ | -------------- | ----------------- |
| GET    | `/projects`    | Get all projects  |
| POST   | `/projects`    | Create project    |
| GET    | `/allocations` | Get allocations   |
| POST   | `/allocations` | Create allocation |

---

## 🎨 Design System

### Colors

- **Primary**: Purple (`hsl(250, 95%, 65%)`)
- **Accent**: Magenta (`hsl(280, 85%, 60%)`)
- **Success**: Green (`hsl(142, 76%, 45%)`)
- **Warning**: Orange (`hsl(38, 92%, 50%)`)
- **Destructive**: Red (`hsl(0, 85%, 60%)`)

### Typography

- Font: Inter (Google Fonts)

---

## 🧪 Testing

```bash
# Server tests
cd server && npm test

# Client tests
cd client && npm test
```

---

## 🎯 Roadmap

- [x] Migrate from SQLite to Turso in production
- [ ] Email notifications for overdue items
- [ ] Export data to CSV/Excel
- [ ] QR code generation for items
- [ ] Mobile app (React Native)
- [ ] Real-time updates (WebSockets)
- [ ] Image upload for items
- [ ] Multi-lab support
- [ ] Audit logs dashboard

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Developer Notes

- Default admin: `admin` / `admin123`
- Database auto-initializes on first run
- All API endpoints (except auth) require JWT token
- Tailwind `@apply` warnings are expected (processed at build time)

---

**Built with ❤️ for Robotics Labs**
