# SafaiSetu Project Structure

Version 1.0 design, Day 2. Based on a Next.js 16 App Router project with the `src/` directory and the default import alias `@/*` (which points to `src/*`).

---

## 1. Folder tree

```text
safaisetu/
├── docs/                          # Project documents and evidence (not shipped to users)
│   ├── ARCHITECTURE.md
│   ├── SCHEMA.md
│   ├── API.md
│   ├── UI-WIREFRAMES.md
│   ├── PROJECT-STRUCTURE.md
│   ├── PROJECT-LOG.md             # One entry per day
│   ├── wireframes/                # Photos of paper sketches (Day 2)
│   ├── screenshots/               # Final screenshots for README (Day 10)
│   ├── test-plan.md               # Day 9
│   ├── bugs.md                    # Day 9
│   ├── demo-script.md             # Day 10
│   └── maintenance.md             # Day 10
├── supabase/                      # SQL you run in the Supabase SQL Editor
│   ├── schema.sql                 # Day 3 (from SCHEMA.md sections 3.1 to 3.3)
│   ├── seed_areas.sql             # Day 3
│   ├── seed_profiles.sql          # Day 3 (ids filled in by you, no passwords)
│   └── seed_demo.sql              # Day 8
├── public/                        # Static files served as-is (favicon, logo)
├── src/
│   ├── proxy.js                   # Day 6: refresh session, guard /dashboard (was middleware.js)
│   ├── app/                       # Routes (each folder = one URL)
│   │   ├── layout.js              # Root layout: fonts, header slot, page background
│   │   ├── globals.css            # Tailwind import and design tokens
│   │   ├── page.js                # S1 Landing
│   │   ├── not-found.js           # S8 (Day 8)
│   │   ├── error.js               # S8 (Day 8)
│   │   ├── report/
│   │   │   ├── page.js            # S2 Report form
│   │   │   └── success/page.js    # S3 Success
│   │   ├── track/
│   │   │   ├── page.js            # S4 search
│   │   │   └── [id]/page.js       # S4 result
│   │   ├── login/page.js          # S5
│   │   ├── dashboard/
│   │   │   ├── page.js            # S6
│   │   │   └── [id]/page.js       # S7
│   │   └── api/
│   │       ├── health/route.js                    # E1
│   │       └── complaints/
│   │           ├── route.js                       # E2 POST
│   │           └── [id]/status/route.js           # E3 PATCH
│   ├── components/                # Reusable UI pieces
│   │   ├── layout/                # SiteHeader.js, TeamHeader.js
│   │   ├── ui/                    # Button, Card, Alert, Skeleton, SeverityBadge, StatusBadge
│   │   ├── report/                # ReportForm.js, PhotoPicker.js, LocationButton.js
│   │   ├── track/                 # TrackForm.js, StatusStepper.js
│   │   └── dashboard/             # ComplaintCard.js, FilterTabs.js, StatusActions.js,
│   │                              # RepeatLocationsPanel.js, LoginForm.js, LogoutButton.js
│   └── lib/                       # All logic that is not UI
│       ├── config.js              # Constants: enums, labels, size limits, allowed types
│       ├── supabase/
│       │   ├── client.js          # Browser client (publishable key)
│       │   ├── server.js          # Server client with cookie session
│       │   └── admin.js           # Secret-key client, imports "server-only"
│       ├── ai/
│       │   ├── prompt.js          # Rubric text
│       │   ├── analyzeImage.js    # Calls Gemini, applies timeout and fallback
│       │   └── validate.js        # Checks AI output against allowed values
│       ├── areas.js               # getAreas
│       ├── complaints.js          # getTrackingView, listTeamComplaints, getTeamComplaint
│       ├── validation.js          # File signature, size, UUID, coordinate checks
│       ├── storage.js             # Upload and delete helpers
│       ├── trackingId.js          # SS-XXXXXX generator
│       ├── permissions.js         # Who may change what; allowed status transitions
│       ├── priority.js            # Priority sort
│       ├── repeatLocations.js     # Grouping logic
│       ├── errors.js              # Standard JSON error responses
│       └── format.js              # "2 days ago", label helpers
├── .env.example                   # Variable names only, no values
├── .env.local                     # Your real values (never committed)
├── .gitignore
├── eslint.config.mjs              # Created by the starter
├── next.config.mjs                # Created by the starter
├── package.json
└── README.md
```

---

## 2. What each folder is responsible for

