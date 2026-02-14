# ShareTable

A multi-user collaborative table application for tracking shopping lists, TV shows, to-do lists, and more. Real-time sync powered by WebSocket (STOMP).

## Tech Stack

- **Backend**: Java 17, Spring Boot 3, PostgreSQL
- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS v4
- **Real-time**: STOMP over WebSocket (SockJS)

## Project Structure

```
share_table/
├── backend/       # Spring Boot API
├── frontend/      # React SPA
├── docker-compose.yml
└── README.md
```

## One-Command Startup

```bash
docker compose up --build
```

- **App**: http://localhost
- **API**: http://localhost:8080 (or via nginx proxy at /api)

This starts Postgres, the Spring Boot backend, and the frontend (built and served by nginx).

## Getting Started (Development)

### Prerequisites

- Java 17+
- Node 18+
- PostgreSQL (or use Docker)

### 1. Start PostgreSQL

```bash
docker compose up -d postgres
```

Or create a database named `sharetable` manually.

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run
```

API runs at http://localhost:8080

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

**Open the app at the URL Vite prints** (default http://localhost:5180, not 8080)

### Database

Default connection (in `application.properties`):
- URL: `jdbc:postgresql://localhost:5432/sharetable`
- User: `postgres` (override with `SPRING_DATASOURCE_USERNAME`)
- Password: `postgres` (override with `SPRING_DATASOURCE_PASSWORD`)

**macOS Homebrew PostgreSQL:** The default role is often your system username, not `postgres`. Run with:
```bash
SPRING_DATASOURCE_USERNAME=$(whoami) SPRING_DATASOURCE_PASSWORD= ./mvnw spring-boot:run
```
Or create the database and role first:
```bash
createuser -s postgres  # creates postgres superuser
createdb sharetable
```

## Development

- **Backend tests**: `cd backend && ./mvnw test`
- **Backend format**: `cd backend && ./mvnw spotless:apply` (check: `spotless:check`)
- **Frontend build**: `cd frontend && npm run build`
- **Frontend check**: `cd frontend && npm run check` (typecheck + lint + format:check)
- **Frontend format**: `cd frontend && npm run format` (or `format:check` to verify only)
- **EditorConfig**: `.editorconfig` enforces consistent indentation and line endings across editors
- **Health check**: http://localhost:8080/actuator/health

## Features

- Create tables with custom columns
- Add/edit/delete rows and cells
- Share via link (no auth required)
- Real-time updates when multiple users edit
- Light/dark mode toggle
- Loading skeletons
- Undo for row/column delete (via toast)
- Per-page error boundaries
- Offline support (service worker, cached API)
- Debounced cell edits (400ms)
- Column drag-and-drop reordering
- Export to CSV or JSON
- Search/filter rows
- One-command Docker startup
- Keyboard shortcuts (Ctrl+Enter to add row)
