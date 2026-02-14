# Belgaum Today
<<<<<<< HEAD
=======

A modern news aggregator platform built with Next.js 14, focusing on local and national news from Belgaum and India.

## Features

### Frontend

- **Homepage** with featured article hero and latest news grid
- **Category Pages** for India, Business, Technology, Entertainment, Sports, and Belgaum
- **Article Detail Pages** with markdown content, source attribution, share buttons
- **Advanced Search** with filters (category, date range, sort) and search history
- **Dark Mode** support with system preference detection
- **Responsive Design** mobile-first approach

### Admin Panel

- **Dashboard** with statistics, charts, and analytics
- **Article Management** with CRUD operations, bulk actions, filtering
- **Article Editor** with markdown support, auto-save, AI metadata display
- **Authentication** with JWT tokens and role-based access

### Technical

- **SEO Optimized** with sitemap, robots.txt, JSON-LD structured data
- **RSS Feed** for content syndication
- **API Routes** for articles, search, authentication, analytics
- **MySQL Database** with connection pooling (Hostinger compatible)
- **Mock Data Fallback** for development without database
>>>>>>> 960856c (feat: add Technology, Entertainment, Sports category pages with 31 RSS feeds)

This main branch is intentionally empty.

<<<<<<< HEAD
The static site backup now lives in the `static-code/` folder. Use it to populate the
`static-code` branch so the backup is available when needed.
=======
### Prerequisites

- Node.js 18+
- MySQL 8.0 (optional for development)

### Installation

```bash
npm install
```

### Configure Environment

Copy `.env.local.example` to `.env.local` and update:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=belgaum_today

JWT_SECRET=your-secure-secret-key

SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Run Database Schema

```sql
-- Execute database/schema.sql in MySQL
mysql -u root -p belgaum_today < database/schema.sql
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # App Router pages
│   ├── api/               # API routes
│   │   ├── articles/      # Article CRUD
│   │   ├── auth/          # Authentication
│   │   ├── search/        # Search API
│   │   └── track/         # Analytics
│   ├── admin/             # Admin panel
│   ├── article/[slug]/    # Article detail
│   ├── [category]/        # Category pages
│   └── search/            # Search page
├── components/
│   ├── articles/          # Article cards, grid
│   ├── layout/            # Header, Footer, Sidebar
│   └── ui/                # Button, Input, Card, etc.
├── lib/
│   ├── auth.ts            # JWT authentication
│   ├── db.ts              # MySQL connection
│   └── utils.ts           # Helper functions
└── types/                 # TypeScript definitions
```

## Demo Credentials

- **Email**: <admin@belgaum.today>
- **Password**: admin123

## Deployment (Hostinger)

1. Build the project locally
2. Upload `.next`, `public`, `node_modules`, `package.json`
3. Configure MySQL database and update environment variables
4. Set up Node.js application in hPanel

## Tech Stack

- **Framework**: Next.js 16 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL 8.0
- **Authentication**: JWT + bcryptjs
- **Charts**: Recharts
- **Markdown**: react-markdown + remark-gfm

## License

MIT
>>>>>>> 960856c (feat: add Technology, Entertainment, Sports category pages with 31 RSS feeds)
