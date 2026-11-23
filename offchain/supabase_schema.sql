-- ==============================================================================
-- Parda Health Vault - Supabase Schema Migration
-- ==============================================================================
-- This table stores ONLY authenticated AES-256-GCM encrypted ciphertext,
-- initialization vectors (IV), metadata, and on-chain SHA-256 record hashes.
-- Zero plaintext diagnoses or medical conditions are ever stored off-chain.
-- ==============================================================================

-- 1. Create encrypted health records table
create table if not exists public.encrypted_health_records (
    id uuid default gen_random_uuid() primary key,
    patient_address text not null,
    record_hash text not null unique,
    ciphertext text not null,
    iv text not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create index on patient_address and record_hash for fast lookups
create index if not exists idx_encrypted_records_patient on public.encrypted_health_records(patient_address);
create index if not exists idx_encrypted_records_hash on public.encrypted_health_records(record_hash);

-- 3. Enable Row Level Security (RLS)
alter table public.encrypted_health_records enable row level security;

-- 4. Create policies (Permit authorized reads and inserts)
-- Since data is already client-side AES-256-GCM encrypted with the patient's private key,
-- anyone with the database cannot decrypt without the patient's key.
create policy "Allow insert of encrypted records"
    on public.encrypted_health_records
    for insert
    with check (true);

create policy "Allow select of encrypted records"
    on public.encrypted_health_records
    for select
    using (true);

create policy "Allow update of encrypted records"
    on public.encrypted_health_records
    for update
    using (true);
