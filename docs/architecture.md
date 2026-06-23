# SupplyLink AI — Architecture Overview

See the root [README](../README.md) for setup instructions.

## Backend Layers

| Layer | Path | Responsibility |
|-------|------|----------------|
| Presentation | `app/api/` | HTTP routes, middleware |
| Application | `app/services/` | Business logic orchestration |
| Domain | `app/domain/` | Models, enums, repository interfaces |
| Infrastructure | `app/infrastructure/` | DB, storage, cache adapters |

## Phase 1 Deliverables

- FastAPI app factory with `/health` endpoint
- JWT authentication scaffolding (register, login, refresh, logout, me)
- SQLAlchemy models: `companies`, `users`, `refresh_tokens`
- Alembic migration `001_initial_auth_tables`
- Repository pattern base classes
- Docker Compose stack

## Next Phase

Phase 2 adds company profiles, product catalog, RFQ workflows, messaging, and reviews.
