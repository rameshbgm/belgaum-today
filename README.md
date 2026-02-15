# Belgaum Today

AI-powered, automated news aggregation platform for the Belgaum (Belagavi) region and India.

## Documentation

Full project documentation is available in the `docs/` directory:

- [**System Design**](docs/01-system-design.md) — Architecture, tech stack, data flow
- [**Components**](docs/02-components.md) — Frontend components, pages, responsibilities
- [**Requirements**](docs/03-requirements.md) — Functional specs, user roles
- [**Technical Guide**](docs/04-technical.md) — Deep dive into implementation details
- [**Database Schema**](docs/06-database-design.md) — ER diagram, tables, relationships
- [**API Reference**](docs/07-crons-apis-agents.md) — API routes, cron jobs, AI agents
- [**Setup Guide**](docs/08-setup.md) — Installation, configuration, deployment

## Quick Start

```bash
# Install dependencies
npm install

# Start database (Docker)
docker compose up -d

# Run development server
npm run dev
```

Visit `http://localhost:3000` for the public site.
Visit `http://localhost:3000/admin/login` for the admin panel.
