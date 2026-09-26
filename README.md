# Resume

> A Next.js API route that aggregates posts from Reddit, Hacker News, GitHub Issues, ProductHunt, and Stack Overflow into a single Supabase database — designed to power a personal resume or portfolio feed.

![Next.js 14+](https://img.shields.io/badge/Next.js-14%2B-000?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)
![license](https://img.shields.io/badge/license-ISC-blue)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [License](#license)

## Overview

Resume is a serverless data collector built as a Next.js API route. It fetches your public activity from five platforms, normalizes the data into a unified schema, and upserts it into a Supabase PostgreSQL table. The collected data can then be used to populate a personal resume, portfolio, or activity feed.

## Features

- **Multi-Source Aggregation** — Pulls data from Reddit, Hacker News, GitHub, ProductHunt, and Stack Overflow in a single request
- **Batched Upserts** — Inserts posts in configurable batches of 100 to avoid payload limits
- **Conflict Resolution** — Uses Supabase upsert with composite key (`source`, `external_id`) to prevent duplicates
- **Error Isolation** — Each source is fetched independently so one failure does not block the others
- **Warning Tracking** — Non-fatal issues from each fetcher are captured and returned in the response
- **Cron-Ready** — Secured with a `CRON_SECRET` bearer token so it can be triggered by Vercel Cron or any scheduler
- **Detailed Response** — Returns per-source stats including post count, inserted count, errors, and warnings

## Tech Stack

| Layer        | Technology          |
|--------------|---------------------|
| Framework    | Next.js 14+         |
| Language     | TypeScript          |
| Database     | Supabase PostgreSQL |
| Hosting      | Vercel (serverless) |
| Auth         | Bearer token        |

## How It Works

1. A scheduled cron job or manual request hits `GET /api/collect` with a bearer token.
2. The route iterates over five enabled sources (Reddit, Hacker News, GitHub, ProductHunt, Stack Overflow).
3. Each source's fetcher retrieves posts and returns them in a normalized `RawPost` format.
4. Posts are batched into groups of 100 and upserted into the `raw_posts` table in Supabase.
5. A JSON response is returned with per-source statistics.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Supabase](https://supabase.com/) project with a PostgreSQL database
- npm (comes with Node.js)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Kumar44developer/resume.git
cd resume
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a `.env.local` file in the root directory

```bash
cp .env.example .env.local
```

### 4. Update environment variables with your Supabase credentials

See the [Environment Variables](#environment-variables) section below.

### 5. Start the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/collect`.

## Environment Variables

| Variable              | Description                              | Required |
|-----------------------|------------------------------------------|----------|
| `SUPABASE_URL`        | Your Supabase project URL                | Yes      |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (admin access) | Yes      |
| `CRON_SECRET`         | Bearer token to authorize the API route  | Yes      |
| `REDDIT_CLIENT_ID`    | Reddit API client ID                     | Yes      |
| `REDDIT_CLIENT_SECRET` | Reddit API client secret                | Yes      |
| `GITHUB_TOKEN`        | GitHub personal access token             | Yes      |
| `PRODUCTHUNT_TOKEN`   | ProductHunt developer token              | Yes      |

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
CRON_SECRET=your_cron_secret_here
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
GITHUB_TOKEN=ghp_your_github_token
PRODUCTHUNT_TOKEN=your_producthunt_token
```

## Database Setup

1. Go to your Supabase dashboard and open the SQL Editor.

2. Create the `raw_posts` table:

```sql
CREATE TABLE raw_posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT,
  body TEXT,
  url TEXT,
  author TEXT,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  fetched_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  UNIQUE (source, external_id)
);
```

3. Create an index for faster lookups:

```sql
CREATE INDEX idx_raw_posts_source ON raw_posts (source);
```

## Usage

### Manual Trigger

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/collect
```

### Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/collect",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This triggers the collector every 6 hours.

## API Reference

| Method | Route           | Description                                         |
|--------|-----------------|-----------------------------------------------------|
| GET    | `/api/collect`  | Fetches posts from all sources and upserts to Supabase |

### Request Headers

| Header          | Value                    |
|-----------------|--------------------------|
| `Authorization` | `Bearer YOUR_CRON_SECRET` |

### Response Format

```json
{
  "ok": true,
  "results": {
    "reddit": {
      "posts": 25,
      "inserted": 25,
      "errors": [],
      "warnings": []
    },
    "hn": {
      "posts": 30,
      "inserted": 28,
      "errors": [],
      "warnings": ["2 duplicate posts skipped"]
    },
    "github": {
      "posts": 15,
      "inserted": 15,
      "errors": [],
      "warnings": []
    },
    "producthunt": {
      "posts": 10,
      "inserted": 10,
      "errors": [],
      "warnings": []
    },
    "stackoverflow": {
      "posts": 20,
      "inserted": 20,
      "errors": [],
      "warnings": []
    }
  }
}
```

## Project Structure

```
resume/
├── api/
│   └── collect/
│       └── route.ts        
├── lib/
│   ├── supabase/
│   │   └── server.ts      
│   └── fetchers/
│       ├── types.ts        
│       ├── reddit.ts        
│       ├── hackernews.ts    
│       ├── github.ts        
│       ├── producthunt.ts   
│       └── stackoverflow.ts 
├── .env.local               
├── .gitignore               
├── package.json            
└── README.md               
```

## Data Sources

| Source         | What It Fetches             | Fetcher Function                 |
|----------------|-----------------------------|----------------------------------|
| Reddit         | Posts from configured subs   | `fetchRedditPosts()`             |
| Hacker News    | Top and new stories          | `fetchHackerNewsPosts()`         |
| GitHub         | Issues from tracked repos    | `fetchGithubIssues()`            |
| ProductHunt    | Comments on featured posts   | `fetchProductHuntComments()`     |
| Stack Overflow | Questions by tag or user     | `fetchStackOverflowQuestions()`  |

## License

ISC
