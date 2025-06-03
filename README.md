# Mini CRM Platform

A modern CRM platform with customer segmentation, campaign management, and AI-powered features.

## Features

- 🔐 Google OAuth 2.0 Authentication
- 📊 Customer Segmentation with Dynamic Rules
- 📨 Campaign Management
- 🤖 AI-Powered Features
  - Natural Language to Segment Rules
  - AI-Driven Message Suggestions
- 📈 Campaign Analytics
- 🔄 Asynchronous Data Processing with Redis

## Tech Stack

- Frontend: Next.js (JavaScript)
- Backend: Node.js
- Database: MongoDB
- Message Broker: Redis
- AI Integration: OpenAI API

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Redis
- Google Cloud Console account (for OAuth)
- OpenAI API key

## Project Structure

```
.
├── frontend/          # Next.js frontend application
├── backend/          # Node.js backend application
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   REDIS_URL=your_redis_url
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   OPENAI_API_KEY=your_openai_api_key
   JWT_SECRET=your_jwt_secret
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## API Documentation

The API documentation is available at `/api-docs` when running the backend server.

## Testing

- Backend tests: `cd backend && npm test`
- Frontend tests: `cd frontend && npm test`

## License

MIT 