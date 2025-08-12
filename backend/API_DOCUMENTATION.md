# SkillUp Lab API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "student",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "1h"
    }
  }
}
```

### POST /auth/login
Authenticate user and get access tokens.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "student"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "1h"
    }
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/profile
Get current user profile. **Requires authentication.**

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "student",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

### PUT /auth/profile
Update user profile. **Requires authentication.**

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "newemail@example.com"
}
```

### POST /auth/logout
Logout user and invalidate refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## User Management Endpoints (Admin Only)

### GET /users
Get all users with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `role` (optional): Filter by role (admin, teacher, student)
- `search` (optional): Search in username, email, or name

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "role": "student",
        "first_name": "John",
        "last_name": "Doe",
        "is_active": true,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### POST /users
Create a new user. **Admin only.**

**Request Body:**
```json
{
  "username": "new_user",
  "email": "newuser@example.com",
  "password": "SecurePassword123",
  "firstName": "New",
  "lastName": "User",
  "role": "teacher"
}
```

### PUT /users/:id
Update user information. **Admin only.**

**Request Body:**
```json
{
  "role": "teacher",
  "firstName": "Updated",
  "isActive": true
}
```

### DELETE /users/:id
Soft delete user. **Admin only.**

## Forms Endpoints

### GET /forms
Get forms accessible to the current user.

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status (draft, published, archived)
- `search`: Search in title or description

**Response (200):**
```json
{
  "success": true,
  "data": {
    "forms": [
      {
        "id": 1,
        "title": "Course Feedback Form",
        "description": "Please provide feedback about the course",
        "status": "published",
        "created_by": 2,
        "creator_username": "teacher1",
        "settings": {
          "deadline": "2024-12-31",
          "max_submissions": 1
        },
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

### GET /forms/:id
Get form by ID with fields.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "form": {
      "id": 1,
      "title": "Course Feedback Form",
      "description": "Please provide feedback",
      "status": "published",
      "fields": [
        {
          "id": 1,
          "field_name": "course_name",
          "field_label": "Course Name",
          "field_type": "text",
          "is_required": true,
          "field_order": 1,
          "placeholder": "Enter course name",
          "validation_rules": {
            "min_length": 2,
            "max_length": 100
          }
        }
      ]
    }
  }
}
```

### POST /forms
Create a new form. **Teacher/Admin only.**

**Request Body:**
```json
{
  "title": "New Form",
  "description": "Form description",
  "status": "draft",
  "settings": {
    "deadline": "2024-12-31",
    "max_submissions": 1
  },
  "fields": [
    {
      "fieldName": "name",
      "fieldLabel": "Full Name",
      "fieldType": "text",
      "isRequired": true,
      "placeholder": "Enter your name"
    }
  ]
}
```

### PUT /forms/:id
Update form. **Form owner or Admin.**

### DELETE /forms/:id
Delete form. **Form owner or Admin.**

### POST /forms/:id/fields
Add field to form. **Form owner or Admin.**

**Request Body:**
```json
{
  "fieldName": "email",
  "fieldLabel": "Email Address",
  "fieldType": "email",
  "isRequired": true,
  "placeholder": "your@email.com",
  "validationRules": {
    "pattern": "^[^@]+@[^@]+\\.[^@]+$"
  }
}
```

## Submissions Endpoints

### GET /submissions
Get submissions accessible to the current user.

**Query Parameters:**
- `page`, `limit`: Pagination
- `formId`: Filter by form ID
- `status`: Filter by status (draft, submitted, reviewed)

### POST /submissions/form/:formId
Submit form response.

**Request Body:**
```json
{
  "submissionData": {
    "course_name": "Web Development",
    "rating": "Excellent",
    "comments": "Great course!"
  },
  "status": "submitted"
}
```

### PUT /submissions/:id
Update submission (for drafts or teacher grading).

**Request Body:**
```json
{
  "submissionData": {
    "course_name": "Updated course name"
  },
  "status": "submitted",
  "score": 95.5,
  "feedback": "Excellent work!"
}
```

### GET /submissions/stats
Get submission statistics.

**Query Parameters:**
- `formId`: Get stats for specific form (required for teachers/admins)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_submissions": 25,
      "submitted_count": 20,
      "draft_count": 3,
      "reviewed_count": 15,
      "average_score": 87.5
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized / Authentication Required |
| 403 | Forbidden / Insufficient Permissions |
| 404 | Not Found |
| 409 | Conflict / Duplicate Entry |
| 429 | Too Many Requests / Rate Limited |
| 500 | Internal Server Error |

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Form Submissions**: 10 requests per 5 minutes per IP

## Field Types

Supported form field types:
- `text`: Single line text input
- `textarea`: Multi-line text input
- `email`: Email address input
- `number`: Numeric input
- `select`: Dropdown selection
- `radio`: Radio button selection
- `checkbox`: Checkbox selection (multiple values)
- `date`: Date picker
- `file`: File upload (implementation depends on frontend)

## Validation Rules

Form fields can have validation rules:
```json
{
  "min_length": 5,
  "max_length": 100,
  "pattern": "^[A-Za-z0-9]+$",
  "min": 0,
  "max": 100
}
```
