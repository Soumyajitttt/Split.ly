```
  ____        _ _ _         _
 / ___| _ __ | (_) |_   ___| |_   _
 \___ \| '_ \| | | __| / __| | | | |
  ___) | |_) | | | |_ | (__| | |_| |
 |____/| .__/|_|_|\__(_)___|_|\__, |
       |_|                    |___/
```

**Split expenses with friends. Track who owes what. Settle up.**

Split.ly is a full-stack expense-splitting application built with React and Node.js. Create groups, log expenses with equal or custom splits, track balances, and settle debts — with both email/password and Google OAuth login.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Google OAuth Setup](#google-oauth-setup)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Known Issues](#known-issues)

---

## Features

- **Authentication** — Register and log in with email and password, or sign in with Google (OAuth 2.0). Sessions are managed with short-lived JWT access tokens (15 minutes) and long-lived refresh tokens (7 days) stored in HTTP-only cookies.
- **Groups** — Create groups and invite members to share costs across any number of people.
- **Expense tracking** — Add expenses with a description, total amount, and the member who paid. Choose between equal splits (divided evenly across selected members) or custom splits (per-person amounts you specify).
- **Settlements** — Mark individual shares as paid using the `settlement` split type. The expense schema tracks `settledBy` (partial settlers) as well as a top-level `settled` flag and `settledAt` timestamp.
- **Email notifications** — Transactional email support via Nodemailer and any SMTP provider (configured for Gmail by default).
- **Responsive UI** — Built with Tailwind CSS v4 and Heroicons. Fully client-side routing via React Router v7 with protected routes for authenticated pages.

---

## Tech Stack

### Backend

| Package | Version | Purpose |
|---|---|---|
| express | ^5.2.1 | HTTP server and routing |
| mongoose | ^9.3.2 | MongoDB ODM |
| jsonwebtoken | ^9.0.3 | JWT access and refresh tokens |
| bcrypt | ^6.0.0 | Password hashing |
| passport | ^0.7.0 | Authentication middleware |
| passport-google-oauth20 | ^2.0.0 | Google OAuth 2.0 strategy |
| nodemailer | ^8.0.7 | Transactional email via SMTP |
| cookie-parser | ^1.4.7 | Parse HTTP-only cookies |
| cors | ^2.8.6 | Cross-origin request handling |
| morgan | ^1.10.1 | HTTP request logging |
| dotenv | ^17.3.1 | Environment variable loading |

### Frontend

| Package | Version | Purpose |
|---|---|---|
| react | ^19.2.4 | UI library |
| react-dom | ^19.2.4 | DOM rendering |
| react-router-dom | ^7.14.1 | Client-side routing |
| axios | ^1.7.2 | HTTP client |
| tailwindcss | ^4.2.2 | Utility-first CSS framework |
| @heroicons/react | ^2.2.0 | SVG icon set |
| vite | ^8.0.4 | Build tool and dev server |

---

## Project Structure

```
Split.ly/
├── backend/
│   ├── src/
│   │   ├── index.js          # Entry point (starts server)
│   │   ├── app.js            # Express app, middleware, route mounting
│   │   ├── config/
│   │   │   └── passport.js   # Google OAuth and JWT strategy config
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   ├── group.model.js
│   │   │   └── expense.model.js
│   │   ├── routes/
│   │   │   ├── user.routes.js
│   │   │   ├── group.routes.js
│   │   │   └── expense.routes.js
│   │   └── controllers/
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx           # Route definitions
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ToastContext.jsx
    │   ├── components/
    │   │   └── ProtectedRoute.jsx
    │   └── pages/
    │       ├── Landing.jsx
    │       ├── Login.jsx
    │       ├── Signup.jsx
    │       ├── AuthCallback.jsx
    │       ├── Dashboard.jsx
    │       ├── Groups.jsx
    │       └── GroupDetail.jsx
    └── package.json
```

---

## Prerequisites

- Node.js 18 or later
- A running MongoDB instance (local or MongoDB Atlas)
- A Google Cloud project with OAuth 2.0 credentials (for Google login)
- An SMTP account for email (Gmail works with an app password)

---

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see [Environment Variables](#environment-variables) below).

```bash
# Development (auto-restarts with nodemon)
npm run dev

# Production
npm start
```

The server starts on the port defined by `PORT` (default `5000`).

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts at `http://localhost:5173` by default.

To build for production:

```bash
npm run build
npm run preview
```

---

## Environment Variables

Create `backend/.env` with the following keys:

```env
# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# Server
PORT=5000
NODE_ENV=development

# CORS — must match your frontend origin exactly
CORS_ORIGIN=http://localhost:5173

# JWT
ACCESS_TOKEN_SECRET=<long-random-string>
REFRESH_TOKEN_SECRET=<different-long-random-string>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1.0.0/users/auth/google/callback

# Frontend redirect target after Google login
FRONTEND_URL=http://localhost:5173

# SMTP / Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email@gmail.com>
SMTP_PASS=<gmail-app-password>
SMTP_FROM_NAME=Split.ly
APP_URL=https://yourdomain.com
```

> For `SMTP_PASS` with Gmail, generate an App Password from your Google Account under Security > 2-Step Verification > App passwords. Do not use your regular Gmail password.

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create or select a project.
2. Navigate to **APIs and Services > Credentials > Create Credentials > OAuth 2.0 Client ID**.
3. Set the application type to **Web application**.
4. Add `http://localhost:5000` to **Authorized JavaScript origins**.
5. Add `http://localhost:5000/api/v1.0.0/users/auth/google/callback` to **Authorized redirect URIs**.
6. Copy the **Client ID** and **Client Secret** into your `.env` file.

When a user completes the Google flow, the backend redirects them to `FRONTEND_URL/auth/callback` with tokens appended as query parameters, which the `AuthCallback` page handles on the frontend.

---

## API Reference

All routes are prefixed with `/api/v1.0.0`.

### Authentication — `/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users/register` | No | Create a new account with fullname, username, email, and password |
| POST | `/users/login` | No | Log in and receive access and refresh tokens as cookies |
| POST | `/users/logout` | Yes | Clear tokens and invalidate the refresh token |
| POST | `/users/refresh` | No | Exchange a valid refresh token cookie for a new access token |
| GET | `/users/me` | Yes | Return the currently authenticated user's profile |
| GET | `/users/auth/google` | No | Redirect to Google's OAuth consent screen |
| GET | `/users/auth/google/callback` | No | Google OAuth callback; redirects to frontend with tokens |

### Groups — `/groups`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/groups` | Yes | Create a new group |
| GET | `/groups` | Yes | List all groups the current user belongs to |
| GET | `/groups/:groupId` | Yes | Get full details of a single group |
| PATCH | `/groups/:groupId` | Yes | Update group name or members |
| DELETE | `/groups/:groupId` | Yes | Delete a group |

### Expenses — `/expenses`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/expenses` | Yes | Add an expense to a group |
| GET | `/expenses/group/:groupId` | Yes | List all expenses for a group |
| GET | `/expenses/:expenseId` | Yes | Get a single expense |
| PATCH | `/expenses/:expenseId` | Yes | Edit an expense |
| DELETE | `/expenses/:expenseId` | Yes | Delete an expense |
| PATCH | `/expenses/:expenseId/settle` | Yes | Mark a user's share of an expense as settled |

---

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| fullname | String | Required |
| email | String | Required, unique, stored lowercase |
| username | String | Required, unique, stored lowercase |
| password | String | Bcrypt-hashed (10 rounds); skipped for Google users |
| groups | ObjectId[] | References to Group documents |
| expenses | ObjectId[] | References to Expense documents |
| avatar | String | URL; null by default |
| refreshToken | String | Stored on login, cleared on logout |

### Expense

| Field | Type | Notes |
|---|---|---|
| description | String | Required |
| amount | Number | Required; total cost of the expense |
| paidby | ObjectId | Reference to the User who paid |
| group | ObjectId | Reference to the Group this expense belongs to |
| splitType | String | `equal`, `custom`, or `settlement` |
| splitamong | ObjectId[] | Users sharing the cost; used when `splitType` is `equal` |
| customSplits | Array | `[{ user: ObjectId, amount: Number }]`; used when `splitType` is `custom` |
| settledBy | ObjectId[] | Users who have paid their share of this expense |
| settled | Boolean | `true` when all shares are settled; defaults to `false` |
| settledAt | Date | Timestamp of full settlement; null until settled |

---

## Known Issues

- **`paidby` field casing** — The Expense model defines the field as `paidby` (lowercase), but parts of the codebase may reference it as `paidBy` (camelCase). If populated expense data is missing the payer, check that queries and response serialization consistently use `paidby`.
- **Google OAuth password requirement** — The User schema marks `password` as required. Google-authenticated users do not supply a password, so the OAuth registration flow must either set a placeholder value or the schema validation must be relaxed for OAuth-sourced documents.

---

