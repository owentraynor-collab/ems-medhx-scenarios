# API Documentation

## Overview
This document provides detailed information about the API services used in the EMS Medical History Educational App. The API is built using Node.js/Express and follows RESTful principles.

## Authentication
All API endpoints require authentication using JWT tokens.

### Token Format
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication
- `POST /api/auth/login`
  - Login with credentials
  - Returns JWT token
- `POST /api/auth/refresh`
  - Refresh expired token
- `POST /api/auth/logout`
  - Invalidate current token

#### Student Performance
- `GET /api/students/:id/performance`
  - Get student performance data
  - Optional query params: timeRange
- `POST /api/performance`
  - Submit new performance data
- `GET /api/analytics/performance`
  - Get performance analytics
  - Optional query params: filters

#### Instructor Dashboard
- `GET /api/instructors/:id/students`
  - Get list of students
- `GET /api/instructors/:id/class-performance`
  - Get class performance metrics

#### Scenarios
- `GET /api/scenarios`
  - Get available scenarios
  - Optional query params: filters
- `POST /api/scenarios/:id/results`
  - Submit scenario results

## Error Handling
The API uses standard HTTP status codes and returns error messages in the following format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per user

## Offline Support
The API supports offline operation through:
- Request queueing
- Data synchronization
- Conflict resolution

## Best Practices
1. Always include error handling
2. Use appropriate HTTP methods
3. Validate input data
4. Handle rate limiting
5. Implement proper authentication

