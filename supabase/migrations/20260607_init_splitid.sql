-- SplitID Initial Schema & Migrations

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create profiles table
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    full_name text not null,
    split_id text unique not null,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create friendships table
create table public.friendships (
    user_id uuid references public.profiles(id) on delete cascade,
    friend_id uuid references public.profiles(id) on delete cascade,
    status text not null check (status in ('pending', 'accepted', 'rejected')),
    requester_id uuid references public.profiles(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint friendships_pk primary key (user_id, friend_id),
    constraint user_id_less_than_friend_id check (user_id < friend_id)
);

-- 4. Create groups table
create table public.groups (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create group_members table
create table public.group_members (
    id uuid default gen_random_uuid() primary key,
    group_id uuid references public.groups(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint group_user_unique unique (group_id, user_id)
);

-- 6. Create expenses table
create table public.expenses (
    id uuid default gen_random_uuid() primary key,
    group_id uuid references public.groups(id) on delete cascade not null,
    paid_by uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    amount numeric(12, 2) not null check (amount > 0),
    split_type text not null check (split_type in ('equal', 'percentage', 'exact')),
    receipt_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Create expense_splits table
create table public.expense_splits (
    id uuid default gen_random_uuid() primary key,
    expense_id uuid references public.expenses(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    amount numeric(12, 2) not null check (amount >= 0),
    percentage numeric(5, 2) check (percentage >= 0 and percentage <= 100),
    constraint expense_user_unique unique (expense_id, user_id)
);

-- 8. Create settlements table
create table public.settlements (
    id uuid default gen_random_uuid() primary key,
    group_id uuid references public.groups(id) on delete cascade not null,
    payer_id uuid references public.profiles(id) on delete cascade not null,
    payee_id uuid references public.profiles(id) on delete cascade not null,
    amount numeric(12, 2) not null check (amount > 0),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Auto-create profile trigger & functions

-- Function to generate a unique Split ID
create or replace function public.generate_split_id(full_name text)
returns text as $$
declare
    prefix text;
    random_part text;
    result_id text;
    done bool;
begin
    -- Clean full_name to get uppercase letters, default to 'SPX' if empty
    prefix := upper(regexp_replace(full_name, '[^a-zA-Z]', '', 'g'));
    if length(prefix) = 0 then
        prefix := 'SPX';
    elsif length(prefix) > 5 then
        prefix := substring(prefix from 1 for 5);
    end if;

    done := false;
    while not done loop
        -- Generate 6 random alphanumeric characters
        random_part := upper(substring(md5(random()::text) from 1 for 6));
        result_id := prefix || '-' || random_part;
        
        -- Check uniqueness
        if not exists (select 1 from public.profiles where split_id = result_id) then
            done := true;
        end if;
    end loop;
    
    return result_id;
end;
$$ language plpgsql;

-- Trigger function for creating a new user profile
create or replace function public.handle_new_user()
returns trigger as $$
declare
    raw_name text;
begin
    raw_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    
    insert into public.profiles (id, email, full_name, split_id, avatar_url)
    values (
        new.id,
        new.email,
        raw_name,
        public.generate_split_id(raw_name),
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 10. Enable Row-Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;

-- 11. Define Row-Level Security Policies

-- Profiles Policies
create policy "Allow read access to all authenticated users"
    on public.profiles for select
    to authenticated
    using (true);

create policy "Allow user to update their own profile"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id);

-- Friendships Policies
create policy "Users can view friendships they are part of"
    on public.friendships for select
    to authenticated
    using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can insert friendships they are part of"
    on public.friendships for insert
    to authenticated
    with check (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can update friendships they are part of"
    on public.friendships for update
    to authenticated
    using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can delete friendships they are part of"
    on public.friendships for delete
    to authenticated
    using (auth.uid() = user_id or auth.uid() = friend_id);

-- Groups Policies (Recursion-free check through group_members)
create policy "Members can view groups"
    on public.groups for select
    to authenticated
    using (exists (
        select 1 from public.group_members
        where group_members.group_id = id and group_members.user_id = auth.uid()
    ));

create policy "Users can insert groups"
    on public.groups for insert
    to authenticated
    with check (auth.uid() = created_by);

create policy "Owners can update groups"
    on public.groups for update
    to authenticated
    using (auth.uid() = created_by);

create policy "Owners can delete groups"
    on public.groups for delete
    to authenticated
    using (auth.uid() = created_by);

-- Group Members Policies (Checks group read permissions)
create policy "Members can select group memberships"
    on public.group_members for select
    to authenticated
    using (group_id in (select id from public.groups));

create policy "Members can add group members"
    on public.group_members for insert
    to authenticated
    with check (group_id in (select id from public.groups));

create policy "Members can delete group members"
    on public.group_members for delete
    to authenticated
    using (group_id in (select id from public.groups));

-- Expenses Policies
create policy "Members can view group expenses"
    on public.expenses for select
    to authenticated
    using (group_id in (select id from public.groups));

create policy "Members can insert group expenses"
    on public.expenses for insert
    to authenticated
    with check (group_id in (select id from public.groups));

create policy "Members can update group expenses"
    on public.expenses for update
    to authenticated
    using (group_id in (select id from public.groups));

create policy "Members can delete group expenses"
    on public.expenses for delete
    to authenticated
    using (group_id in (select id from public.groups));

-- Expense Splits Policies
create policy "Members can view group expense splits"
    on public.expense_splits for select
    to authenticated
    using (expense_id in (select id from public.expenses));

create policy "Members can insert group expense splits"
    on public.expense_splits for insert
    to authenticated
    with check (expense_id in (select id from public.expenses));

create policy "Members can update group expense splits"
    on public.expense_splits for update
    to authenticated
    using (expense_id in (select id from public.expenses));

create policy "Members can delete group expense splits"
    on public.expense_splits for delete
    to authenticated
    using (expense_id in (select id from public.expenses));

-- Settlements Policies
create policy "Members can view group settlements"
    on public.settlements for select
    to authenticated
    using (group_id in (select id from public.groups));

create policy "Members can insert group settlements"
    on public.settlements for insert
    to authenticated
    with check (group_id in (select id from public.groups));

create policy "Members can update group settlements"
    on public.settlements for update
    to authenticated
    using (group_id in (select id from public.groups));

create policy "Members can delete group settlements"
    on public.settlements for delete
    to authenticated
    using (group_id in (select id from public.groups));
