-- ============================================================
-- DevFinder Supabase Schema
-- Run this in Supabase SQL Editor (Project > SQL Editor > New Query)
-- ============================================================

-- Enable extension for UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    username text unique not null,
    email text unique not null,
    password_hash text not null,
    role text not null default 'user' check (role in ('user','admin')),
    created_at timestamptz default now()
);

-- ============================================================
-- REPOSITORIES
-- ============================================================
create table if not exists repositories (
    id uuid primary key default gen_random_uuid(),
    github_id bigint unique,
    repo_name text not null,
    owner text not null,
    full_name text unique not null,
    description text,
    language text,
    stars integer default 0,
    forks integer default 0,
    url text not null,
    topics jsonb default '[]',
    good_first_issues integer default 0,
    ai_summary text,
    ai_tags jsonb default '[]',
    difficulty text check (difficulty in ('Beginner','Intermediate','Advanced') or difficulty is null),
    skills_required jsonb default '[]',
    tech_stack text,
    learning_value text,
    future_scope text,
    why_contribute text,
    career_relevance text,
    getting_started text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_repositories_language on repositories(language);
create index if not exists idx_repositories_stars on repositories(stars desc);
create index if not exists idx_repositories_difficulty on repositories(difficulty);

-- ============================================================
-- JOBS
-- ============================================================
create table if not exists jobs (
    id uuid primary key default gen_random_uuid(),
    source text not null,
    external_id text,
    title text not null,
    company text,
    location text,
    remote boolean default false,
    tags jsonb default '[]',
    apply_url text not null,
    description text,
    posted_date timestamptz,
    created_at timestamptz default now(),
    unique(source, external_id)
);

create index if not exists idx_jobs_remote on jobs(remote);
create index if not exists idx_jobs_posted on jobs(posted_date desc);

-- ============================================================
-- ALERTS
-- ============================================================
create table if not exists alerts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    language text,
    minimum_stars integer default 0,
    keywords text,
    active boolean default true,
    last_triggered timestamptz,
    created_at timestamptz default now()
);

create index if not exists idx_alerts_user on alerts(user_id);

-- ============================================================
-- SAVED PROJECTS
-- ============================================================
create table if not exists saved_projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    repository_id uuid references repositories(id) on delete cascade,
    created_at timestamptz default now(),
    unique(user_id, repository_id)
);

create index if not exists idx_saved_user on saved_projects(user_id);

-- ============================================================
-- SEARCH ANALYTICS (optional, used by admin stats)
-- ============================================================
create table if not exists searches (
    id uuid primary key default gen_random_uuid(),
    language text,
    keywords text,
    min_stars integer,
    results_count integer,
    created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Since auth is handled by our own FastAPI (custom JWT, not Supabase Auth),
-- access goes through the service_role key from the backend only.
-- RLS is enabled to block direct anon access from the frontend.
-- ============================================================
alter table users enable row level security;
alter table repositories enable row level security;
alter table jobs enable row level security;
alter table alerts enable row level security;
alter table saved_projects enable row level security;
alter table searches enable row level security;

-- Public read access to repositories & jobs (browsing without login)
create policy "Public read repositories" on repositories for select using (true);
create policy "Public read jobs" on jobs for select using (true);

-- No public access to users, alerts, saved_projects, searches
-- (backend uses service_role key which bypasses RLS automatically)
