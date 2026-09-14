# Technical Report — Next.js Performance Dashboard
### Deliverable 2 | Assignment 1

---

## RSC vs Client Component Architecture

### 1. RSC vs Client Components

Next.js App Router distinguishes between two types of components at the file level. **Server Components** render exclusively on the server and send HTML to the browser — no JavaScript bundle for that component is shipped to the client. **Client Components**, marked with `"use client"`, ship a JavaScript bundle and hydrate in the browser to support interactivity.

The governing rule applied throughout this project: a component only becomes a Client Component if it genuinely requires browser APIs, event handlers, or reactive state. Everything else stays on the server.

| Concern | Component | Type |
|---|---|---|
| Page composition | `app/dashboard/page.tsx` | Server Component |
| Static stat display | `StatCards.tsx` | Server Component |
| Async data fetch | `TransactionList.tsx` | async Server Component |
| Dashboard shell | `app/dashboard/layout.tsx` | Server Component |
| Filters + dialog | `DashboardContent.tsx` | Client Component |
| Theme toggle + nav | `Navbar.tsx` | Client Component |
| Controlled form | `TransactionForm.tsx` | Client Component |

---

### 2. Render Tree Architecture

```
app/dashboard/layout.tsx          [Server Component]
        │
        ├── Sidebar.tsx           [Client Component — nav links]
        │
        └── Navbar.tsx            [Client Component — theme toggle]
                │
        app/dashboard/page.tsx    [Server Component]
                │
                ├── StatCards.tsx         [Server Component]
                │
                └── DashboardContent.tsx  [Client Component]  ← "use client" boundary
                        │
                        ├── Filters (Zustand)
                        ├── DialogTrigger → TransactionForm.tsx  [Client Component]
                        │
                        └── children (passed from page)
                                │
                              Suspense
                                │
                          TransactionList.tsx   [async Server Component]
```

The critical architectural decision: `TransactionList` is a Server Component that is **passed as `children`** into `DashboardContent` from `page.tsx`. This preserves the RSC boundary — the async Server Component is not imported inside the Client Component file, which would convert it to a client render.

---

### 3. Hydration Boundary

Hydration is the process by which React attaches event listeners to server-rendered HTML on the client. The larger the client bundle, the more hydration work the browser must do before the page becomes interactive.

```
Browser receives HTML
        │
        ├── Server-rendered HTML (StatCards, TransactionList)
        │       → No hydration needed. Static HTML.
        │
        └── Client Component islands (DashboardContent, Navbar, TransactionForm)
                → React hydrates only these subtrees
                → Smaller surface = less JavaScript = faster TTI
```

The `suppressHydrationWarning` attribute on `<html>` in `layout.tsx` is required specifically for `next-themes`. The theme class (`dark`/`light`) is applied client-side from `localStorage`, so the server cannot know it at render time. This attribute suppresses the expected, intentional mismatch on that single attribute only — it does not suppress errors across the whole tree.

---

### 4. Optimization Strategies

```
Server Components
        ↓
Smaller client JS bundle
        ↓
Less hydration work
        ↓
Faster Time to Interactive (TTI)
```

- **`StatCards`** — static figures rendered server-side. Zero client JavaScript for this component.
- **`TransactionList`** — async Server Component that fetches data on the server and streams HTML. Wrapped in `<Suspense>` so the page shell renders immediately while the list resolves.
- **Client boundaries are leaf nodes** — `DashboardContent` is the deepest component that needs interactivity. Its parent (`page.tsx`) remains a Server Component.
- **No `"use client"` at the layout level** — the dashboard layout stays server-rendered, which means the sidebar, page title, and structural chrome ship as plain HTML with zero hydration cost.

---

---

## Server State vs Zustand Client State

### 5. State Management Architecture

```
Server-rendered application
        │
        ├── Server data (TransactionList, StatCards)
        │       Fetched on the server, rendered as HTML
        │       Refreshed via revalidatePath() after mutation
        │
        └── Client interaction
                  ↓
              Zustand store
                  ↓
          Persistent UI state (filters, selection)
                  ↓
              localStorage
```

**Server state** — data that originates from a data source and is fetched at request time. Managed by Next.js via Server Components and `revalidatePath`. Not stored in Zustand.

**Client state** — ephemeral UI preferences and interaction state that belong to the browser session. Managed by Zustand. Examples: active filter values, selected item IDs, search query.

---

### 6. Zustand Store Design

```ts
// stores/useDashboardStore.ts
interface DashboardState {
  filters: {
    status: string;   // "all" | "active" | "inactive" | "pending"
    search: string;
  };
  setFilter: (key: string, value: string) => void;

  items: Transaction[];  // client-side selection state
  setItems: (items: Transaction[]) => void;
}
```

The store is intentionally narrow. It does not hold server-fetched transactions, user session data, or authorization state. Those concerns remain server-side. **Zustand owns only what the browser owns.**

---

### 7. Persistence Strategy

The store uses Zustand's `persist` middleware to serialize filter state to `localStorage`:

```ts
persist(
  (set) => ({ ... }),
  {
    name: "dashboard-storage",
    partialize: (state) => ({ filters: state.filters }),
  }
)
```

