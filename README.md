# Emmisor

Emmisor is an email marketing platform with a React/TypeScript frontend and Node.js/Express backend, using Supabase for authentication and database management.

## Project Structure

```
Emmisor/
├── backend/
│   └── server/
│       ├── index.js
│       ├── config/
│       ├── middleware/
│       ├── routes/
│       └── ...
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
├── .gitignore
├── README.md
└── ...
```

## Features

- User authentication (Supabase)
- Campaign management
- Contact management
- Email template editor
- Queue monitoring
- Audit and reporting

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Supabase account

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/saintdannyyy/emmisor.git
   cd emmisor
   ```
2. Install dependencies for both frontend and backend:
   ```
   cd frontend && npm install
   cd ../backend/server && npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env` in both `frontend` and `backend/server` and fill in your Supabase keys and API URLs.
4. Start the backend server:
   ```
   cd backend/server
   npm start
   ```
5. Start the frontend:
   ```
   cd ../../frontend
   npm run dev
   ```

## Development Workflow

- Frontend: React + TypeScript + Vite
- Backend: Express.js + Supabase
- Environment variables managed via `.env` files
- Unified git repository for both frontend and backend

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
