create extension if not exists vector;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  first_name text,
  last_name text,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do nothing;

create or replace function public.match_document_chunks(query_embedding vector(384), match_count integer, filter_user_id uuid, filter_document_id uuid default null)
returns table (id uuid, document_id uuid, document_name text, content text, page_number integer, section text, similarity float)
language sql stable as $$
  select dc.id, dc.document_id, d.name, dc.content, dc.page_number, dc.section, 1 - (dc.embedding <=> query_embedding)
  from public.document_chunks dc join public.documents d on d.id = dc.document_id
  where dc.user_id = filter_user_id and (filter_document_id is null or dc.document_id = filter_document_id)
  order by dc.embedding <=> query_embedding limit match_count;
$$;

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.usage_logs enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users manage own profiles') then
    create policy "Users manage own profiles" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
  end if;
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
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'usage_logs' and policyname = 'Users manage own usage') then
    create policy "Users manage own usage" on public.usage_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