`partialize` ensures only `filters` is persisted. Transient state like `items` is intentionally excluded — it resets on refresh as expected.

**Demonstrated behavior:**
1. User sets Status filter to `"active"` and types a search term
2. State is written to `localStorage` key `dashboard-storage`
3. User refreshes the page
4. Zustand rehydrates from `localStorage` — filters are restored automatically

---

### 8. Render Optimization

Each component subscribes to only the slice of the Zustand store it needs, using a selector:

```ts
// Only re-renders when filters change
const filters = useDashboardStore((state) => state.filters);

// Only re-renders when setFilter reference changes (it doesn't)
const setFilter = useDashboardStore((state) => state.setFilter);
```

Subscribing to the entire store object (`const store = useDashboardStore()`) causes every consumer to re-render on any state change. Narrow selectors prevent this — `StatCards` (a Server Component) is completely unaffected by filter changes because it sits outside the client boundary entirely.

**Why Zustand is not used for server data:**

Using Zustand to cache server responses would duplicate the Next.js data layer, create cache invalidation problems, and eliminate the benefits of RSC streaming. Instead, `revalidatePath("/dashboard")` is called inside the Server Action after a successful mutation, which re-fetches and re-renders only the server data layer without touching client state.

---

---

## Lighthouse & Core Web Vitals

### 9. Lighthouse Audit

Lighthouse was run against the production build (`npm run build` → `npm start`) on `http://localhost:3000/dashboard` using Chrome DevTools in Desktop mode.


| Metric | Result | Interpretation |
|---|---|---|
| **Performance** | — | Overall score (0–100) |
| **LCP** (Largest Contentful Paint) | — s | Time until the largest visible element renders |
| **CLS** (Cumulative Layout Shift) | — | Visual stability score during load (lower is better) |
| **INP** (Interaction to Next Paint) | — ms | Responsiveness to user input after page is interactive |
| **Accessibility** | — | Semantic HTML, ARIA attributes, colour contrast |
| **Best Practices** | — | Security headers, no deprecated APIs, no console errors |
| **SEO** | — | Meta tags, crawlability, descriptive link text |

Include a screenshot of the Lighthouse panel here showing the actual scores.

---

### 10. Optimization Measures

Each architectural decision in this project has a direct and measurable effect on Core Web Vitals.

**LCP (Largest Contentful Paint)**

```
RSC usage
        ↓
Server Components render HTML on the server
        ↓
Browser receives full HTML immediately (no client fetch waterfall)
        ↓
Largest visible element (StatCards / page heading) is in initial HTML
        ↓
Lower LCP
```

`StatCards` and the dashboard shell are Server Components. The browser has their HTML before any JavaScript executes. `TransactionList` is streamed via Suspense so its loading state is a skeleton (not a blank region), keeping the LCP element stable.

**CLS (Cumulative Layout Shift)**

```
Stable layouts
        ↓
Suspense fallback (TransactionListSkeleton) reserves the correct space
        ↓
No content jumps when list resolves
        ↓
CLS remains near 0
```

The skeleton component mirrors the dimensions of the loaded list. `suppressHydrationWarning` on `<html>` prevents a theme-class mismatch from causing a full tree remount, which would otherwise cause visible layout shift on first paint.

**INP (Interaction to Next Paint)**

```
Isolated client boundaries
        ↓
Smaller hydration surface
        ↓
Main thread available sooner
        ↓
Optimized interactions
        ↓
Better INP
```

`useTransition` in `TransactionForm` marks the Server Action call as a non-urgent transition. The UI (`button` state → "Saving...") updates immediately while the server processes the request, keeping the interface responsive without blocking the main thread.

---

### 11. Conclusion

The application demonstrates one coherent architecture where each requirement connects to the next:

```
                         NEXT.JS APP ROUTER
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
          SERVER COMPONENTS              CLIENT COMPONENTS
                 │                             │
          Dashboard UI                  Interactive UI
          Static content                Theme Toggle
          Server rendering              Filters
                 │                      Forms
                 │                      Zustand
                 │                             │
                 │                     Persistent State
                 │
                 └──────────────┬──────────────┘
                                │
                         React Hook Form
                                │
                              Zod  ←── shared schema (client + server)
                                │
                         Server Action
                                │
                         Server-side Zod
                                │
                             Mutation
                                │
                     ┌──────────┴──────────┐
                     │                     │
                  Success               Error
                     │                     │
                 revalidatePath        toast.error
                     │
                 UI update + toast.success
                     │
              Suspense / Skeleton states
```

The three demonstrable outcomes the implementation was designed to surface:

1. **RSC architecture** — Server Components own static and data-dependent rendering. Client Components are isolated leaf nodes. The boundary is explicit and traceable in the source tree.

2. **Persistent Zustand state** — Client UI state survives refresh via `localStorage`. Zustand is not used as a data cache — it owns only what the browser owns.

3. **Type-safe Server Action mutation** — A single Zod schema validates on the client (via React Hook Form) and re-validates independently on the server (via `safeParse` inside the Server Action). The client cannot bypass server validation.

These three elements are the spine of Assignment 1. They are not unrelated features — each one reinforces the others and together they tell one coherent story about the architecture.
