# Change Order & Job Cost Tracker

A lightweight MVP for small specialty contractors to manage customers, jobs, change orders, PDFs, public approval links, attachments, and CSV exports.

## Current MVP Features

- Customer CRUD
- Job CRUD
- Change order creation and listing
- Live change order total calculation
- Dashboard summary totals
- Change order PDF generation
- Public approval links
- Customer approval/rejection page
- Attachment upload and viewing through Supabase Storage
- Change order CSV export
- Demo company bootstrap route

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Storage
- Supabase service role key for server-only admin routes
- pdf-lib for PDF generation

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create .env.local in the project root.

3. Add these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Start local dev server:

```bash
npm run dev
```

5. Open:

http://localhost:3000

## Supabase Setup

- Run SQL files in order:
	1. supabase/schema/001_initial_schema.sql
	2. supabase/schema/002_attachments.sql
- Create Supabase Storage bucket:
	change-order-attachments
- Current MVP uses a public bucket for simple attachment viewing.

## Demo Company

- The MVP uses a fixed demo company id:
	00000000-0000-0000-0000-000000000001
- The bootstrap route creates Demo Contractor:
	/api/dev/bootstrap
- This is temporary and should be replaced when authentication is added.

## Main Routes

- /
- /dashboard
- /customers
- /jobs
- /change-orders
- /settings
- /approve/[token]

## Important API Routes

- /api/dev/bootstrap
- /api/customers
- /api/customers/[id]
- /api/jobs
- /api/jobs/[id]
- /api/change-orders
- /api/change-orders/[id]/pdf
- /api/change-orders/[id]/approval-link
- /api/change-orders/[id]/attachments
- /api/approvals/[token]
- /api/dashboard/summary
- /api/export/change-orders

## Safety Notes

- Do not commit .env.local
- Do not expose SUPABASE_SERVICE_ROLE_KEY to client components
- Current public storage bucket is for MVP only
- Authentication and real tenant separation should be added before production
- The demo company id should be replaced with real company/user ownership later

## Useful Commands

- npm run dev
- npm run lint
- git status

## Next Improvements

- Authentication
- Real company settings
- Email sending for approval links
- Private storage with signed URLs
- Better PDF template
- Mark approved change orders as invoiced
- Stripe billing
- Deployment to Vercel
