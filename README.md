# 🪙 SplitID — Modern SaaS-Grade Group Expense Sharing

**SplitID** is a premium, secure, and SaaS-grade group-expense sharing application featuring a stunning glassmorphism UI, a simplified database structure on Supabase, complete Row-Level Security (RLS) policies, and an optimized debt-simplification algorithm.

---

## 💡 The Problem We Solve

Traditional group-expense sharing applications face several key engineering and user experience problems:

1. **Slow and Costly Calculations**: Most platforms calculate user balances dynamically on the client side or on every page request, leading to $O(N)$ computational lag as transaction histories grow.
2. **Race Conditions & Concurrency**: If multiple group members log or edit expenses simultaneously, concurrent database writes can lead to double-ledger errors or mismatched balances.
3. **Privacy & Security Flaws**: Users are often able to add arbitrary strangers to private groups without permission, violating user privacy.
4. **Lack of Audibility**: Traditional expense apps do not maintain transactional logs, making it impossible to audit when an expense was edited, soft-deleted, or reversed.
5. **Unstructured Repayments**: When a trip or dinner ends, members end up making numerous micro-transfers back and forth instead of simplifying the net debt.

### 🌟 Our Solution
* **Materialized Balance Cache (`group_balances`)**: Replaces dynamic calculations with a caching table, converting balance lookups into instant $O(1)$ operations maintained automatically by database-level triggers.
* **Atomic PostgreSQL RPC Transactions**: All expense creations, edits, soft-deletions, and settlements run inside atomic database transactions (`create_expense_transaction`, `edit_expense_transaction`, etc.) using `SELECT FOR UPDATE` to serialize concurrent writes.
* **Friends-Only Group Guard**: A database trigger check (`trg_group_members_friendship_check`) and frontend gatekeeper that allows users to be added to a group *only if* they have a mutual, accepted friendship status.
* **Ledger Protection via Soft Deletes**: Deleting an expense never destroys database records; instead, it sets `deleted_at = now()`, automatically triggers balance cache reversals, and records the change in the audit trail.
* **Comprehensive Audit Trail (`financial_audit_log`)**: Logs every single ledger mutation with before/after state captures (`old_data`, `new_data`).
* **Settle-Up Debt Simplification**: Built-in greedy debt-minimization algorithm that reduces the absolute number of transaction transfers required to settle a group to zero.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework & Engine** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling & Theme** | TailwindCSS, Vanilla CSS, CSS Variables (Dark/Light mode support) |
| **Icons & Visuals** | Lucide React, Framer Motion (Smooth UI micro-transitions) |
| **Backend & Auth** | Supabase Auth (with email/password and Google OAuth support) |
| **Database** | PostgreSQL, PL/pgSQL functions, database triggers, Row-Level Security (RLS) |
| **Audit & Assertions** | Custom Node.js database pooler integration test suite |

---

## 🗂️ Project Structure

The project maintains a clean separation between frontend presentation and backend database logic:

```
split-id/
├── src/
│   ├── app/                  # Frontend page routes & layouts
│   │   ├── layout.tsx        # Global layout wrapped with Toast & Theme Providers
│   │   ├── globals.css       # Core styling, skeleton gradients, and transitions
│   │   ├── dashboard/        # Dashboard view showing net balances
│   │   ├── groups/           # Groups hub (Grid layout & creation modal)
│   │   │   └── [id]/         # Group Details (Ledgers, live shares, settle ups)
│   │   ├── friends/          # Friends Hub (Request management & active cards)
│   │   ├── settlements/      # Settlements ledger history log
│   │   └── settings/         # Profile management and dark/light modes
│   ├── components/           # Reusable frontend UI components
│   │   ├── CustomCursor.tsx  # Smooth trail cursor using requestAnimationFrame
│   │   └── Toast.tsx         # Custom glassmorphic popup warning/success system
│   └── lib/                  # Libraries and core utilities
│       ├── debt-simplifier.ts# Debt simplification algorithm
│       └── supabase/         # Client & Server supabase API connection hooks
└── supabase/
    └── migrations/           # Database Backend SQL migration scripts
```

---

## 🚀 Setup & Installation

### 1. Database Migrations
1. In your **Supabase Dashboard**, navigate to the **SQL Editor** tab.
2. Create a new query and paste the contents of [`supabase/migrations/20260607_init_splitid.sql`](file:///c:/Users/padhu/Desktop/split-id/supabase/migrations/20260607_init_splitid.sql).
3. Click **Run** to set up tables, triggers, indexes, and RPC functions.

### 2. Storage Bucket for Receipts
1. Navigate to the **Storage** tab in your Supabase dashboard.
2. Create a new bucket named exactly: **`receipts`**.
3. Toggle the privacy setting to **Public**.
4. Set standard policies allowing authenticated users to `Select`, `Insert`, and `Update` files.

### 3. Local Environment Variables
Create a `.env.local` file in the root of the project directory with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key
```

### 4. Running the Development Server
Install dependencies and launch the application:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your local workspace.

---

## 🧪 Verification & Testing

To verify the financial integrity, concurrency locks, and trigger actions of the platform, a dedicated integration test suite is included in the project:
1. Ensure your Postgres pooler credentials are set up.
2. Run the test script:
   ```bash
   node run_financial_tests.js
   ```
This will run comprehensive scenario checks including:
* **Scenario 1**: Equal Split calculation correctness.
* **Scenario 2**: Percentage Split calculation correctness.
* **Scenario 3**: Multi-party Expense Editing updates.
* **Scenario 4**: Soft Deletion and balance cache reversals.
* **Scenario 5**: Settlements clearing balance ledgers to zero.
* **Scenario 6**: Concurrency serialization via database-level `FOR UPDATE` locking.
* **Scenario 7**: Friends-Only membership constraint validations.
