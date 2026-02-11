# Encore Frontend

> Frontend application for **Groupie Tracker / Groupie Tracker Advanced**: artist discovery, concert exploration, authentication flows, and admin interface.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-in%20development-orange)

---

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Project Scope (Frontend)](#project-scope-frontend)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Quality & Tooling](#quality--tooling)
- [Deployment](#deployment)
- [Roadmap (Frontend)](#roadmap-frontend)

---

## About

**Encore Frontend** is the client-side application of the Groupie Tracker project.

Its goals are to:

- Centralize artist and concert discovery in a single UI
- Provide a modern, responsive user experience
- Connect to a REST API backend for auth, artists, albums, concerts, and admin actions
- Prepare the product for production workflows (Sentry, CI/CD, deploy)

---

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- TanStack Router
- TanStack Query

### UI / Forms / Validation

- shadcn/ui (configured)
- React Hook Form
- Zod
- Lucide icons

### Integrations

- Sentry (`@sentry/react`, `@sentry/vite-plugin`)
- Google reCAPTCHA
- OAuth callback flow (Google)

### Maps / Data Visualization

- maplibre-gl + react-map-gl
- chart.js + react-chartjs-2

### Tooling

- ESLint
- Prettier
- GitHub Actions (CI/CD)

---

## Project Scope (Frontend)

This repository covers **frontend concerns only**:

- Routing and page composition
- API consumption
- UI state and interactions
- Auth/token handling on client side
- Visual/admin tooling
- Build/deploy pipeline for the frontend

Backend concerns (database, business logic, API contracts, Stripe server flow, etc.) are intentionally out of scope in this repository.

---

## Features

### User-facing

- Artist discovery page with filtering and sorting
- Search bar across entities (artist / album / track)
- Artist details popup with:
  - Profile information
  - Album and track listing
  - Concert listing
  - Audio preview playback (when available)
- Concert map view with filters (status, artist, date, followed)
- Followed artists page
- Account dashboard and settings pages

### Authentication

- Register with email/password
- Login with email/password
- Google OAuth login callback
- Email verification flow + resend verification
- Forgot password / reset password flow
- Client-side token storage and refresh handling

### Admin

- Admin dashboard route with metrics blocks
- Artist CRUD modal actions
- Concert CRUD modal actions
- User promote/ban actions

### Observability & Delivery

- Sentry runtime initialization
- Optional sourcemap upload in CI build
- CI/CD pipeline with frontend build/lint/test stages
- Production deployment step to Netlify

---

## Project Structure

```text
Encore-Frontend/
├── public/
├── src/
│   ├── components/
│   ├── features/
│   │   ├── artists/
│   │   ├── concerts/
│   │   └── search/
│   ├── integrations/
│   ├── routes/
│   ├── services/
│   ├── lib/
│   └── types/
├── .github/workflows/
├── package.json
└── README.md
