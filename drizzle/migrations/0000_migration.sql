
create type public.app_role as enum ('admin','staff','customer');
create type public.order_status as enum ('pending','preparing','ready','completed','cancelled');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','staff'))
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  loyalty_points integer not null default 0,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "staff profile update" on public.profiles for update to authenticated using (public.is_staff(auth.uid()));

create or replace function public.protect_points() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.loyalty_points <> old.loyalty_points and auth.uid() is not null and not public.is_staff(auth.uid()) then
    new.loyalty_points := old.loyalty_points;
  end if;
  return new;
end $$;
create trigger profiles_protect_points before update on public.profiles for each row execute function public.protect_points();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "public read categories" on public.categories for select to anon, authenticated using (true);
create policy "staff insert categories" on public.categories for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update categories" on public.categories for update to authenticated using (public.is_staff(auth.uid()));
create policy "staff delete categories" on public.categories for delete to authenticated using (public.is_staff(auth.uid()));

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  image_url text,
  available boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;
grant all on public.menu_items to service_role;
alter table public.menu_items enable row level security;
create policy "public read items" on public.menu_items for select to anon, authenticated using (true);
create policy "staff insert items" on public.menu_items for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update items" on public.menu_items for update to authenticated using (public.is_staff(auth.uid()));
create policy "staff delete items" on public.menu_items for delete to authenticated using (public.is_staff(auth.uid()));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial,
  user_id uuid not null,
  customer_name text not null,
  phone text not null,
  notes text,
  pickup_time text,
  status order_status not null default 'pending',
  subtotal numeric(10,2) not null,
  tax numeric(10,2) not null,
  total numeric(10,2) not null,
  points_awarded boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own or staff read orders" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "staff update orders" on public.orders for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid,
  name text not null,
  price numeric(10,2) not null,
  quantity integer not null
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "read order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff(auth.uid()))));

create table public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null default auth.uid(),
  from_staff boolean not null default false,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
grant select, insert on public.order_messages to authenticated;
grant all on public.order_messages to service_role;
alter table public.order_messages enable row level security;
create policy "read messages" on public.order_messages for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff(auth.uid()))));
create policy "send messages" on public.order_messages for insert to authenticated with check (
  sender_id = auth.uid() and (
    (from_staff = true and public.is_staff(auth.uid())) or
    (from_staff = false and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()))
  ));

