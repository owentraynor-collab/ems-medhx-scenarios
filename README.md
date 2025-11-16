# EMS Medical History Educational App

A comprehensive educational application designed for EMS clinicians to learn and practice medical history taking techniques.

## Features

- Student progress tracking across devices
- Educational modules:
  - Chief complaint
  - History of present illness (OPQRST-ASPN)
  - Past Medical History
  - Medications and Allergies
- Interactive quizzes with explanations
- AI-powered patient scenarios
- Instructor dashboard

## Tech Stack

- Frontend: React Native
- Backend: Node.js/Express
- Database: MongoDB
- Authentication: JWT
- State Management: React Context API
- UI Components: React Native Paper

## Project Structure

```
ems-medhx-app/
├── mobile/           # React Native mobile app
│   ├── src/
│   │   ├── screens/  # Screen components
│   │   ├── components/ # Reusable components
│   │   └── services/ # API services
│   └── package.json
├── server/           # Node.js/Express backend
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── models/   # MongoDB models
│   │   └── controllers/ # Route controllers
│   └── package.json
└── package.json      # Root package.json
```

## Getting Started

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Start the backend server:
   ```bash
   yarn start:server
   ```

3. Start the mobile app:
   ```bash
   # For iOS
   yarn start:mobile
   cd mobile && yarn ios
   
   # For Android
   yarn start:mobile
   cd mobile && yarn android
   ```

## Development

- The mobile app uses TypeScript for type safety
- Backend API is RESTful and documented using OpenAPI/Swagger
- MongoDB is used for storing user data, quiz questions, and scenario information
- Authentication is handled using JWT tokens

## Testing

Run tests for both mobile and server:
```bash
yarn test
```

