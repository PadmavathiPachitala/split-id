# SplitID

### Modern group expense sharing built around privacy, trust, and financial correctness.

SplitID is a SaaS-grade expense sharing platform that helps friends, roommates, students, and teams track shared expenses, settle balances, and minimize repayments.

Unlike traditional expense-sharing applications that rely on phone numbers or open group invitations, SplitID uses unique Split IDs and a friends-only membership model to keep groups private and controlled.

Built with Next.js, Supabase, PostgreSQL, and a production-grade financial ledger architecture.

---

## Why SplitID?

Most expense-sharing apps solve the calculation problem.

SplitID focuses on solving three problems:

### Privacy

Users should not need to expose personal phone numbers to participate in shared expenses.

Every user receives a unique Split ID that can be used to connect with friends.

### Trust

Only accepted friends can be invited into groups.

This prevents random users from being added to private expense groups.

### Financial Integrity

Expense creation, edits, settlements, and deletions are handled through database transactions, audit logs, and balance caching to maintain consistent financial records.

---

## Core Features

### Split ID Based Friend System

Each user receives a unique identifier.

Example:

```text
PADM-7128
ANIK-9831
SPID-4281
```

Users can:

* Search friends using Split IDs
* Send friend requests
* Accept or reject requests
* Maintain a trusted friend network

---

### Friends-Only Group Membership

Groups can only contain accepted friends.

This rule is enforced both:

* In the frontend
* At the database level

Result:

Private groups remain private.

---

### Flexible Expense Splitting

Supports:

* Equal Split
* Percentage Split
* Exact Amount Split

Includes live validation and real-time split breakdowns before expenses are submitted.

---

### Receipt Attachments

Upload:

* Images
* PDFs
* Bills
* Receipts

All files are stored securely using Supabase Storage.

---

### Intelligent Debt Simplification

SplitID automatically minimizes the number of repayments required inside a group.

Instead of:

```text
A owes B
B owes C
```

the system simplifies repayments into the smallest possible set of transactions.

---

### Direct Settle-Up Flow

Users can record repayments directly from the group screen.

The application explains exactly:

* Who is paying
* Who is receiving
* How balances will change

before the settlement is recorded.

---

### Financial Audit Trail

Every important financial action is recorded:

* Expense Created
* Expense Edited
* Expense Deleted
* Settlement Created
* Settlement Reversed

Creating a complete history of ledger activity.

---

### High-Performance Balance Engine

SplitID uses a materialized balance cache instead of recalculating balances from the entire expense history.

Benefits:

* Faster dashboard loads
* O(1) balance lookups
* Better scalability for large groups

---

## Technology Stack

| Layer          | Technology                    |
| -------------- | ----------------------------- |
| Frontend       | Next.js 15, React, TypeScript |
| Styling        | Tailwind CSS, Framer Motion   |
| Backend        | Supabase                      |
| Database       | PostgreSQL                    |
| Authentication | Supabase Auth                 |
| Storage        | Supabase Storage              |
| Security       | Row Level Security (RLS)      |

---

## How It Works

### 1. Create an Account

Sign up and receive your unique Split ID.

### 2. Add Friends

Search users using their Split ID and send friend requests.

### 3. Create a Group

Create a group and add accepted friends.

### 4. Record Expenses

Log shared expenses using equal, percentage, or exact splits.

### 5. Review Balances

Track who owes whom in real time.

### 6. Settle Up

Record repayments and clear balances.

---

## Architecture Highlights

* Atomic PostgreSQL Transactions
* Financial Audit Logging
* Soft Deletes
* Materialized Balance Cache
* Concurrency Protection
* Database-Level Validation
* Row-Level Security

Designed for correctness, consistency, and scalability.
