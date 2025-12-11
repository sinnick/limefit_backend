# LimeFit - Gym Management System

A modern, full-stack gym management application built with Next.js 15, featuring admin dashboards, user management, workout routines, and assignment tracking.

## ✨ Features

### Admin Features
- 👥 **User Management**: Create, edit, and manage gym members
- 💪 **Routine Management**: Create and manage workout routines with difficulty levels
- 📋 **Assignment System**: Assign routines to users and track their progress
- 📊 **Dashboard**: Overview of system statistics and quick actions
- 🔐 **Authentication**: Secure login with admin role-based access

### Technical Stack
- **Framework**: Next.js 15.1.3
- **UI Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with lime green accent theme (#84cc16)
- **Authentication**: NextAuth.js with credentials provider
- **Database**: MongoDB with Mongoose ODM
- **State Management**: React hooks
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance running locally or remotely
- npm or yarn package manager

### Installation

1. Clone the repository and install dependencies:
```bash
cd limefit_backend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
MONGODB_URI=mongodb://localhost:27017/limefit
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-secret-key>
```

Generate a secret key:
```bash
openssl rand -base64 32
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 👤 Creating an Admin User

You'll need to manually create an admin user in your MongoDB database with a hashed password.

Using MongoDB shell or a script:
```javascript
const bcrypt = require('bcryptjs');

db.usuarios.insertOne({
  DNI: 12345678,
  USUARIO: "admin",
  PASSWORD: bcrypt.hashSync("admin123", 10),
  NOMBRE: "Admin",
  APELLIDO: "User",
  EMAIL: "admin@limefit.com",
  SEXO: "M",
  ADMIN: true,
  HABILITADO: true,
  FECHA_CREACION: new Date(),
  FOTO: ""
})
```

Then login with:
- **Username**: admin (or DNI: 12345678)
- **Password**: admin123

## 📁 Project Structure

```
├── components/
│   ├── admin/         # Admin-specific components
│   └── ui/            # shadcn/ui components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── models/            # Mongoose models
│   ├── Usuario.js
│   ├── Rutina.js
│   ├── Record.js
│   └── UsuarioRutina.js
├── pages/
│   ├── admin/         # Admin pages
│   │   ├── index.jsx  # Dashboard
│   │   ├── users.jsx  # User management
│   │   ├── routines.jsx  # Routine management
│   │   └── assignments.jsx  # Assignment management
│   ├── api/           # API routes
│   │   ├── auth/      # NextAuth
│   │   └── admin/     # Admin APIs
│   ├── login.jsx      # Login page
│   └── index.js       # Home redirect
├── styles/            # Global styles
└── utils/             # Utility modules
```

## 🔌 API Routes

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth authentication endpoints

### Admin Routes (Require admin authentication)
- `GET/POST/PUT/DELETE /api/admin/users` - User management
- `GET/POST/PUT/DELETE /api/admin/routines` - Routine management
- `GET/POST/PUT/DELETE /api/admin/assignments` - Assignment management

### Legacy Routes
- `POST /api/login` - Legacy login endpoint
- `GET /api/rutinas` - Get routines
- `GET /api/records/list` - List user records

## 🎨 Customization

### Theme Colors
The lime green theme is defined in:
- `tailwind.config.js` - Tailwind color palette
- `styles/globals.css` - CSS variables for light and dark modes

Primary lime green color: **#84cc16** (HSL: 84 81% 44%)

### UI Components
All UI components are in `components/ui/` and can be customized as needed.

## 🛠️ Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔒 Security

- Passwords are hashed using bcryptjs
- Admin routes protected with NextAuth middleware
- JWT sessions with configurable expiry
- Environment variables for sensitive data

## 📝 License

Private - All rights reserved
