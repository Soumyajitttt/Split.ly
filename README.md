# Split.ly — Split Expenses, Not Friendships

A full-stack MERN expense-splitting app with Google OAuth, JWT authentication, and a sleek dark UI.

---

## Project Structure

```
split.ly/
├── backend/          ← Express + MongoDB API
└── frontend/         ← React + Vite + Tailwind
```

---

## Backend Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
Edit `.env`:
```
MONGO_URI=your_mongodb_connection_string
PORT=5000
CORS_ORIGIN=http://localhost:5173
ACCESS_TOKEN_SECRET=your_secret_here
REFRESH_TOKEN_SECRET=your_refresh_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
NODE_ENV=development

# Google OAuth (https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1.0.0/users/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### 3. Google OAuth Setup
1. Go to https://console.cloud.google.com
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add Authorized redirect URIs:  
   `http://localhost:5000/api/v1.0.0/users/auth/google/callback`
5. Copy Client ID and Secret to `.env`

### 4. Run backend
```bash
npm run dev       # development (nodemon)
npm start         # production
```

---

## Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Run frontend
```bash
npm run dev
```

App runs at: http://localhost:5173

---

## API Endpoints

### Auth (`/api/v1.0.0/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | ✗ | Register new user |
| POST | `/login` | ✗ | Login with email/password |
| POST | `/logout` | ✓ | Logout current user |
| POST | `/refresh-token` | ✗ | Refresh access token |
| GET | `/auth/google` | ✗ | Start Google OAuth |
| GET | `/auth/google/callback` | ✗ | Google OAuth callback |

### Groups (`/api/v1.0.0/groups`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/create-group` | ✓ | Create a new group |
| POST | `/join-group` | ✓ | Join group by code |
| GET | `/my-groups` | ✓ | Get all user's groups |
| GET | `/:groupId` | ✓ | Get group details |
| POST | `/:groupId/leave` | ✓ | Leave a group |

### Expenses (`/api/v1.0.0/expenses`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/:groupId/create-expense` | ✓ | Add expense to group |
| GET | `/:groupId/expenses` | ✓ | Get group expenses |
| GET | `/my-expenses` | ✓ | Get user's expenses |
| GET | `/:groupId/summary` | ✓ | Settlements & total |
| DELETE | `/:expenseId` | ✓ | Delete an expense |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Tailwind CSS 4 |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Auth | JWT (access + refresh tokens), Google OAuth 2.0 (Passport.js) |
| Build | Vite 8 |

---

## Features

- **Email/Password Auth** — register, login, logout, token refresh
- **Google OAuth** — one-click sign in with Google account
- **Groups** — create groups with unique join codes, share via code
- **Expense Tracking** — log expenses, select who paid, choose who splits
- **Smart Settlements** — greedy algorithm minimises number of payments
- **Dashboard** — overview of balances, recent activity, group stats
- **Persistent Auth** — refresh tokens in HTTP-only cookies
- **Responsive** — works on mobile and desktop

---

## Notes

- The `expense.model.js` uses `paidBy`/`splitAmong` field names (capitalized) but the controllers use `paidby`/`splitamong`. If you see field mismatch issues, align the model field names with the controller expectations.
- Google OAuth requires valid credentials in `.env` — without them, the Google button will redirect to an error.
