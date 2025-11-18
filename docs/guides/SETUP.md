# OneSeek.AI - Setup Instructions

## Installation

After cloning the repository or pulling changes, you need to install dependencies for both frontend and backend.

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start Backend Server

```bash
cd backend
node index.js
```

The backend will start on port 3001.

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend development server will start on port 3000 (or the next available port).

### Build Frontend for Production

```bash
cd frontend
npm run build
npm run preview
```

## Troubleshooting

### Error: ERR_MODULE_NOT_FOUND

This error means dependencies are not installed. Run `npm install` in the affected directory (frontend or backend).

### Error: ECONNREFUSED when calling API

This means the backend server is not running or dependencies are not installed. Make sure:
1. Backend dependencies are installed (`cd backend && npm install`)
2. Backend server is running (`cd backend && node index.js`)

### Error: Failed to resolve import "react-router-dom"

This means frontend dependencies are not installed. Run:
```bash
cd frontend
npm install
```

## Environment Variables

Create `.env` files in both frontend and backend directories if needed:

### Backend `.env`
```
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:3001
```
