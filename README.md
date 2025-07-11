# MoneyMind: Personal Finance Tracker & Budgeting Web App

A full-stack personal finance management application designed to help individuals take control of their income, expenses, and budgeting goals.

## 🚀 Features

- **User Authentication** - Secure signup and login with session handling
- **Income & Expense Tracking** - Add, view, edit, and delete financial transactions
- **Budget Management** - Set monthly budgets and track spending progress
- **Data Visualization** - Interactive charts showing spending patterns
- **Responsive Design** - Mobile-first design with Tailwind CSS

## 🛠️ Technology Stack

### Frontend
- React + Vite
- TypeScript
- Tailwind CSS
- Chart.js/Recharts

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Passport.js (Authentication)

### Development Tools
- Git & GitHub
- Nodemon
- Postman (API testing)

## 📁 Project Structure

```
MoneyMind/
├── frontend/          # React + Vite frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Node.js + Express backend
│   ├── models/        # MongoDB models
│   ├── routes/        # API routes
│   ├── middleware/    # Custom middleware
│   ├── config/        # Configuration files
│   └── server.js      # Main server file
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MoneyMind
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure your environment variables
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Configure Environment Variables**
   - Update `backend/.env` with your MongoDB connection string
   - Set a secure session secret

### Development

- Backend runs on: `http://localhost:5000`
- Frontend runs on: `http://localhost:5173`

## 📋 Development Roadmap

### ✅ Sprint 1: Project Setup & Authentication
- [x] Initialize project structure
- [ ] Setup backend foundation
- [ ] Configure MongoDB connection
- [ ] Implement user authentication
- [ ] Build authentication frontend
- [ ] Test authentication system

### 🔄 Sprint 2: Income/Expense CRUD System
- [ ] Design transaction models
- [ ] Implement CRUD API endpoints
- [ ] Build transaction forms
- [ ] Add transaction list display

### 📊 Sprint 3: Budget Management & Dashboard
- [ ] Add budget functionality
- [ ] Implement spending progress
- [ ] Integrate data visualization
- [ ] Create dashboard interface

### 🎨 Sprint 4: UI/UX Polish & Testing
- [ ] Responsive design improvements
- [ ] Performance optimization
- [ ] Error handling
- [ ] Unit testing

### 🚀 Sprint 5: Deployment & Documentation
- [ ] Deploy to Render
- [ ] Create documentation
- [ ] Prepare demo materials

## 🤝 Contributing

This is a capstone project. Please follow the established coding standards and commit message conventions.

## 📄 License

This project is for educational purposes as part of a capstone project.
