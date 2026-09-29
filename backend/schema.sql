-- ============================================================
-- Hotel Automation Software - Supabase (PostgreSQL) schema
-- Run this once in: Supabase dashboard -> SQL Editor
-- ============================================================

drop table if exists food_orders cascade;
drop table if exists reservations cascade;
drop table if exists rooms cascade;
drop table if exists room_rates cascade;
drop table if exists frequent_guests cascade;

-- ------------------------------------------------------------
-- Tariff per room category. Four categories exist:
--   (single, AC) (single, Non-AC) (double, AC) (double, Non-AC)
-- The manager revises these rates up/down by a percentage.
-- ------------------------------------------------------------
create table room_rates (
  bed_type  text    not null check (bed_type in ('single', 'double')),
  is_ac     boolean not null,
  rate      numeric(10, 2) not null check (rate > 0),  -- tariff per night
  primary key (bed_type, is_ac)
);

-- ------------------------------------------------------------
-- Physical rooms of the hotel.
-- ------------------------------------------------------------
create table rooms (
  id          bigserial primary key,
  room_number text    not null unique,
  bed_type    text    not null check (bed_type in ('single', 'double')),
  is_ac       boolean not null,
  foreign key (bed_type, is_ac) references room_rates (bed_type, is_ac)
);

-- ------------------------------------------------------------
-- Frequent guests: hold an identity number and get a discount.
-- ------------------------------------------------------------
create table frequent_guests (
  identity_number  text primary key,
  name             text not null,
  discount_percent numeric(5, 2) not null default 10 check (discount_percent between 0 and 100)
);

-- ------------------------------------------------------------
-- A reservation = one guest occupying one room for some nights.
-- token_number is the unique token handed to the guest.
-- rate_per_night is frozen at booking time so later tariff
-- revisions do not change an existing booking.
-- ------------------------------------------------------------
create table reservations (
  token_number    bigserial primary key,
  guest_name      text not null,
  phone           text,
  identity_number text references frequent_guests (identity_number),
  room_id         bigint not null references rooms (id),
  arrival_time    timestamptz not null,
  duration_days   integer not null check (duration_days > 0),  -- approximate stay
  advance_paid    numeric(10, 2) not null default 0 check (advance_paid >= 0),
  rate_per_night  numeric(10, 2) not null,
  status          text not null default 'booked' check (status in ('booked', 'checked_out')),
  checkout_time   timestamptz,
  created_at      timestamptz not null default now()
);

create index on reservations (room_id, status);
create index on reservations (arrival_time);

-- ------------------------------------------------------------
-- Food consumed by a guest, entered by the catering manager.
-- ------------------------------------------------------------
create table food_orders (
  id           bigserial primary key,
  token_number bigint not null references reservations (token_number) on delete cascade,
  item_name    text   not null,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(10, 2) not null check (unit_price >= 0),
  consumed_at  timestamptz not null default now()
);

create index on food_orders (token_number);

-- ------------------------------------------------------------
-- Seed data: starting tariff + a few rooms + a frequent guest.
-- ------------------------------------------------------------
insert into room_rates (bed_type, is_ac, rate) values
  ('single', false, 1500),
  ('single', true,  2500),
  ('double', false, 2800),
  ('double', true,  4000);

insert into rooms (room_number, bed_type, is_ac) values
  ('101', 'single', false),
  ('102', 'single', true),
  ('103', 'single', true),
  ('201', 'double', false),
  ('202', 'double', true),
  ('203', 'double', true);

insert into frequent_guests (identity_number, name, discount_percent) values
  ('FG-001', 'Ravi Kumar', 10),
  ('FG-002', 'Anita Desai', 15);

-- The backend talks to Supabase with the service_role key, which
-- bypasses RLS. RLS is therefore left disabled on these tables;
-- never expose the service_role key to the browser.
