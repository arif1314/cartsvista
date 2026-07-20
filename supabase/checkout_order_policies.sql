-- Allows storefront checkout to create customer and guest orders while keeping reads private.
-- Run this in Supabase SQL Editor if checkout shows an orders row-level security error.

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.order_status_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notification_logs enable row level security;
alter table public.addresses enable row level security;
alter table public.support_tickets enable row level security;

drop policy if exists "Storefront checkout can create orders" on public.orders;
create policy "Storefront checkout can create orders" on public.orders
for insert
with check (
  user_id is null
  or user_id = auth.uid()
);

drop policy if exists "Storefront checkout can create order items" on public.order_items;
create policy "Storefront checkout can create order items" on public.order_items
for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
    and (o.user_id is null or o.user_id = auth.uid())
  )
);

drop policy if exists "Storefront checkout can initialize payments" on public.payments;
create policy "Storefront checkout can initialize payments" on public.payments
for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = payments.order_id
    and (o.user_id is null or o.user_id = auth.uid())
  )
);

drop policy if exists "Storefront checkout can create payment events" on public.payment_events;
create policy "Storefront checkout can create payment events" on public.payment_events
for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = payment_events.order_id
    and (o.user_id is null or o.user_id = auth.uid())
  )
);

drop policy if exists "Storefront checkout can create order status events" on public.order_status_events;
create policy "Storefront checkout can create order status events" on public.order_status_events
for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_status_events.order_id
    and (o.user_id is null or o.user_id = auth.uid())
  )
);

drop policy if exists "Storefront checkout can create audit logs" on public.audit_logs;
create policy "Storefront checkout can create audit logs" on public.audit_logs
for insert
with check (true);

drop policy if exists "Storefront checkout can queue notifications" on public.notification_logs;
create policy "Storefront checkout can queue notifications" on public.notification_logs
for insert
with check (true);

drop policy if exists "Users can manage own addresses" on public.addresses;
create policy "Users can manage own addresses" on public.addresses
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Guests can create contact tickets" on public.support_tickets;
create policy "Guests can create contact tickets" on public.support_tickets
for insert
with check (
  user_id is null
  or user_id = auth.uid()
);
