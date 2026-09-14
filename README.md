# Next.js Performance Dashboard

A high-performance Next.js App Router application demonstrating React Server Components, persistent client state, type-safe server mutations, accessible UI, and measurable Lighthouse metrics.

---

## Architecture

The application is structured around a strict RSC → Client boundary. The root layout and all page files are Server Components by default. Interactive islands are isolated into small Client Components that subscribe only to the slice of state they need.

```
app/dashboard/page.tsx        ← Server Component (page shell)
        │
        ├── StatCards          ← Server Component (static data)
        │
        └── DashboardContent   ← Client Component ("use client")
                │
                ├── Filters    ← Zustand (narrow selector)
                ├── Dialog
                │     └── TransactionForm  ← react-hook-form + Zod
                │
                └── children (passed from page)
                      └── Suspense
                            └── TransactionList  ← async Server Component
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Primitives | shadcn/ui + Radix UI |
| Client State | Zustand (with `persist` middleware) |
| Forms | React Hook Form |
| Validation | Zod (shared schema) |
| Server Mutations | Next.js Server Actions |
| Theme | next-themes |
| Notifications | Sonner |

---

## Project Structure

```
app/
  layout.tsx           # Root layout — ThemeProvider, Toaster
  page.tsx             # Redirects to /dashboard
  dashboard/
    layout.tsx         # Dashboard shell — Sidebar + Navbar
    page.tsx           # Server Component page

components/
  dashboard/
    DashboardContent.tsx    # Client Component — filters + dialog
    Navbar.tsx              # Client Component — theme toggle, mobile nav
    Sidebar.tsx             # Client Component — nav links
    StatCards.tsx           # Server Component — stat cards
    TransactionList.tsx     # async Server Component — data fetch
    TransactionListSkeleton.tsx  # Skeleton fallback for Suspense
  forms/
    TransactionForm.tsx     # Client Component — react-hook-form
  ui/                       # shadcn/ui primitives

stores/
  useDashboardStore.ts      # Zustand store with persist middleware

schemas/
  transaction.ts            # Shared Zod schema (client + server)

actions/
  transactionActions.ts     # Server Action — mutation + re-validation
```

---

## RSC and Client Boundaries

Only components that require browser APIs, event listeners, or reactive state carry `"use client"`. Everything else renders on the server.

**Server Components:**
- `app/dashboard/page.tsx` — page composition
- `components/dashboard/StatCards.tsx` — static stat display
- `components/dashboard/TransactionList.tsx` — async data fetch

**Client Components:**
- `components/dashboard/DashboardContent.tsx` — filters, dialog trigger
- `components/dashboard/Navbar.tsx` — theme toggle, sheet navigation
- `components/forms/TransactionForm.tsx` — controlled form, transitions

Server Components pass RSC children into Client Components via props to maintain the boundary without converting the Client Component into a server one.

---

## State Management

Zustand manages UI-only client state. The store uses the `persist` middleware to survive page refreshes via `localStorage`.

```ts
// Only filters are persisted — not server data
partialize: (state) => ({ filters: state.filters })
```

Components subscribe to narrow slices to avoid unnecessary re-renders:

```ts
// Component A — only re-renders when filters change
const filters = useDashboardStore((state) => state.filters);

// Component B — only re-renders when setFilter changes
const setFilter = useDashboardStore((state) => state.setFilter);
```

---

## Validation Flow

A single Zod schema in `schemas/transaction.ts` is shared between the client and the server:

```
transactionSchema
       │
  ┌────┴────┐
  ↓         ↓
Client    Server Action
(RHF)     (safeParse)
```

This means validation rules are defined once and enforced at both boundaries.

---

## Server Action Flow

```
TransactionForm (Client)
        ↓
  useTransition → isPending state
        ↓
createTransaction (Server Action)
        ↓
  Server-side Zod safeParse
        ↓
  ┌─────┴──────┐
  ↓            ↓
success      failure
  ↓            ↓
revalidatePath  return { errors }
  ↓            ↓
toast.success  toast.error + setError
```

The server never trusts client-submitted data. Even if a client bypasses the form, the Server Action re-validates against the same schema before processing.

---

## Performance

- Static pages pre-rendered at build time where possible
- `TransactionList` is wrapped in `<Suspense>` so the shell renders immediately and only the async data region streams in
- Zustand subscriptions are narrow — unrelated components do not re-render on store updates
- Theme switching uses `suppressHydrationWarning` and `next-themes` to eliminate layout shift and hydration mismatches

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root redirects to `/dashboard`.

**Production build:**

```bash
npm run build
npm start
```