| Folder | Responsible for | Must not contain |
|---|---|---|
| `src/app` | Routes: pages (what the user sees) and route handlers (`route.js`). Thin: read input, call `lib`, return output. | Business rules, raw database queries |
| `src/components` | Visual building blocks and client-side behaviour (forms, buttons) | Secret keys, direct database access |
| `src/lib` | Everything that decides or fetches: validation, AI, permissions, queries, priority | JSX or styling |
| `src/lib/supabase` | The three Supabase clients, one purpose each | Queries |
| `supabase/` | SQL files that can recreate the database | App code |
| `docs/` | Written design, logs, test results, screenshots | Secrets |
| `public/` | Files with fixed URLs | Private data |

**Rule of thumb:** pages and handlers call `lib`; `lib` calls Supabase and Gemini; components never call Supabase except `LoginForm` and `LogoutButton` (browser client).

---

## 3. Why this structure

1. **Route folders match the screens** in UI-WIREFRAMES.md, so finding code is easy.
2. **Logic in `lib`** means a rule (for example allowed status changes) exists once and is tested once.
3. **The admin client is isolated** and guarded with `server-only`, so a secret key cannot leak into browser code by accident.
4. **SQL lives in the repo** so the database can be rebuilt by a reviewer or by you later.
5. **No extra layers** (no `services/`, `hooks/`, `types/`, `utils/` junk drawer, no tests folder in v1) to keep the 10-day timeline honest.

## 4. Conventions

- File names: React components in `PascalCase.js`; everything else `camelCase.js`; route folders lowercase.
- Import with the alias: `import { getAreas } from "@/lib/areas"`.
- Client components start with `"use client"` and are used only where interaction is needed (forms, buttons, file pickers).
- All route handlers return errors through `lib/errors.js`.
- Constants (limits, enums, labels) only in `lib/config.js`.
- One feature per commit; commit message style: `Day 4: report form and submit route`.
- Never commit `.env.local`, passwords, keys or screenshots that show keys.

## 5. `.env.example` (names only)

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=
```

## 6. Where each day's code lands

| Day | Creates or edits |
|---|---|
| 2 (today) | `docs/*`, `supabase/` (empty), starter project, `.env.example`, `README.md` |
| 3 | `supabase/*.sql`, `src/lib/supabase/*`, `src/lib/areas.js`, `src/lib/config.js`, `src/app/api/health/route.js` |
| 4 | `src/app/report/*`, `src/components/report/*`, `src/app/api/complaints/route.js`, `src/lib/{validation,storage,trackingId,errors}.js` |
| 5 | `src/lib/ai/*`, edits to `api/complaints/route.js` and `report/success/page.js` |
| 6 | `src/app/track/*`, `src/app/login/page.js`, `src/proxy.js`, `src/app/dashboard/page.js`, `src/lib/{complaints,priority,format}.js`, `components/track`, `components/dashboard` (list parts) |
| 7 | `src/app/dashboard/[id]/page.js`, `api/complaints/[id]/status/route.js`, `src/lib/permissions.js`, `StatusActions.js` |
| 8 | `supabase/seed_demo.sql`, `RepeatLocationsPanel.js`, `lib/repeatLocations.js`, landing page, `components/ui/*`, `not-found.js`, `error.js` |
| 9 | `docs/test-plan.md`, `docs/bugs.md`, fixes |
| 10 | `README.md`, `docs/screenshots/`, `docs/demo-script.md`, `docs/maintenance.md`, tag `v1.0.0` |

---

## 7. Day 3 readiness check

### Is the plan realistic?

Yes, with the changes in ARCHITECTURE.md section 12. Estimated load per day (hours): D3 2 to 2.5, D4 3, D5 3, D6 3, D7 3 (lighter after moving the repeat panel), D8 3, D9 2 to 3, D10 2. Days 9 and 10 carry slack for overruns.

### Scope check

| Item | Verdict |
|---|---|
| Map view, charts, notifications, area admin, extra languages | Still out. Nothing added. |
| Simplifications recommended | Drop the track API endpoint (C2); move repeat panel to Day 8 (C4); one tracking screen with built-in search; one reusable `PhotoPicker`; hand-written validation instead of a library |
| Highest risks | Day 5 (free AI limits and model name), Day 6 (session cookies and `proxy.js` redirects), Day 7 (permissions and optimistic update). Each has a fallback or a test in API.md. |

### Day 3 start conditions (all must be true before building)

- [ ] GitHub repo exists and today's docs are pushed.
- [ ] Node.js 20.9 or newer, Git and VS Code installed.
- [ ] Starter app runs at `http://localhost:3000`.
- [ ] Supabase project created; Project URL, publishable key and secret key saved in `.env.local` (never in chat).
- [ ] Vercel project imported from GitHub with the same variables, first deploy green.
- [ ] `docs/PROJECT-LOG.md` has the Day 2 entry.

If the last three Supabase and Vercel items are not finished today, they become the first hour of Day 3 and the database SQL (already written in SCHEMA.md) follows right after.
