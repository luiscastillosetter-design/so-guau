-- So Guau — esquema Supabase (https://soguau.com)
-- RLS activado: SELECT público solo en catálogo/config pública. Escritura únicamente con service_role (API routes).

create extension if not exists "pgcrypto";

create table if not exists store_settings (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  eslogan text,
  dominio text not null default 'https://soguau.com',
  logo_url text,
  theme_key text not null default 'so-guau',
  whatsapp text,
  pago_movil jsonb default '{}'::jsonb,
  binance jsonb default '{}'::jsonb,
  transferencia jsonb default '{}'::jsonb,
  prompt_bot text,
  created_at timestamptz not null default now()
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  subtitulo text,
  orden int not null default 0,
  activo boolean not null default true
);

create table if not exists product_formats (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  display_mode text not null default 'rack' check (display_mode in ('rack','shelf')),
  orden int not null default 0,
  activo boolean not null default true
);

create table if not exists blank_stock (
  id uuid primary key default gen_random_uuid(),
  format_id uuid not null references product_formats(id) on delete cascade,
  color text not null,
  talla text,
  in_stock boolean not null default true,
  unique (format_id, color, talla)
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id) on delete set null,
  format_id uuid references product_formats(id) on delete set null,
  nombre text not null,
  precio_usd numeric(10,2) not null check (precio_usd >= 0),
  badge text,
  foto_perfil_url text,
  foto_frente_url text,
  foto_espalda_url text,
  colores_json jsonb not null default '[]'::jsonb,
  es_personalizable boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists hero_slides (
  id uuid primary key default gen_random_uuid(),
  media_type text not null default 'image' check (media_type in ('image','video')),
  media_url text not null,
  titulo text,
  subtitulo text,
  cta_texto text,
  cta_link text,
  orden int not null default 0,
  activo boolean not null default true
);

create table if not exists custom_templates (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  modo text not null check (modo in ('gema','torre','editorial','libre')),
  imagen_referencia_url text,
  prompt_sistema text,
  max_fotos int not null default 1,
  activo boolean not null default true
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  cliente_nombre text not null,
  cliente_whatsapp text not null,
  cliente_email text,
  cliente_direccion text,
  items_json jsonb not null default '[]'::jsonb,
  total_usd numeric(10,2) not null,
  tasa_bcv numeric(14,4) not null,
  total_bs numeric(16,2) not null,
  metodo_pago text,
  referencia text,
  comprobante_url text,
  estado text not null default 'por_verificar' check (estado in ('por_verificar','confirmado','en_taller','enviado')),
  created_at timestamptz not null default now()
);

create table if not exists ai_leads (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  whatsapp text,
  ip_hash text not null,
  generaciones_usadas int not null default 0,
  ultima_generacion_at timestamptz
);
create index if not exists ai_leads_ip_hash_idx on ai_leads (ip_hash);

-- RLS
alter table store_settings enable row level security;
alter table departments enable row level security;
alter table product_formats enable row level security;
alter table blank_stock enable row level security;
alter table products enable row level security;
alter table hero_slides enable row level security;
alter table custom_templates enable row level security;
alter table orders enable row level security;
alter table ai_leads enable row level security;

-- Lectura pública (solo catálogo / configuración pública)
create policy "public read store_settings" on store_settings for select using (true);
create policy "public read departments" on departments for select using (activo);
create policy "public read product_formats" on product_formats for select using (activo);
create policy "public read blank_stock" on blank_stock for select using (true);
create policy "public read products" on products for select using (activo);
create policy "public read hero_slides" on hero_slides for select using (activo);
create policy "public read custom_templates" on custom_templates for select using (activo);

-- orders y ai_leads: sin políticas => solo service_role (que omite RLS) puede leer/escribir.
-- Escritura en todas las tablas: solo service_role desde API routes (sin políticas de insert/update/delete).

-- Seed So Guau
insert into store_settings (nombre, eslogan, dominio, theme_key, prompt_bot)
select 'So Guau', 'Moda que deja huellas', 'https://soguau.com', 'so-guau',
       'Eres el asistente de So Guau, tienda de moda para mascotas y sus dueños. Responde en español, cálido y breve.'
where not exists (select 1 from store_settings);

insert into departments (slug, nombre, subtitulo, orden) values
  ('frenchies', 'Frenchies', 'Para los dueños de bulldogs franceses', 1),
  ('perros', 'Perros', 'Moda para tu mejor amigo', 2),
  ('gatos', 'Gatos', 'Elegancia felina', 3),
  ('exoticos', 'Exóticos', 'Mascotas fuera de lo común', 4),
  ('navidad-peluda', 'Navidad Peluda', 'Edición festiva', 5)
on conflict (slug) do nothing;

insert into product_formats (slug, nombre, display_mode, orden) values
  ('franelas', 'Franelas', 'rack', 1),
  ('hoodies', 'Hoodies', 'rack', 2),
  ('gorras', 'Gorras', 'shelf', 3),
  ('tazas', 'Tazas', 'shelf', 4),
  ('coolers', 'Coolers', 'shelf', 5)
on conflict (slug) do nothing;

-- Tarea 3: checkout Venezuela (idempotente)
alter table orders add column if not exists codigo text;
alter table orders add column if not exists metodo_entrega text;
alter table orders add column if not exists ciudad_estado text;
create unique index if not exists orders_codigo_key on orders (codigo);

-- Bucket privado para comprobantes: solo service_role (API /api/orders) escribe y lee.
insert into storage.buckets (id, name, public) values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- Tarea 4: Estudio Personalizador IA (idempotente)
alter table custom_templates add column if not exists slug text;
alter table custom_templates add column if not exists descripcion text;
create unique index if not exists custom_templates_slug_key on custom_templates (slug);

-- Bucket PRIVADO para fotos originales y artes limpios en alta resolución (solo service_role / /admin).
insert into storage.buckets (id, name, public) values ('artes-personalizados', 'artes-personalizados', false)
on conflict (id) do nothing;

-- Tarea 5: Panel /admin — bucket PÚBLICO para logos, fotos de productos, hero y plantillas (idempotente).
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'public read media') then
    create policy "public read media" on storage.objects for select using (bucket_id = 'media');
  end if;
end $$;

insert into custom_templates (slug, nombre, descripcion, modo, max_fotos, prompt_sistema) values
  ('estilo-gema', 'Estilo GEMA', 'Mitad nombre + mitad rostro', 'gema', 1,
   'Create a stylized split-portrait print: the left half of the pet face rendered as a clean illustration and the pet name in tall vertical uppercase letters merged with it. Keep the exact species, markings and colors of the pet in the photo.'),
  ('torre-de-mascotas', 'Torre de Mascotas', 'Less people, more dogs', 'torre', 3,
   'Create a clean illustrated vertical stack (tower) of the pets from the photos, one on top of another, in a modern flat illustration style. Keep the exact species, markings and colors of each pet. Optional short text above or below.'),
  ('editorial-pet-parent', 'Editorial Pet Parent', 'Cat Mom / Dog Dad en alto contraste', 'editorial', 1,
   'Create a high-contrast editorial graphic of the pet in the photo with large repeated background typography and the custom text prominently integrated. Keep the exact species and markings of the pet.'),
  ('diseno-libre', 'Diseño Libre DTF', 'Sube tu propia imagen o logo', 'libre', 1,
   'Clean up the uploaded image or logo for DTF printing: isolate the subject, sharpen edges and keep the original design and colors faithful without adding new elements.')
on conflict (slug) do nothing;
