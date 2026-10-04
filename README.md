```
 ____        _ _ _         _
/ ___| _ __ | (_) |_   ___| |_   _
\___ \| '_ \| | | __| / __| | | |
 ___) | |_) | | | |_ | (__| | |_| |
|____/| .__/|_|_|\__(_)___|_|\__, |
      |_|                    |___/
```

**Split expenses with friends. Track who owes what. Settle up.**

Split.ly is a full-stack expense-splitting application built with React and Node.js. Create groups, add shared expenses, choose equal or custom splits, track balances, and settle debts with friends. The application supports email/password authentication, Google OAuth, real-time communication, email notifications, and a responsive modern UI.

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
- [Debt Simplification](#debt-simplification)
- [Real-Time Communication](#real-time-communication)
- [Client-Side Data Management](#client-side-data-management)
- [Email](#email)
- [Authentication Flow](#authentication-flow)
- [License](#license)

---

## Features

- **Authentication** — Register and log in with email/password or Google OAuth 2.0. Authentication uses JWT access and refresh tokens with HTTP-only cookies.
- **Groups** — Create groups and manage members for shared expenses.
- **Expense tracking** — Add expenses with descriptions, amounts, payers, and split configurations.
- **Equal splits** — Divide an expense equally among selected group members.
- **Custom splits** — Specify exactly how much each member owes.
- **Balance tracking** — Track who owes money and who should receive money within a group.
- **Debt simplification** — Net member balances and use a greedy settlement algorithm to reduce unnecessary transactions.
- **Settlements** — Mark individual shares as paid and track partial or complete settlement.
- **Real-time updates** — Socket.IO provides real-time communication between the frontend and backend.
- **Client-side data caching** — Shared application data is managed through a dedicated data cache/context layer.
- **Email notifications** — Transactional email support through Nodemailer and Resend.
- **Responsive UI** — Responsive application layout with Navbar, Sidebar, Bottom Navigation, Footer, and reusable UI components.
- **Animations** — GSAP is used for smooth interface animations and interactions.
- **Protected routes** — Authenticated application pages are protected using `ProtectedRoute`.

---

## Tech Stack

### Backend

| Package | Version | Purpose |
|---|---|---|
| Express | ^5.2.1 | HTTP server and API routing |
| Mongoose | ^9.3.2 | MongoDB ODM |
| JSON Web Token | ^9.0.3 | Access and refresh token authentication |
| Bcrypt | ^6.0.0 | Password hashing |
| Passport | ^0.7.0 | Authentication middleware |
| Passport Google OAuth 2.0 | ^2.0.0 | Google authentication |
| Nodemailer | ^8.0.7 | SMTP email delivery |
| Resend | ^6.12.3 | Email delivery |
| Socket.IO | ^4.8.1 | Real-time communication |
| Cookie Parser | ^1.4.7 | HTTP cookie parsing |
| CORS | ^2.8.6 | Cross-origin request handling |
| Morgan | ^1.10.1 | HTTP request logging |
| Dotenv | ^17.3.1 | Environment variable management |
| Nodemon | ^3.1.14 | Development auto-restart |

### Frontend

| Package | Version | Purpose |
|---|---|---|
| React | ^19.2.4 | UI library |
| React DOM | ^19.2.4 | React DOM rendering |
| React Router DOM | ^7.14.1 | Client-side routing |
| Axios | ^1.7.2 | HTTP client |
| Tailwind CSS | ^4.2.2 | Utility-first CSS framework |
| Tailwind Vite Plugin | ^4.2.2 | Tailwind/Vite integration |
| Heroicons | ^2.2.0 | UI icons |
| GSAP | ^3.15.0 | Animations |
| Socket.IO Client | ^4.8.1 | Real-time client communication |
| Vite | ^8.0.4 | Build tool and development server |

---

## Project Structure

```text
Split.ly/
├── frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── api/
│   │   │
│   │   ├── assets/
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.jsx
│   │   │   │   ├── BottomNav.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   │
│   │   │   └── ui/
│   │   │       └── ProtectedRoute.jsx
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── DataCache.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   ├── ToastContext.jsx
│   │   │   └── toast.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── App.css
│   │   │   ├── App.jsx
│   │   │   ├── index.css
│   │   │   └── main.jsx
│   │   │
│   │   ├── .gitignore
│   │   ├── README.md
│   │   ├── eslint.config.js
│   │   ├── index.html
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── vercel.json
│   │   └── vite.config.js
│   │
│   └── .gitignore
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── socket/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── index.js
│   │
│   ├── package-lock.json
│   └── package.json
│
└── README.md
```

---

## Prerequisites

Before running Split.ly locally, make sure you have:

- Node.js 18 or later
- MongoDB running locally or a MongoDB Atlas database
- A Google Cloud project with OAuth 2.0 credentials for Google login
- An SMTP provider or Resend account if email functionality is required

---

## Backend Setup

Clone the repository:

```bash
git clone https://github.com/Soumyajitttt/Split.ly.git
cd Split.ly
```

Navigate to the backend:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory.

Start the development server:

```bash
npm run dev
```

For production:

```bash
npm start
```

The backend runs on the port specified by `PORT`, which defaults to `5000`.

---

## Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

### Production Build

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

---

## Environment Variables

Create `backend/.env` with the following variables:

```env
# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# Server
PORT=5000
NODE_ENV=development

# CORS
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

# Frontend redirect after Google authentication
FRONTEND_URL=http://localhost:5173

# SMTP / Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email@gmail.com>
SMTP_PASS=<gmail-app-password>
SMTP_FROM_NAME=Split.ly

# Application URL
APP_URL=http://localhost:5173
```

### Gmail App Password

If Gmail is used as the SMTP provider:

1. Enable 2-Step Verification on your Google Account.
2. Generate an App Password.
3. Use that App Password as `SMTP_PASS`.

Do not use your regular Gmail password.

---

## Google OAuth Setup

1. Open the [Google Cloud Console](https://console.cloud.google.com).
2. Create or select a Google Cloud project.
3. Go to **APIs & Services → Credentials**.
4. Select **Create Credentials → OAuth client ID**.
5. Choose **Web application**.
6. Configure the required authorized origins.
7. Add the following redirect URI:

```text
http://localhost:5000/api/v1.0.0/users/auth/google/callback
```

8. Copy the generated Client ID and Client Secret into `backend/.env`.

After successful authentication, the backend redirects the user to:

```text
http://localhost:5173/auth/callback
```

The frontend authentication callback handles the returned authentication information and establishes the logged-in session.

---

## API Reference

All API routes are prefixed with:

```text
/api/v1.0.0
```

### Authentication — `/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users/register` | No | Create a new account |
| POST | `/users/login` | No | Log in and create authentication cookies |
| POST | `/users/logout` | Yes | Log out and invalidate the refresh token |
| POST | `/users/refresh` | No | Refresh the access token |
| GET | `/users/me` | Yes | Return the authenticated user's profile |
| GET | `/users/auth/google` | No | Start Google OAuth authentication |
| GET | `/users/auth/google/callback` | No | Handle the Google OAuth callback |

### Groups — `/groups`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/groups` | Yes | Create a group |
| GET | `/groups` | Yes | List groups for the current user |
| GET | `/groups/:groupId` | Yes | Get group details |
| PATCH | `/groups/:groupId` | Yes | Update group information |
| DELETE | `/groups/:groupId` | Yes | Delete a group |

### Expenses — `/expenses`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/expenses` | Yes | Add an expense to a group |
| GET | `/expenses/group/:groupId` | Yes | List expenses belonging to a group |
| GET | `/expenses/:expenseId` | Yes | Get a single expense |
| PATCH | `/expenses/:expenseId` | Yes | Edit an expense |
| DELETE | `/expenses/:expenseId` | Yes | Delete an expense |
| PATCH | `/expenses/:expenseId/settle` | Yes | Settle a user's share |

---

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| fullname | String | Required |
| email | String | Required, unique, lowercase |
| username | String | Required, unique, lowercase |
| password | String | Bcrypt-hashed; optional for Google users |
| groups | ObjectId[] | References to Group documents |
| expenses | ObjectId[] | References to Expense documents |
| avatar | String | User avatar URL |
| refreshToken | String | Stored refresh token |

### Group

| Field | Type | Notes |
|---|---|---|
| name | String | Name of the group |
| members | ObjectId[] | References to User documents |
| expenses | ObjectId[] | References to Expense documents |
| createdBy | ObjectId | User who created the group |

### Expense

| Field | Type | Notes |
|---|---|---|
| description | String | Description of the expense |
| amount | Number | Total expense amount |
| paidby | ObjectId | User who paid |
| group | ObjectId | Group associated with the expense |
| splitType | String | `equal`, `custom`, or `settlement` |
| splitamong | ObjectId[] | Users participating in an equal split |
| customSplits | Array | `[{ user: ObjectId, amount: Number }]` |
| settledBy | ObjectId[] | Users who have paid their shares |
| settled | Boolean | Whether the expense is fully settled |
| settledAt | Date | Time at which the expense was completely settled |

---

## Debt Simplification

Split.ly calculates the net balance of every member in a group.

For example:

```text
Alice    +₹500
Bob      -₹300
Charlie  -₹200
```

Instead of requiring multiple unnecessary payments, the application simplifies the balances:

```text
Bob      → Alice    ₹300
Charlie  → Alice    ₹200
```

The settlement process uses a greedy matching algorithm between creditors and debtors to reduce the number of transactions required to settle the group.

---

## Real-Time Communication

Split.ly uses Socket.IO for real-time communication.

### Backend

```text
socket.io
```

### Frontend

```text
socket.io-client
```

The frontend uses `SocketContext.jsx` to manage the socket connection and communicate with the backend in real time.

---

## Client-Side Data Management

The frontend contains a dedicated `DataCache.jsx` context for managing shared application data.

The application uses the following context modules:

- `AuthContext.jsx` — Authentication state
- `SocketContext.jsx` — Real-time socket state
- `ToastContext.jsx` — Toast and notification state
- `DataCache.jsx` — Shared cached application data

This architecture keeps application-wide state organized and reduces unnecessary API requests.

---

## Email

Split.ly supports transactional email through:

- **Nodemailer** — SMTP-based email delivery
- **Resend** — API-based email delivery

Email providers can be configured through the backend environment variables.

---

## Authentication Flow

### Email / Password

```text
User
 │
 ▼
Register / Login
 │
 ▼
Backend Authentication
 │
 ▼
JWT Access Token
 │
 └── Refresh Token
        │
        ▼
   HTTP-only Cookie
```

### Google OAuth

```text
Frontend
   │
   ▼
Google OAuth
   │
   ▼
Backend Callback
   │
   ▼
Authentication Tokens
   │
   ▼
Frontend Auth Callback
   │
   ▼
Authenticated Application
```

---

## Repository

[GitHub Repository](https://github.com/Soumyajitttt/Split.ly)

---

## License

This project is licensed under the MIT License.
```
