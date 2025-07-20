# MoneyMind - Personal Finance Tracker & Budgeting Web App

## Overview
MoneyMind is a comprehensive personal finance management application that helps users track their spending, create budgets, and analyze their financial habits. The application provides an intuitive interface for managing transactions, categorizing expenses, and monitoring budget goals.

## Features

### 🏦 Transaction Management
- Create, edit, and delete financial transactions
- Categorize transactions as income or expenses
- Support for various expense categories (Food & Dining, Transportation, Shopping, etc.)
- Date-based transaction filtering and sorting
- Transaction search and filtering capabilities

### 💰 Budget Management
- Create monthly and yearly budgets by category
- Real-time budget tracking with spending alerts
- Visual progress indicators for budget utilization
- Budget overlap detection to prevent conflicts
- Comprehensive budget summary and analytics

### 📊 Financial Analytics
- Dashboard with key financial metrics
- Spending trends and patterns analysis
- Budget vs actual spending comparisons
- Category-wise expense breakdown
- Monthly and yearly financial summaries

### 🔐 User Authentication
- Secure user registration and login
- Session-based authentication
- Protected routes and data access
- User-specific data isolation

## Technology Stack

### Frontend
- **React** with TypeScript for type safety
- **Tailwind CSS** for responsive styling
- **Vite** for fast development and building
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **Passport.js** for authentication
- **Express Session** for session management
- **CORS** for cross-origin resource sharing

### Deployment
- **Frontend**: Deployed on Render.com
- **Backend**: Deployed on Render.com
- **Database**: MongoDB Atlas cloud database

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budgets
- `GET /api/budgets` - Get user budgets with spending data
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/summary` - Get budget summary

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview data

## Key Components

### Frontend Components
- **Dashboard**: Main overview with financial summaries
- **TransactionsPage**: Transaction management interface
- **BudgetsPage**: Budget creation and tracking
- **CategoriesPage**: Category management
- **LoginForm/RegisterForm**: Authentication forms
- **Navigation**: Main navigation component

### Backend Models
- **User**: User account information
- **Transaction**: Financial transaction data
- **Budget**: Budget configuration and tracking
- **Category**: Transaction categories

## Data Flow
1. Users authenticate through the login system
2. Transactions are created and categorized
3. Budgets are set up for different categories and time periods
4. Real-time spending tracking compares actual expenses against budgets
5. Dashboard provides comprehensive financial overview
6. Analytics help users understand spending patterns

## Security Features
- Password hashing with bcrypt
- Session-based authentication
- CORS protection
- Input validation and sanitization
- MongoDB injection protection

## Development Setup
1. Clone the repository
2. Install dependencies for both frontend and backend
3. Set up environment variables
4. Connect to MongoDB database
5. Run development servers

## Environment Variables
- `VITE_API_URL`: Frontend API endpoint
- `MONGODB_URI`: MongoDB connection string
- `SESSION_SECRET`: Session encryption key

## Recent Updates
- Fixed budget page data loading issues
- Improved API response structure handling
- Enhanced error handling and user feedback
- Updated budget service with consistent axios configuration
- Resolved category data mapping between frontend and backend

## Target Users
This application is designed for English-speaking developers and users who want to:
- Track personal finances effectively
- Create and monitor budgets
- Analyze spending patterns
- Maintain financial discipline
- Access their financial data from anywhere

## Code Quality
- TypeScript for type safety
- ESLint for code linting
- Consistent error handling
- Comprehensive logging
- Modular component architecture
- RESTful API design
