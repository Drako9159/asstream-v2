-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create table for categories
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text
);

alter table public.categories enable row level security;

create policy "Users can view their own categories" on public.categories
  for select using ((select auth.uid()) = user_id);

create policy "Users can insert their own categories" on public.categories
  for insert with check ((select auth.uid()) = user_id);

create policy "Users can update their own categories" on public.categories
  for update using ((select auth.uid()) = user_id);

create policy "Users can delete their own categories" on public.categories
  for delete using ((select auth.uid()) = user_id);

-- Extra policy for API Access
create policy "Public can view categories" on public.categories
  for select using (auth.role() = 'anon');


-- Create table for channels
create table public.channels (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references public.categories on delete cascade not null,
  title text not null,
  description text,
  poster_url text,
  banner_url text,
  source_url text not null,
  is_active boolean default true,
  quality text check (quality in ('SD', 'HD', 'FHD')) default 'HD',
  is_streaming boolean default true
);

alter table public.channels enable row level security;

create policy "Users can view their own channels" on public.channels
  for select using ((select auth.uid()) = user_id);

create policy "Users can insert their own channels" on public.channels
  for insert with check ((select auth.uid()) = user_id);

create policy "Users can update their own channels" on public.channels
  for update using ((select auth.uid()) = user_id);

create policy "Users can delete their own channels" on public.channels
  for delete using ((select auth.uid()) = user_id);

-- Extra policy for API Access
create policy "Public can view active channels" on public.channels
  for select using (is_active = true and auth.role() = 'anon');

------------------------------------------------------------

-- 1. Tabla para configuraciones generales (como las categorías permitidas)
CREATE TABLE IF NOT EXISTS public.external_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL, -- Ej: 'allowed_categories'
  value JSONB NOT NULL, -- Ej: ["family", "movies"]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, key)
);
   
-- 2. Tabla para la lista blanca de canales de IPTV-ORG
CREATE TABLE IF NOT EXISTS public.external_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  external_id TEXT NOT NULL, -- El ID que viene de la API (ej: 'Antena3.es')
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, external_id)
);
   
-- Habilitar RLS
ALTER TABLE public.external_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_channels ENABLE ROW LEVEL SECURITY;
   
-- Políticas para external_settings
CREATE POLICY "Users can manage their own external settings" ON
  public.external_settings
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view external settings" ON public.external_settings
  FOR SELECT USING (auth.role() = 'anon');

-- Políticas para external_channels
CREATE POLICY "Users can manage their own external channels" ON
  public.external_channels
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view external channels" ON public.external_channels
   FOR SELECT USING (auth.role() = 'anon');