create or replace function public.place_order(_items jsonb, _customer_name text, _phone text, _notes text, _pickup_time text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _order_id uuid;
  _subtotal numeric(10,2) := 0;
  _it jsonb;
  _mi public.menu_items;
  _qty int;
begin
  if _uid is null then raise exception 'Please sign in to order'; end if;
  if coalesce(trim(_customer_name),'') = '' or coalesce(trim(_phone),'') = '' then raise exception 'Name and phone are required'; end if;
  if _items is null or jsonb_array_length(_items) = 0 then raise exception 'Your cart is empty'; end if;
  insert into public.orders (user_id, customer_name, phone, notes, pickup_time, subtotal, tax, total)
    values (_uid, left(_customer_name,100), left(_phone,30), left(_notes,500), left(_pickup_time,50), 0, 0, 0) returning id into _order_id;
  for _it in select * from jsonb_array_elements(_items) loop
    select * into _mi from public.menu_items where id = (_it->>'id')::uuid and available = true;
    if not found then raise exception 'An item in your cart is no longer available'; end if;
    _qty := greatest(1, least(50, (_it->>'quantity')::int));
    insert into public.order_items (order_id, menu_item_id, name, price, quantity) values (_order_id, _mi.id, _mi.name, _mi.price, _qty);
    _subtotal := _subtotal + _mi.price * _qty;
  end loop;
  update public.orders set subtotal = _subtotal, tax = round(_subtotal * 0.07, 2), total = _subtotal + round(_subtotal * 0.07, 2) where id = _order_id;
  return _order_id;
end $$;
revoke execute on function public.place_order(jsonb, text, text, text, text) from public, anon;
grant execute on function public.place_order(jsonb, text, text, text, text) to authenticated;

create or replace function public.award_points() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and not old.points_awarded then
    update public.profiles set loyalty_points = loyalty_points + floor(new.total)::int where id = new.user_id;
    new.points_awarded := true;
  end if;
  return new;
end $$;
create trigger orders_award_points before update on public.orders for each row execute function public.award_points();

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_messages;

create policy "staff read menu images" on storage.objects for select to authenticated using (bucket_id = 'menu-images' and public.is_staff(auth.uid()));
create policy "staff upload menu images" on storage.objects for insert to authenticated with check (bucket_id = 'menu-images' and public.is_staff(auth.uid()));
create policy "staff delete menu images" on storage.objects for delete to authenticated using (bucket_id = 'menu-images' and public.is_staff(auth.uid()));

with c as (
  insert into public.categories (name, sort_order) values
  ('Gyros & Platters',1),('Burgers',2),('Philly Cheesesteaks',3),('Wings',4),('Subs & Sandwiches',5),('Smoothies & Shakes',6),('Desserts',7)
  returning id, name
)
insert into public.menu_items (category_id, name, description, price, image_url, featured, sort_order)
select c.id, v.name, v.description, v.price, v.image_url, v.featured, v.sort_order from (values
  ('Gyros & Platters','Gyro Platter','Seasoned gyro meat over rice with salad, pita and tzatziki.',13.99,'https://miamigrilllauderhill.com/wp-content/uploads/2025/01/gyro-platter-300x300-1.webp',true,1),
  ('Gyros & Platters','Classic Gyro','Warm pita stuffed with gyro meat, lettuce, tomato, onion and tzatziki.',9.99,'https://miamigrilllauderhill.com/wp-content/uploads/2025/01/IMG_1998.jpg',false,2),
  ('Burgers','Grill''d Burger','Fresh beef patty, cheese, lettuce, tomato, pickles and onion on a toasted bun.',9.49,'https://miamigrilllauderhill.com/wp-content/uploads/2025/01/burger-thumb-300x300-1.webp',true,1),
  ('Burgers','Double Cheeseburger','Two patties, double cheese, all the fixings.',11.99,'https://miamigrilllauderhill.com/wp-content/uploads/2017/01/inner_burger_4.jpg',false,2),
  ('Philly Cheesesteaks','Classic Philly Cheesesteak','Shaved steak, grilled onions and peppers, melted cheese on a hoagie roll.',11.99,'https://miamigrilllauderhill.com/wp-content/uploads/2025/01/classic-philly-cheesesteak-steak-new-300x300-1.webp',true,1),
  ('Philly Cheesesteaks','Philly Cheesesteak Meal','Our classic Philly with fries and a drink.',14.99,'https://miamigrilllauderhill.com/wp-content/uploads/slider/cache/14de617e312f1c2b0dbd45190e8451c0/Philly-cheesesteak-meal.png',false,2),
  ('Wings','Chicken Wings (10 pc)','Crispy wings tossed in your choice of sauce.',12.99,'https://miamigrilllauderhill.com/wp-content/uploads/2025/01/wings-thumb-300x300.png.webp',true,1),
  ('Subs & Sandwiches','Grilled Sub','Loaded sub with your choice of meat, cheese and veggies.',10.49,'https://miamigrilllauderhill.com/wp-content/uploads/2025/01/sub-thumb-300x300-1.webp',false,1),
  ('Subs & Sandwiches','Crispy Chicken Sandwich','Crispy chicken breast, pickles and mayo on a brioche bun.',9.99,'https://miamigrilllauderhill.com/wp-content/uploads/2025/01/Miami-Grill-Crispy-Chicken-Sandwich-new-300x300-1.webp',true,2),
  ('Smoothies & Shakes','Blue Bell Smoothie','Blended fresh fruit smoothie.',5.99,'https://miamigrilllauderhill.com/wp-content/uploads/2025/01/Blue-Bell-Smoothie.png',false,1),
  ('Smoothies & Shakes','Milkshake','Thick, creamy hand-spun milkshake.',5.99,'https://miamigrilllauderhill.com/wp-content/uploads/2025/01/IMG_2003.jpg',false,2),
  ('Desserts','Cookies','Fresh-baked chocolate chip cookies.',2.99,null::text,false,1)
) as v(cat, name, description, price, image_url, featured, sort_order)
join c on c.name = v.cat;
