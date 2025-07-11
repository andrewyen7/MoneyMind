# MoneyMind API Documentation

This document provides comprehensive documentation for the MoneyMind API endpoints.

## Base URL
```
http://localhost:5000/api
```

## Authentication

MoneyMind uses session-based authentication. All protected endpoints require a valid session cookie.

### Authentication Endpoints

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string"
  }
}
```

#### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string"
  }
}
```

#### Logout User
```http
POST /auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Get Current User
```http
GET /auth/me
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string"
  }
}
```

## Categories

### Get Categories
```http
GET /categories
```

**Query Parameters:**
- `type` (optional): Filter by category type (`income` or `expense`)

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "_id": "string",
      "name": "string",
      "icon": "string",
      "color": "string",
      "type": "income|expense",
      "isDefault": "boolean",
      "isActive": "boolean"
    }
  ]
}
```

### Create Category
```http
POST /categories
```

**Request Body:**
```json
{
  "name": "string",
  "icon": "string",
  "color": "string",
  "type": "income|expense"
}
```

### Update Category
```http
PUT /categories/:id
```

**Request Body:**
```json
{
  "name": "string",
  "icon": "string",
  "color": "string",
  "isActive": "boolean"
}
```

### Delete Category
```http
DELETE /categories/:id
```

## Transactions

### Get Transactions
```http
GET /transactions
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `type` (optional): Filter by type (`income` or `expense`)
- `category` (optional): Filter by category ID
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)
- `sortBy` (optional): Sort field (default: `date`)
- `sortOrder` (optional): Sort order (`asc` or `desc`, default: `desc`)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "_id": "string",
      "description": "string",
      "amount": "number",
      "type": "income|expense",
      "date": "string",
      "category": {
        "_id": "string",
        "name": "string",
        "icon": "string",
        "color": "string"
      },
      "notes": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalCount": "number",
    "hasNext": "boolean",
    "hasPrev": "boolean"
  }
}
```

### Create Transaction
```http
POST /transactions
```

**Request Body:**
```json
{
  "description": "string",
  "amount": "number",
  "type": "income|expense",
  "date": "string",
  "category": "string",
  "notes": "string"
}
```

### Update Transaction
```http
PUT /transactions/:id
```

**Request Body:**
```json
{
  "description": "string",
  "amount": "number",
  "type": "income|expense",
  "date": "string",
  "category": "string",
  "notes": "string"
}
```

### Delete Transaction
```http
DELETE /transactions/:id
```

### Get Transaction Statistics
```http
GET /transactions/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "income": {
      "total": "number",
      "count": "number",
      "avgAmount": "number"
    },
    "expense": {
      "total": "number",
      "count": "number",
      "avgAmount": "number"
    },
    "netIncome": "number"
  }
}
```

## Budgets

### Get Budgets
```http
GET /budgets
```

**Query Parameters:**
- `period` (optional): Filter by period (`monthly` or `yearly`)
- `includeInactive` (optional): Include inactive budgets (`true` or `false`)

**Response:**
```json
{
  "success": true,
  "budgets": [
    {
      "_id": "string",
      "name": "string",
      "category": {
        "_id": "string",
        "name": "string",
        "icon": "string",
        "color": "string"
      },
      "amount": "number",
      "period": "monthly|yearly",
      "startDate": "string",
      "endDate": "string",
      "alertThreshold": "number",
      "spent": "number",
      "remaining": "number",
      "percentageUsed": "number",
      "status": "good|warning|over",
      "isOverBudget": "boolean",
      "isNearLimit": "boolean",
      "transactionCount": "number",
      "notes": "string"
    }
  ]
}
```

### Create Budget
```http
POST /budgets
```

**Request Body:**
```json
{
  "name": "string",
  "category": "string",
  "amount": "number",
  "period": "monthly|yearly",
  "startDate": "string",
  "endDate": "string",
  "alertThreshold": "number",
  "notes": "string"
}
```

### Update Budget
```http
PUT /budgets/:id
```

**Request Body:**
```json
{
  "name": "string",
  "amount": "number",
  "period": "monthly|yearly",
  "startDate": "string",
  "alertThreshold": "number",
  "notes": "string",
  "isActive": "boolean"
}
```

### Delete Budget
```http
DELETE /budgets/:id
```

### Get Budget Summary
```http
GET /budgets/summary
```

**Query Parameters:**
- `period` (optional): Filter by period (`monthly` or `yearly`, default: `monthly`)

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalBudgeted": "number",
    "totalSpent": "number",
    "totalRemaining": "number",
    "budgetCount": "number",
    "overBudgetCount": "number",
    "warningCount": "number",
    "goodCount": "number"
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP address
- 429 status code returned when limit exceeded

## Data Validation

### Transaction Validation
- `description`: Required, 1-200 characters
- `amount`: Required, positive number
- `type`: Required, must be 'income' or 'expense'
- `date`: Required, valid date
- `category`: Required, valid category ID

### Budget Validation
- `name`: Required, 1-100 characters
- `amount`: Required, positive number
- `period`: Required, must be 'monthly' or 'yearly'
- `startDate`: Required, valid date
- `alertThreshold`: Optional, 50-95 (default: 80)

### Category Validation
- `name`: Required, 1-50 characters, unique per user
- `icon`: Required, single emoji character
- `color`: Required, valid hex color code
- `type`: Required, must be 'income' or 'expense'
