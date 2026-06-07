# SplitID Setup and Configuration Guide

SplitID is a modern group-expense sharing application featuring a premium glassmorphism UI, a simplified database structure on Supabase, complete Row-Level Security (RLS) policies, and a smart debt-simplification algorithm.

The database configuration and env files have been created. Below are the steps to connect your hosted Supabase instance and execute the schemas.

---

## 1. Database Setup Instructions (Supabase Dashboard)

1. Open your **Supabase Dashboard** at [https://supabase.com](https://supabase.com) and go to your project.
2. Navigate to the **SQL Editor** tab on the left sidebar.
3. Click **New Query** to create an empty SQL query pane.
4. Copy the complete SQL commands from the migration file in your project:
   `c:\Users\padhu\Desktop\split-id\supabase\migrations\20260607_init_splitid.sql`
5. Paste the SQL code into the editor and click **Run**. This will create:
   - All tables (`profiles`, `friendships`, `groups`, `group_members`, `expenses`, `expense_splits`, `settlements`)
   - The random Split ID generator trigger function
   - Recursion-free RLS (Row-Level Security) policies protecting data access
   - Automatically link the `profiles` table to the auth table.

---

## 2. Receipts Storage Bucket Setup

To support receipt uploads (images and PDFs):
1. In the Supabase Dashboard, navigate to the **Storage** tab.
2. Click **New Bucket**.
3. Name the bucket exactly: **`receipts`**
4. Set the bucket privacy toggle to **Public** (so the frontend can read the public URL for previewing bills).
5. Add standard Storage policies (Policies tab):
   - **Select Policy**: Allow select to all authenticated users.
   - **Insert/Update Policy**: Allow insert/update to all authenticated users.

---

## 3. Local Environment Verification

The connection variables have already been written to `c:\Users\padhu\Desktop\split-id\.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://vdtzuzshdlqabtqdeelx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_doo1aPzOFyFZ12gL_ho8wQ_ye75sWUt
```

---

## 4. Run the Application

To test the application locally:
1. Open a terminal inside `c:\Users\padhu\Desktop\split-id`.
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 5. Seed Data (Optional)

To insert test data into your database, run the following SQL commands in the Supabase SQL Editor:
```sql
-- Note: Replace the UUID strings below with your own users' auth.users IDs if you wish to link them directly.
-- These seed values demonstrate a 3-user group setup.

-- Example: insert simulated profiles
-- (Profiles are created automatically upon auth signup, but you can manually insert them for testing)
INSERT INTO public.profiles (id, email, full_name, split_id, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'harshini@splitid.com', 'Harshini', 'HARSH-7840', now()),
('00000000-0000-0000-0000-000000000002', 'padma@splitid.com', 'Padma', 'PADMA-7128', now()),
('00000000-0000-0000-0000-000000000003', 'aniket@splitid.com', 'Aniket', 'ANIK-9831', now());

-- Establish friendships
INSERT INTO public.friendships (user_id, friend_id, status, requester_id) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'accepted', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'accepted', '00000000-0000-0000-0000-000000000002'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'accepted', '00000000-0000-0000-0000-000000000001');

-- Create a group
INSERT INTO public.groups (id, name, description, created_by) VALUES
('11111111-1111-1111-1111-111111111111', 'Roadtrip Crew', 'Shared expenses for Tokyo Trip', '00000000-0000-0000-0000-000000000001');

-- Add members to group
INSERT INTO public.group_members (group_id, user_id) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001'),
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002'),
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000003');

-- Add an expense (Japanese Dinner: $120.00 paid by Harshini, split equally)
INSERT INTO public.expenses (id, group_id, paid_by, title, amount, split_type) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Tokyo Trip Dinner', 120.00, 'equal');

-- Add expense splits ($40.00 each)
INSERT INTO public.expense_splits (expense_id, user_id, amount) VALUES
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 40.00),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 40.00),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000003', 40.00);
```
