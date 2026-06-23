# SupplyLink AI

AI-powered B2B marketplace connecting manufacturers, wholesalers, distributors, and retailers.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic |
| Database | PostgreSQL |
| Cache | Redis |
| Storage | MinIO (S3-compatible) |
| AI (future) | LangChain, LangGraph, ChromaDB |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

## Quick Start (Docker)

```bash
# 1. Clone and enter the project
cd retail_manufacturer_project

# 2. Copy environment variables
cp .env.example .env

# 3. Start all services
docker compose up --build

# 4. Run database migrations (first time)
docker compose exec api alembic upgrade head
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| MinIO Console | http://localhost:9001 |

## Local Development (without Docker for app code)

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Ensure PostgreSQL and Redis are running (via Docker Compose or locally) and update `.env` accordingly.

## Project Structure

```
├── backend/          # FastAPI application
│   └── app/
│       ├── api/      # HTTP routes & middleware
│       ├── domain/   # Models, enums, repository interfaces
│       ├── schemas/  # Pydantic request/response schemas
│       ├── services/ # Business logic
│       ├── infrastructure/  # DB, storage, cache adapters
│       └── core/     # Security, permissions, exceptions
├── frontend/         # Next.js application
│   └── src/
│       ├── app/      # App Router pages
│       ├── components/
│       └── lib/      # API client, auth utilities
└── docs/             # Architecture & API documentation
```

## API Overview

Base URL: `http://localhost:8000/api/v1`

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | Register user + company |
| `POST /auth/login` | Obtain access & refresh tokens |
| `POST /auth/refresh` | Rotate tokens |
| `POST /auth/logout` | Revoke refresh token |
| `GET /auth/me` | Current user profile |
| `GET /health` | Health check |

Full OpenAPI spec: http://localhost:8000/docs

## Phase 1 Status

This repository contains **scaffolding only** — no business features yet.

- [x] Project structure
- [x] FastAPI app factory + health check
- [x] Database configuration (SQLAlchemy + Alembic)
- [x] Authentication scaffolding (JWT)
- [x] Docker Compose (API, PostgreSQL, Redis, MinIO, Frontend)
- [x] Next.js dashboard placeholders
- [ ] Company profiles (Phase 2)
- [ ] Product catalog (Phase 2)
- [ ] RFQ management (Phase 2)
- [ ] AI features (Phase 4+)

## License

Proprietary — all rights reserved.
