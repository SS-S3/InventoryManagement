# 🤖 Robotics Lab Inventory Management System

A modern, full-stack inventory management system designed for college robotics labs. Built with React, Node.js, Express, and SQLite.

## ✨ Features

### Core Functionality
- **🔐 Authentication**: Secure login/registration with JWT tokens and role-based access (Admin/User)
- **📦 Inventory Management**: Full CRUD operations for lab equipment with search and filtering
- **🗺️ Lab Layout**: Interactive 5x5 cabinet grid visualization showing item locations
- **📊 Transactions**: Track item issues and returns with complete history
- **📁 Projects**: Manage lab projects and allocate resources
- **🔄 Allocations**: Assign inventory items to specific projects
- **📅 Borrowings**: Track borrowed items with expected return dates
- **🏆 Competitions**: Manage competition events and required equipment

### UI/UX Highlights
- **🎨 Modern Dark Theme**: Vibrant purple-blue gradient design with glassmorphism effects
- **✨ Smooth Animations**: Fade-in effects, hover lifts, and micro-interactions
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **🔍 Search & Filter**: Quick item lookup across inventory
- **🎯 Visual Indicators**: Color-coded quantity badges (low stock warnings)
- **⚡ Real-time Updates**: Instant UI updates after operations

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd InventoryManagement
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server** (Terminal 1)
   ```bash
   cd backend
   node server.js
   ```
   Server runs on `http://localhost:3000`

2. **Start the Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:5173` (or next available port)

3. **Access the Application**
   - Open your browser to `http://localhost:5173`
   - Default admin credentials:
     - Username: `admin`
     - Password: `admin123`

## 📁 Project Structure

```
InventoryManagement/
├── backend/
│   ├── server.js          # Express server with API routes
│   ├── inventory.db       # SQLite database
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── InventoryList.jsx
│   │   │   ├── LabLayout.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Allocations.jsx
│   │   │   ├── Borrowings.jsx
│   │   │   ├── Competitions.jsx
│   │   │   └── ui/        # Reusable UI components
│   │   ├── index.css      # Global styles & design system
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

## 🎨 Design System

### Color Palette
- **Primary**: Vibrant purple (`hsl(250, 95%, 65%)`)
- **Accent**: Magenta (`hsl(280, 85%, 60%)`)
- **Success**: Green (`hsl(142, 76%, 45%)`)
- **Warning**: Orange (`hsl(38, 92%, 50%)`)
- **Destructive**: Red (`hsl(0, 85%, 60%)`)

### Typography
- Font Family: Inter (Google Fonts)
- Modern, clean, and highly readable

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth with 24h expiration
- **Role-Based Access**: Admin-only features (inventory management)
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries

## 🛠️ Technology Stack

### Frontend
- **React 19**: Modern UI library
- **Vite**: Fast build tool and dev server
- **TailwindCSS 4**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **Axios**: HTTP client
- **React Router**: Client-side routing

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **SQLite3**: Lightweight database
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **CORS**: Cross-origin resource sharing

## 📝 API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - User login

### Inventory
- `GET /items` - Get all items
- `POST /items` - Create new item (Admin only)
- `PUT /items/:id` - Update item (Admin only)
- `DELETE /items/:id` - Delete item (Admin only)

### Transactions
- `GET /transactions` - Get transaction history
- `POST /issue` - Issue an item
- `POST /return` - Return an item

### Projects
- `GET /projects` - Get all projects
- `POST /projects` - Create new project

### Allocations
- `GET /allocations` - Get all allocations
- `POST /allocations` - Create allocation
- `DELETE /allocations/:id` - Remove allocation

### Borrowings
- `GET /borrowings` - Get all borrowings
- `POST /borrowings` - Borrow an item
- `PUT /borrowings/:id/return` - Return borrowed item

### Competitions
- `GET /competitions` - Get all competitions
- `POST /competitions` - Create competition
- `GET /competitions/:id/items` - Get competition items
- `POST /competitions/:id/items` - Add item to competition

## 🎯 Future Enhancements

- [ ] Email notifications for overdue borrowings
- [ ] Export data to CSV/Excel
- [ ] Advanced analytics and reports
- [ ] QR code generation for items
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration (WebSockets)
- [ ] Image upload for items
- [ ] Barcode scanning
- [ ] Multi-lab support
- [ ] Audit logs

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Developer Notes

- The CSS lint warnings about `@tailwind` and `@apply` are expected - these are Tailwind directives processed at build time
- Default admin user is created automatically on first run
- Database is automatically initialized with required tables
- All API endpoints require authentication except `/register` and `/login`

---

**Built with ❤️ for Robotics Labs**