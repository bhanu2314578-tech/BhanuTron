create extension if not exists vector;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  first_name text,
  last_name text,
  role text not null default 'member',
  job_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists job_title text;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null,
  file_type text not null check (file_type in ('pdf', 'docx', 'txt')),
  size_bytes bigint not null default 0,
  pages integer not null default 0,
  status text not null default 'processing' check (status in ('processed', 'processing', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  page_number integer,
  section text,
  chunk_index integer not null,
  embedding vector(384),
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_embedding_idx on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists document_chunks_user_document_idx on public.document_chunks (user_id, document_id);
create index if not exists documents_user_created_idx on public.documents (user_id, created_at desc);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb,
  tokens_used integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  tokens_used integer not null default 0,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversations_user_updated_idx on public.conversations (user_id, updated_at desc);
create index if not exists messages_user_conversation_idx on public.messages (user_id, conversation_id, created_at);
create index if not exists usage_logs_user_created_idx on public.usage_logs (user_id, created_at desc);

insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do nothing;

create or replace function public.match_document_chunks(query_embedding vector(384), match_count integer, filter_user_id uuid, filter_document_id uuid default null)
returns table (id uuid, document_id uuid, document_name text, content text, page_number integer, section text, similarity float)
language sql stable as $$
  select dc.id, dc.document_id, d.name, dc.content, dc.page_number, dc.section, 1 - (dc.embedding <=> query_embedding)
  from public.document_chunks dc join public.documents d on d.id = dc.document_id
  where dc.user_id = filter_user_id
    and d.status = 'processed'
    and (filter_document_id is null or dc.document_id = filter_document_id)
  order by dc.embedding <=> query_embedding limit match_count;
$$;

revoke all on function public.match_document_chunks(vector, integer, uuid, uuid) from public, anon, authenticated;
grant execute on function public.match_document_chunks(vector, integer, uuid, uuid) to service_role;

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.usage_logs enable row level security;

drop policy if exists "Users manage own profiles" on public.profiles;
drop policy if exists "Users read own profiles" on public.profiles;
create policy "Users read own profiles" on public.profiles for select using (auth.uid() = id);
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "Users manage own usage" on public.usage_logs;
drop policy if exists "Users read own usage" on public.usage_logs;
create policy "Users read own usage" on public.usage_logs for select using (auth.uid() = user_id);
revoke all on public.usage_logs from anon, authenticated;
grant select on public.usage_logs to authenticated;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'documents' and policyname = 'Users manage own documents') then
    create policy "Users manage own documents" on public.documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'document_chunks' and policyname = 'Users manage own chunks') then
    create policy "Users manage own chunks" on public.document_chunks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'conversations' and policyname = 'Users manage own conversations') then
    create policy "Users manage own conversations" on public.conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'Users manage own messages') then
    create policy "Users manage own messages" on public.messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
