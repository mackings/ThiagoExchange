# Thiago Exchange

P2P crypto-to-cash trading platform with a Go API, MongoDB persistence, Gmail SMTP notifications, and a responsive Next.js + Material UI frontend.

## Structure

- `backend` - Go REST API for auth, rates, trades, admin verification, and receipts.
- `frontend` - Next.js app with mobile-first and desktop layouts.

## Backend

Create `backend/.env` from `backend/.env.example`, then run:

```bash
cd backend
go mod tidy
go run ./cmd/server
```

The API defaults to `http://localhost:8080`.

## Frontend

Create `frontend/.env.local` from `frontend/.env.example`, then run:

```bash
cd frontend
npm install
npm run dev
```

The app defaults to `http://localhost:3000`.

## First Admin

Set `ADMIN_EMAILS` in `backend/.env` to one or more comma-separated emails. Any user registered with one of those emails receives admin permissions after login.

## Deploy to Render

This repo includes a root `render.yaml` Blueprint for two Render web services:

- `thiagoxchange-api` - Go backend from `backend`
- `thiagoxchange-web` - Next.js frontend from `frontend`

Before deploying, push the repo to GitHub/GitLab. In Render, create a new Blueprint from the repo and use the root `render.yaml`.

During Blueprint creation, Render will ask for the secret values marked `sync: false`:

- `MONGODB_URI` - your MongoDB Atlas connection string
- `ADMIN_EMAILS` - comma-separated admin emails
- `SMTP_USER` - Gmail address or SMTP username
- `SMTP_PASS` - SMTP password or Gmail app password

`JWT_SECRET` is generated automatically by Render. If you rename the services or use custom domains, update:

- backend `FRONTEND_URL`
- frontend `NEXT_PUBLIC_API_URL`

The default values assume these Render URLs:

- Frontend: `https://thiagoxchange-web.onrender.com`
- Backend API: `https://thiagoxchange-api.onrender.com/api`
# ThiagoExchange
