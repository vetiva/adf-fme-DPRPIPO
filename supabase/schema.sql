-- Run once in Supabase → SQL Editor → New query → Run
-- Table used by POST /api/v1/student-applications

create extension if not exists "pgcrypto";

create table if not exists public.student_applications (
  id text primary key default gen_random_uuid()::text,
  university text not null,
  matric_number text not null,
  surname text not null,
  verification_status text not null default 'verified',
  verification_payload text,
  government_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_applications_identity_key
    unique (university, matric_number, surname)
);

create index if not exists student_applications_matric_number_idx
  on public.student_applications (matric_number);

alter table public.student_applications enable row level security;

-- No anon/authenticated policies: only the service role (server) can read/write.
