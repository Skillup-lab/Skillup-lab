# SkillUp Lab Backend API

A production-ready Node.js/Express backend API for a form-based application with role-based access control (RBAC). Built with enterprise-grade security, scalability, and maintainability for real-world deployment.

## 🚀 Production Features

- **Enterprise RBAC**: Three user roles with granular permissions - Admin, Teacher, Student
- **Secure JWT Authentication**: Production-grade token-based auth with refresh tokens
- **Dynamic Forms**: Create and manage forms with various field types and validation
- **Form Submissions**: Submit, review, grade, and export form responses
- **PlanetScale Integration**: Production MySQL database with connection pooling
- **Security Hardened**: Rate limiting, input validation, SQL injection prevention, CORS
- **Audit Logging**: Comprehensive audit trails for compliance and security
- **Performance Monitoring**: Query optimization and slow query detection
- **Production Deployment**: Ready for Railway, Render, Vercel, or any cloud platform

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (PlanetScale compatible)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit
- **Password Hashing**: bcryptjs
- **Logging**: morgan
- **Testing**: Jest, Supertest

## 📋 Prerequisites

- Node.js (v16 or higher)
- PlanetScale account (or MySQL database)
- npm or yarn package manager

## 🔧 Production Setup

### 1. Quick Start

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Setup production environment
cp .env.production .env
# Edit .env with your production values

# Setup database and create admin user
npm run setup:production

# Start production server
npm start
```

### 2. Environment Configuration

Create your production environment file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (PlanetScale)
DATABASE_URL=mysql://username:password@host.planetscale.com/database_name?sslaccept=strict
DB_HOST=host.planetscale.com
DB_USER=username
DB_PASSWORD=password
DB_NAME=database_name
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-make-it-long-and-random
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Security
BCRYPT_SALT_ROUNDS=12

# Logging
LOG_LEVEL=info
```

### 3. PlanetScale Database Setup

1. **Create PlanetScale Account**: Sign up at [planetscale.com](https://planetscale.com)
2. **Create Database**: Create a new database in your PlanetScale dashboard
3. **Get Connection String**: Copy the connection string from your database settings
4. **Update Environment**: Add the connection details to your `.env` file

### 4. Database Migration

Run the database migrations to create tables:

```bash
# Create database schema
node database/migrations.js migrate

# Seed with sample data (optional)
node database/migrations.js seed

# Or do both at once
node database/migrations.js migrate:seed
```

### 5. Start the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/auth/login` | User login | Public |
| POST | `/auth/register` | User registration | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/logout` | User logout | Public |
| GET | `/auth/profile` | Get user profile | Private |
| PUT | `/auth/profile` | Update user profile | Private |
| PUT | `/auth/change-password` | Change password | Private |

### User Management Endpoints (Admin Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/users` | Get all users | Admin |
| GET | `/users/:id` | Get user by ID | Admin |
| POST | `/users` | Create new user | Admin |
| PUT | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Delete user | Admin |
| GET | `/users/stats` | Get user statistics | Admin |

### Forms Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/forms` | Get accessible forms | All authenticated |
| GET | `/forms/:id` | Get form by ID | Role-based |
| POST | `/forms` | Create new form | Teacher/Admin |
| PUT | `/forms/:id` | Update form | Owner/Admin |
| DELETE | `/forms/:id` | Delete form | Owner/Admin |
| POST | `/forms/:id/fields` | Add form field | Owner/Admin |
| PUT | `/forms/:id/fields/:fieldId` | Update form field | Owner/Admin |
| DELETE | `/forms/:id/fields/:fieldId` | Delete form field | Owner/Admin |
| GET | `/forms/:id/submissions` | Get form submissions | Owner/Admin |

### Submissions Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/submissions` | Get accessible submissions | Role-based |
| GET | `/submissions/:id` | Get submission by ID | Role-based |
| POST | `/submissions/form/:formId` | Submit form | All authenticated |
| PUT | `/submissions/:id` | Update submission | Role-based |
| DELETE | `/submissions/:id` | Delete submission | Role-based |
| GET | `/submissions/stats` | Get submission stats | Role-based |

## 🔐 User Roles & Permissions

### Admin
- Full access to all endpoints
- User management (CRUD operations)
- View all forms and submissions
- System administration

### Teacher
- Create, edit, and manage their own forms
- View submissions to their forms
- Grade and provide feedback on submissions
- Cannot access other teachers' forms

### Student
- View published forms
- Submit form responses
- View their own submissions
- Cannot create forms or view others' submissions

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Comprehensive input validation using express-validator
- **SQL Injection Prevention**: Parameterized queries and input sanitization
- **XSS Protection**: Input sanitization and security headers
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Password Hashing**: bcrypt with configurable salt rounds
- **Security Headers**: Helmet.js for security headers

## 📊 Monitoring & Logging

- **Request Logging**: Detailed request/response logging
- **Error Tracking**: Comprehensive error logging and handling
- **Performance Monitoring**: Slow query and request detection
- **Security Event Logging**: Authentication and authorization events
- **Health Check Endpoint**: `/health` for monitoring

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
# ... other production configurations
```

### PlanetScale Production Setup

1. Create production database branch in PlanetScale
2. Deploy schema changes using PlanetScale's branching workflow
3. Update production environment variables
4. Deploy application to your hosting platform

## 🤝 Frontend Integration

This API is designed to work seamlessly with frontend applications. Key integration points:

### CORS Configuration
Update `CORS_ORIGIN` in your `.env` file to include your frontend URLs.

### Authentication Flow
1. Login/Register to get access and refresh tokens
2. Include access token in Authorization header: `Bearer <token>`
3. Refresh tokens when access token expires

### Error Handling
All API responses follow a consistent format:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": { ... },
  "errors": [ ... ]
}
```

## 📝 API Response Examples

### Successful Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "student"
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PlanetScale connection string
   - Verify database credentials
   - Ensure database is active

2. **JWT Token Errors**
   - Check JWT_SECRET configuration
   - Verify token expiration settings
   - Ensure proper token format in requests

3. **Rate Limiting Issues**
   - Adjust rate limiting configuration
   - Check IP address detection
   - Verify proxy settings

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and stack traces.

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For support and questions, please create an issue in the repository or contact the development team.
