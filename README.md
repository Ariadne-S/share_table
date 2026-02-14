# ShareTable

A multi-user collaborative table application for tracking shopping lists, TV shows, to-do lists, and more. Real-time sync powered by WebSocket (STOMP).

## Tech Stack

- **Backend**: Java 17, Spring Boot 3, PostgreSQL
- **Frontend**: React 18, TypeScript, Vite
- **Real-time**: STOMP over WebSocket (SockJS)

## Project Structure

```
share_table/
├── backend/       # Spring Boot API
├── frontend/      # React SPA
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Java 17+
- Node 18+
- PostgreSQL (or use Docker)

### 1. Start PostgreSQL

```bash
docker compose up -d
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
- **Frontend build**: `cd frontend && npm run build`
- **Health check**: http://localhost:8080/actuator/health

## Features

- Create tables with custom columns
- Add/edit/delete rows and cells
- Share via link (no auth required)
- Real-time updates when multiple users edit
