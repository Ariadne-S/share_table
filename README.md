# ShareTable

A multi-user collaborative table application for tracking shopping lists, TV shows, to-do lists, and more. Share a link with others to edit in real time. No authentication required.

**License:** MIT – see [LICENSE](LICENSE).

## Tech Stack

- **Backend**: Java 17, Spring Boot 3.2, PostgreSQL, Flyway, STOMP/WebSocket
- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS v4
- **Real-time**: STOMP over WebSocket (SockJS)

## Project Structure

```
share_table/
├── backend/              # Spring Boot API
│   └── src/main/java/com/sharetable/
│       ├── config/       # Web, WebSocket, CORS
│       ├── controller/   # REST endpoints
│       ├── domain/       # JPA entities (Table, Column, Row, Cell)
│       ├── dto/          # Request/response DTOs
│       ├── repository/   # JPA repositories
│       └── service/      # Business logic
├── frontend/             # React SPA
│   └── src/
│       ├── components/   # Layout, ThemeToggle, Skeleton, etc.
│       ├── contexts/    # Theme, Toast
│       ├── hooks/       # useTableWebSocket, useDebouncedCallback
│       └── pages/       # TablesList, CreateTable, TableView
├── docker-compose.yml
└── README.md
```

## One-Command Startup

```bash
docker compose up --build
```

- **App**: http://localhost
- **API**: http://localhost:8080 (proxied at /api when using nginx)

Starts PostgreSQL, Spring Boot backend, and frontend (built and served by nginx).

## Getting Started (Development)

### Prerequisites

- Java 17+
- Node 18+
- PostgreSQL (or Docker)

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

Open the app at the URL Vite prints (default http://localhost:5180).

### Database

Default connection (in `application.properties`):

- URL: `jdbc:postgresql://localhost:5432/sharetable`
- User: `postgres` (override with `SPRING_DATASOURCE_USERNAME`)
- Password: `postgres` (override with `SPRING_DATASOURCE_PASSWORD`)

**macOS Homebrew PostgreSQL:** The default role is often your system username. Run with:

```bash
SPRING_DATASOURCE_USERNAME=$(whoami) SPRING_DATASOURCE_PASSWORD= ./mvnw spring-boot:run
```

Or create the database and role:

```bash
createuser -s postgres
createdb sharetable
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tables` | List all tables |
| POST | `/tables` | Create table |
| GET | `/tables/{shareToken}` | Get table by share token |
| DELETE | `/tables/{shareToken}` | Soft-delete table |
| POST | `/tables/{shareToken}/rows` | Add row |
| DELETE | `/tables/{shareToken}/rows/{rowId}` | Delete row |
| PATCH | `/tables/{shareToken}/rows/{rowId}/cells` | Update cell values |
| POST | `/tables/{shareToken}/columns` | Add column |
| PATCH | `/tables/{shareToken}/columns/reorder` | Reorder columns |
| PATCH | `/tables/{shareToken}/columns/{columnId}` | Update column |
| DELETE | `/tables/{shareToken}/columns/{columnId}` | Delete column |

WebSocket: connect to `/ws`, subscribe to `/topic/tables/{shareToken}` for real-time updates.

## Development

- **CI** (backend + frontend): `./ci.sh`
- **Backend tests**: `cd backend && ./mvnw test`
- **Backend format**: `cd backend && ./mvnw spotless:apply` (check: `spotless:check`)
- **Frontend build**: `cd frontend && npm run build`
- **Frontend check**: `cd frontend && npm run check` (typecheck + lint + format)
- **Frontend format**: `cd frontend && npm run format`
- **EditorConfig**: `.editorconfig` enforces indentation and line endings
- **Health check**: http://localhost:8080/actuator/health

## Features

- **Tables**: Create, list, soft-delete. Share via link (share token).
- **Columns**: Add, edit, delete, reorder (drag-and-drop). Types: string, number, date, datetime, time, boolean, url, email, currency, enum.
- **Rows & cells**: Add rows, edit cells with type-aware inputs, delete rows. Debounced saves (400ms).
- **Real-time**: WebSocket broadcasts changes to all viewers.
- **UI**: Light/dark mode, loading skeletons, per-page error boundaries, offline indicator.
- **Undo**: Toast with Undo for row/column delete.
- **Export**: CSV or JSON.
- **Search/filter**: Filter rows by cell content.
- **Keyboard**: Ctrl+Enter adds row, Escape exits edit.
