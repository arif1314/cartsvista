-- CartsVista production foundation schema
-- Apply this in Supabase SQL editor before enabling the new secure API flows.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('super_admin', 'admin', 'manager', 'support', 'customer');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'refunded');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'refunded');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.ticket_status as enum ('Open', 'Replied', 'Closed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  phone text,
  role public.app_role not null default 'customer',
  status text not null default 'active',
  shipping_address jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role public.app_role not null default 'customer';
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists shipping_address jsonb;
alter table public.profiles add column if not exists created_at timestamptz not null default timezone('utc'::text, now());
alter table public.profiles add column if not exists updated_at timestamptz not null default timezone('utc'::text, now());

alter table public.profiles
drop constraint if exists profiles_status_check;

alter table public.profiles
add constraint profiles_status_check check (status in ('active', 'inactive', 'suspended'));

create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.categories add column if not exists parent_id uuid references public.categories(id) on delete set null;
alter table public.categories add column if not exists name text;
alter table public.categories add column if not exists slug text;
alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists is_active boolean not null default true;
alter table public.categories add column if not exists sort_order integer not null default 0;
alter table public.categories add column if not exists created_at timestamptz not null default timezone('utc'::text, now());
alter table public.categories add column if not exists updated_at timestamptz not null default timezone('utc'::text, now());

update public.categories
set name = coalesce(name, slug, 'Category')
where name is null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'categories'
      and column_name = 'title'
  ) then
    update public.categories
    set title = coalesce(title, name, slug, 'Category')
    where title is null;

    alter table public.categories
    alter column title set default 'Category';

    alter table public.categories
    alter column title drop not null;
  end if;
end $$;

alter table public.categories
drop constraint if exists categories_slug_key;

alter table public.categories
add constraint categories_slug_key unique (slug);

create table if not exists public.brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.brands add column if not exists name text;
alter table public.brands add column if not exists slug text;
alter table public.brands add column if not exists logo_url text;
alter table public.brands add column if not exists is_active boolean not null default true;
alter table public.brands add column if not exists created_at timestamptz not null default timezone('utc'::text, now());

update public.brands
set name = coalesce(name, slug, 'Brand')
where name is null;

alter table public.brands
drop constraint if exists brands_slug_key;

alter table public.brands
add constraint brands_slug_key unique (slug);

create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique,
  description text,
  price numeric(12,2) not null check (price >= 0),
  discount_price numeric(12,2) check (discount_price is null or discount_price >= 0),
  category text not null,
  category_id uuid references public.categories(id) on delete set null,
  subcategory text,
  brand_id uuid references public.brands(id) on delete set null,
  images text[] not null default '{}',
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sku text unique,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.products add column if not exists slug text;
alter table public.products add column if not exists category_id uuid references public.categories(id) on delete set null;
alter table public.products add column if not exists brand_id uuid references public.brands(id) on delete set null;
alter table public.products add column if not exists status text not null default 'published';
alter table public.products add column if not exists sku text;
alter table public.products add column if not exists updated_at timestamptz not null default timezone('utc'::text, now());
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists images text[] not null default '{}';
alter table public.products add column if not exists sizes text[] not null default '{}';
alter table public.products add column if not exists colors text[] not null default '{}';

alter table public.products
drop constraint if exists products_status_check;

alter table public.products
add constraint products_status_check check (status in ('draft', 'published', 'archived'));

create table if not exists public.product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size text,
  color text,
  price numeric(12,2),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text default 'Home',
  full_name text,
  phone text,
  line1 text not null,
  line2 text,
  city text not null,
  postal_code text,
  country text not null default 'Bangladesh',
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  customer_email text,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  subtotal_amount numeric(12,2) not null default 0 check (subtotal_amount >= 0),
  shipping_amount numeric(12,2) not null default 0 check (shipping_amount >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  shipping_address jsonb,
  payment_method text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.orders
add column if not exists tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0);

alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists subtotal_amount numeric(12,2) not null default 0 check (subtotal_amount >= 0);
alter table public.orders add column if not exists shipping_amount numeric(12,2) not null default 0 check (shipping_amount >= 0);
alter table public.orders add column if not exists discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0);
alter table public.orders add column if not exists payment_status public.payment_status not null default 'unpaid';
alter table public.orders add column if not exists updated_at timestamptz not null default timezone('utc'::text, now());

create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text,
  quantity integer not null check (quantity > 0),
  size text,
  color text,
  price numeric(12,2) not null check (price >= 0)
);

alter table public.order_items add column if not exists variant_id uuid references public.product_variants(id) on delete set null;
alter table public.order_items add column if not exists product_name text;

create table if not exists public.stock_movements (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  movement_type text not null check (movement_type in ('initial', 'sale', 'return', 'manual_adjustment', 'correction')),
  delta integer not null,
  previous_stock integer not null,
  new_stock integer not null,
  note text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_reference text,
  amount numeric(12,2) not null check (amount >= 0),
  status public.payment_status not null default 'pending',
  raw_payload jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.payment_events (
  id uuid default gen_random_uuid() primary key,
  payment_id uuid references public.payments(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  event_type text not null,
  provider text,
  provider_reference text,
  status public.payment_status,
  raw_payload jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.order_requests (
  id uuid default gen_random_uuid() primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  request_type text not null check (request_type in ('cancel', 'refund')),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'resolved')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.order_status_events (
  id uuid default gen_random_uuid() primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('fixed', 'percentage')),
  discount_value numeric(12,2) not null check (discount_value >= 0),
  min_order_amount numeric(12,2) not null default 0 check (min_order_amount >= 0),
  max_discount_amount numeric(12,2),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  used_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.wishlist_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, product_id)
);

create table if not exists public.support_tickets (
  id text primary key default ('TCK-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8))),
  user_id uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  user_name text not null,
  user_email text not null,
  subject text not null,
  message text not null,
  status public.ticket_status not null default 'Open',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.support_tickets
add column if not exists assigned_to uuid references public.profiles(id) on delete set null;

alter table public.support_tickets
add column if not exists order_id uuid references public.orders(id) on delete set null;

alter table public.support_tickets
add column if not exists priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent'));

alter table public.support_tickets
add column if not exists metadata jsonb not null default '{}';

create table if not exists public.ticket_replies (
  id text primary key default ('RPL-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8))),
  ticket_id text not null references public.support_tickets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_role text not null check (author_role in ('Admin', 'Customer')),
  message text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.support_ticket_notes (
  id text primary key default ('NT-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8))),
  ticket_id text not null references public.support_tickets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  note text not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.notification_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms', 'system')),
  recipient text,
  subject text,
  message text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_stock_movements_product_id on public.stock_movements(product_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_payments_order_id on public.payments(order_id);
create index if not exists idx_payment_events_order_id on public.payment_events(order_id);
create index if not exists idx_order_requests_order_id on public.order_requests(order_id);
create index if not exists idx_order_status_events_order_id on public.order_status_events(order_id);
create index if not exists idx_notification_logs_order_id on public.notification_logs(order_id);
create index if not exists idx_coupons_code on public.coupons(code);
create index if not exists idx_wishlist_items_user_id on public.wishlist_items(user_id);
create index if not exists idx_support_tickets_user_id on public.support_tickets(user_id);
create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_assigned_to on public.support_tickets(assigned_to);
create index if not exists idx_ticket_replies_ticket_id on public.ticket_replies(ticket_id);
create index if not exists idx_support_ticket_notes_ticket_id on public.support_ticket_notes(ticket_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_products_updated_at on public.products;
create trigger touch_products_updated_at before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists touch_orders_updated_at on public.orders;
create trigger touch_orders_updated_at before update on public.orders
for each row execute function public.touch_updated_at();

drop trigger if exists touch_order_requests_updated_at on public.order_requests;
create trigger touch_order_requests_updated_at before update on public.order_requests
for each row execute function public.touch_updated_at();

drop trigger if exists touch_support_tickets_updated_at on public.support_tickets;
create trigger touch_support_tickets_updated_at before update on public.support_tickets
for each row execute function public.touch_updated_at();

drop trigger if exists touch_store_settings_updated_at on public.store_settings;
create trigger touch_store_settings_updated_at before update on public.store_settings
for each row execute function public.touch_updated_at();

insert into public.store_settings (key, value)
values (
  'shipping',
  jsonb_build_object(
    'defaultShippingAmount', 10,
    'freeShippingThreshold', 100,
    'insideDhakaAmount', 5,
    'outsideDhakaAmount', 10
  )
)
on conflict (key) do nothing;

insert into public.store_settings (key, value)
values
  (
    'store',
    jsonb_build_object(
      'storeName', 'CartsVista',
      'tagline', 'Premium fashion and lifestyle commerce',
      'supportEmail', 'support@cartsvista.com',
      'supportPhone', '+880 1700-000000',
      'address', 'Dhaka, Bangladesh',
      'currency', 'USD'
    )
  ),
  (
    'payment',
    jsonb_build_object(
      'cod', true,
      'bkash', true,
      'nagad', true,
      'card', false,
      'stripe', jsonb_build_object(
        'enabled', false,
        'mode', 'test',
        'publishableKey', '',
        'secretKey', '',
        'webhookSecret', '',
        'currency', 'usd',
        'exchangeRate', 1
      ),
      'instructions', jsonb_build_object(
        'cod', 'Pay with cash when the order is delivered.',
        'bkash', 'bKash payment will be confirmed manually after order placement.',
        'nagad', 'Nagad payment will be confirmed manually after order placement.',
        'card', 'Card gateway credentials can be connected when the provider account is ready.',
        'stripe', 'Pay securely by card through Stripe Checkout.'
      )
    )
  ),
  (
    'tax',
    jsonb_build_object('enabled', false, 'label', 'VAT', 'rate', 0)
  ),
  (
    'invoice',
    jsonb_build_object(
      'prefix', 'CV',
      'footerNote', 'Thank you for shopping with CartsVista.',
      'showSupportContact', true
    )
  ),
  (
    'notification',
    jsonb_build_object(
      'orderEmail', true,
      'orderSms', false,
      'adminEmail', '',
      'emailProvider', 'resend',
      'resendApiKey', '',
      'emailFrom', 'CartsVista <onboarding@resend.dev>',
      'smsProvider', 'twilio',
      'twilioAccountSid', '',
      'twilioAuthToken', '',
      'twilioFromNumber', ''
    )
  )
on conflict (key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into public.categories (name, slug, sort_order)
values
  ('Menswear', 'men', 10),
  ('Womenswear', 'women', 20),
  ('Kids Collection', 'kids', 30),
  ('Accessories', 'accessories', 40)
on conflict (slug) do nothing;

insert into public.categories (name, slug, parent_id, sort_order)
values
  ('Panjabi', 'panjabi', (select id from public.categories where slug = 'men'), 10),
  ('Thobe & Jubba', 'thobe-jubba', (select id from public.categories where slug = 'men'), 20),
  ('Koti & Waistcoat', 'koti-waistcoat', (select id from public.categories where slug = 'men'), 30),
  ('Footwear', 'footwear', (select id from public.categories where slug = 'men'), 40),
  ('Abaya & Burkha', 'abaya-burkha', (select id from public.categories where slug = 'women'), 10),
  ('Premium Hijab', 'premium-hijab', (select id from public.categories where slug = 'women'), 20),
  ('Salwar Kameez', 'salwar-kameez', (select id from public.categories where slug = 'women'), 30),
  ('Jewelry', 'jewelry', (select id from public.categories where slug = 'women'), 40),
  ('Boys Panjabi', 'boys-panjabi', (select id from public.categories where slug = 'kids'), 10),
  ('Girls Dress', 'girls-dress', (select id from public.categories where slug = 'kids'), 20),
  ('Newborn', 'newborn', (select id from public.categories where slug = 'kids'), 30),
  ('Perfume & Attar', 'perfume-attar', (select id from public.categories where slug = 'accessories'), 10),
  ('Premium Caps', 'premium-caps', (select id from public.categories where slug = 'accessories'), 20),
  ('Tasbih', 'tasbih', (select id from public.categories where slug = 'accessories'), 30)
on conflict (slug) do nothing;

insert into public.brands (name, slug)
values ('CartsVista', 'cartsvista')
on conflict (slug) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "Profiles are visible to owners and staff" on public.profiles;
drop policy if exists "Profiles are editable by owner or admin" on public.profiles;
drop policy if exists "Published products are public" on public.products;
drop policy if exists "Staff can manage products" on public.products;
drop policy if exists "Product images are publicly readable" on storage.objects;
drop policy if exists "Staff can upload product images" on storage.objects;
drop policy if exists "Staff can update product images" on storage.objects;
drop policy if exists "Staff can delete product images" on storage.objects;
drop policy if exists "Staff can view stock movements" on public.stock_movements;
drop policy if exists "Staff can manage stock movements" on public.stock_movements;
drop policy if exists "Categories are public" on public.categories;
drop policy if exists "Staff can manage categories" on public.categories;
drop policy if exists "Active brands are public" on public.brands;
drop policy if exists "Staff can manage brands" on public.brands;
drop policy if exists "Users can view own orders and staff can view all" on public.orders;
drop policy if exists "Staff can manage orders" on public.orders;
drop policy if exists "Users can view own payments and staff can view all" on public.payments;
drop policy if exists "Staff can manage payments" on public.payments;
drop policy if exists "Users can view own notifications and staff can view all" on public.notification_logs;
drop policy if exists "Staff can manage notification logs" on public.notification_logs;
drop policy if exists "Users can view own order requests and staff can view all" on public.order_requests;
drop policy if exists "Users can create own order requests" on public.order_requests;
drop policy if exists "Staff can manage order requests" on public.order_requests;
drop policy if exists "Users can view own order events and staff can view all" on public.order_status_events;
drop policy if exists "Staff can manage order events" on public.order_status_events;
drop policy if exists "Active coupons are readable" on public.coupons;
drop policy if exists "Staff can manage coupons" on public.coupons;
drop policy if exists "Store settings are readable" on public.store_settings;
drop policy if exists "Staff can manage store settings" on public.store_settings;
drop policy if exists "Users can manage own wishlist" on public.wishlist_items;
drop policy if exists "Users can view own tickets and staff can view all" on public.support_tickets;
drop policy if exists "Authenticated users can create tickets" on public.support_tickets;
drop policy if exists "Staff can update tickets" on public.support_tickets;
drop policy if exists "Users can view own ticket replies and staff can view all" on public.ticket_replies;
drop policy if exists "Authenticated participants can create ticket replies" on public.ticket_replies;
drop policy if exists "Staff can view ticket internal notes" on public.support_ticket_notes;
drop policy if exists "Staff can create ticket internal notes" on public.support_ticket_notes;
drop function if exists public.current_user_role() cascade;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.stock_movements enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.order_requests enable row level security;
alter table public.order_status_events enable row level security;
alter table public.coupons enable row level security;
alter table public.store_settings enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_replies enable row level security;
alter table public.support_ticket_notes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notification_logs enable row level security;

drop policy if exists "Profiles are visible to owners and staff" on public.profiles;
create policy "Profiles are visible to owners and staff" on public.profiles
for select using (id = auth.uid() or public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'));

drop policy if exists "Profiles are editable by owner or admin" on public.profiles;
create policy "Profiles are editable by owner or admin" on public.profiles
for update using (id = auth.uid() or public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Published products are public" on public.products;
create policy "Published products are public" on public.products
for select using (status = 'published' or public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists "Staff can manage products" on public.products;
create policy "Staff can manage products" on public.products
for all using (public.current_user_role() in ('super_admin', 'admin', 'manager'))
with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists "Product images are publicly readable" on storage.objects;
create policy "Product images are publicly readable" on storage.objects
for select using (bucket_id = 'product-images');

drop policy if exists "Staff can upload product images" on storage.objects;
create policy "Staff can upload product images" on storage.objects
for insert with check (
  bucket_id = 'product-images'
  and public.current_user_role() in ('super_admin', 'admin', 'manager')
);

drop policy if exists "Staff can update product images" on storage.objects;
create policy "Staff can update product images" on storage.objects
for update using (
  bucket_id = 'product-images'
  and public.current_user_role() in ('super_admin', 'admin', 'manager')
)
with check (
  bucket_id = 'product-images'
  and public.current_user_role() in ('super_admin', 'admin', 'manager')
);

drop policy if exists "Staff can delete product images" on storage.objects;
create policy "Staff can delete product images" on storage.objects
for delete using (
  bucket_id = 'product-images'
  and public.current_user_role() in ('super_admin', 'admin', 'manager')
);

drop policy if exists "Staff can view stock movements" on public.stock_movements;
create policy "Staff can view stock movements" on public.stock_movements
for select using (public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'));

drop policy if exists "Staff can manage stock movements" on public.stock_movements;
create policy "Staff can manage stock movements" on public.stock_movements
for all using (public.current_user_role() in ('super_admin', 'admin', 'manager'))
with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists "Categories are public" on public.categories;
create policy "Categories are public" on public.categories
for select using (is_active = true or public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists "Staff can manage categories" on public.categories;
create policy "Staff can manage categories" on public.categories
for all using (public.current_user_role() in ('super_admin', 'admin', 'manager'))
with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists "Active brands are public" on public.brands;
create policy "Active brands are public" on public.brands
for select using (is_active = true or public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists "Staff can manage brands" on public.brands;
create policy "Staff can manage brands" on public.brands
for all using (public.current_user_role() in ('super_admin', 'admin', 'manager'))
with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists "Users can view own orders and staff can view all" on public.orders;
create policy "Users can view own orders and staff can view all" on public.orders
for select using (user_id = auth.uid() or public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'));

drop policy if exists "Staff can manage orders" on public.orders;
create policy "Staff can manage orders" on public.orders
for all using (public.current_user_role() in ('super_admin', 'admin', 'manager'))
with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists "Users can view own payments and staff can view all" on public.payments;
create policy "Users can view own payments and staff can view all" on public.payments
for select using (
  public.current_user_role() in ('super_admin', 'admin', 'manager', 'support')
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

drop policy if exists "Staff can manage payments" on public.payments;
create policy "Staff can manage payments" on public.payments
for all using (public.current_user_role() in ('super_admin', 'admin', 'manager'))
with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists "Users can view own notifications and staff can view all" on public.notification_logs;
create policy "Users can view own notifications and staff can view all" on public.notification_logs
for select using (user_id = auth.uid() or public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'));

drop policy if exists "Staff can manage notification logs" on public.notification_logs;
create policy "Staff can manage notification logs" on public.notification_logs
for all using (public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'))
with check (public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'));

drop policy if exists "Users can view own order requests and staff can view all" on public.order_requests;
create policy "Users can view own order requests and staff can view all" on public.order_requests
for select using (user_id = auth.uid() or public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'));

drop policy if exists "Users can create own order requests" on public.order_requests;
create policy "Users can create own order requests" on public.order_requests
for insert with check (user_id = auth.uid());

drop policy if exists "Staff can manage order requests" on public.order_requests;
create policy "Staff can manage order requests" on public.order_requests
for update using (public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'))
with check (public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'));

drop policy if exists "Users can view own order events and staff can view all" on public.order_status_events;
create policy "Users can view own order events and staff can view all" on public.order_status_events
for select using (
  public.current_user_role() in ('super_admin', 'admin', 'manager', 'support')
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

drop policy if exists "Staff can manage order events" on public.order_status_events;
create policy "Staff can manage order events" on public.order_status_events
for all using (public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'))
with check (public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'));

drop policy if exists "Active coupons are readable" on public.coupons;
create policy "Active coupons are readable" on public.coupons
for select using (is_active = true or public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists "Staff can manage coupons" on public.coupons;
create policy "Staff can manage coupons" on public.coupons
for all using (public.current_user_role() in ('super_admin', 'admin', 'manager'))
with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists "Store settings are readable" on public.store_settings;
create policy "Store settings are readable" on public.store_settings
for select using (true);

drop policy if exists "Staff can manage store settings" on public.store_settings;
create policy "Staff can manage store settings" on public.store_settings
for all using (public.current_user_role() in ('super_admin', 'admin', 'manager'))
with check (public.current_user_role() in ('super_admin', 'admin', 'manager'));

drop policy if exists "Users can manage own wishlist" on public.wishlist_items;
create policy "Users can manage own wishlist" on public.wishlist_items
for all using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can view own tickets and staff can view all" on public.support_tickets;
create policy "Users can view own tickets and staff can view all" on public.support_tickets
for select using (user_id = auth.uid() or public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'));

drop policy if exists "Authenticated users can create tickets" on public.support_tickets;
create policy "Authenticated users can create tickets" on public.support_tickets
for insert with check (user_id = auth.uid());

drop policy if exists "Staff can update tickets" on public.support_tickets;
create policy "Staff can update tickets" on public.support_tickets
for update using (public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'))
with check (public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'));

drop policy if exists "Users can view own ticket replies and staff can view all" on public.ticket_replies;
create policy "Users can view own ticket replies and staff can view all" on public.ticket_replies
for select using (
  exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
    and (t.user_id = auth.uid() or public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'))
  )
);

drop policy if exists "Authenticated participants can create ticket replies" on public.ticket_replies;
create policy "Authenticated participants can create ticket replies" on public.ticket_replies
for insert with check (
  public.current_user_role() in ('super_admin', 'admin', 'manager', 'support')
  or exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id and t.user_id = auth.uid()
  )
);

drop policy if exists "Staff can view ticket internal notes" on public.support_ticket_notes;
create policy "Staff can view ticket internal notes" on public.support_ticket_notes
for select using (public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'));

drop policy if exists "Staff can create ticket internal notes" on public.support_ticket_notes;
create policy "Staff can create ticket internal notes" on public.support_ticket_notes
for insert with check (public.current_user_role() in ('super_admin', 'admin', 'manager', 'support'));

drop function if exists public.decrement_product_stock(uuid, integer);
drop function if exists public.decrement_product_stock(uuid, integer, uuid, uuid);

create or replace function public.decrement_product_stock(
  product_id uuid,
  qty integer,
  order_id uuid default null,
  actor_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  before_stock integer;
  after_stock integer;
begin
  select stock into before_stock
  from public.products
  where id = decrement_product_stock.product_id
    and status = 'published'
  for update;

  if before_stock is null or before_stock < qty then
    return false;
  end if;

  update public.products
  set stock = stock - qty
  where id = decrement_product_stock.product_id;

  after_stock := before_stock - qty;

  insert into public.stock_movements (
    product_id,
    order_id,
    actor_id,
    movement_type,
    delta,
    previous_stock,
    new_stock,
    note,
    metadata
  )
  values (
    decrement_product_stock.product_id,
    decrement_product_stock.order_id,
    decrement_product_stock.actor_id,
    'sale',
    -qty,
    before_stock,
    after_stock,
    'Stock deducted after checkout.',
    jsonb_build_object('source', 'checkout')
  );

  return true;
end;
$$;
