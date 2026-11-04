# SafaiSetu API Design

Version 1.0 design, Day 2. No implementation yet. v1 has **three endpoints** plus Supabase Auth calls and server-rendered reads.

---

## 1. Conventions

- Base path `/api`. Handlers run on the Node.js runtime.
- Photos are sent as `multipart/form-data`.
- Success returns JSON. Errors always use this shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Please choose an area." } }
```

- `message` is safe to show to a user. Never include stack traces, keys or SQL.
- Route params are asynchronous in Next.js 16 (`await params`).

### Error codes

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or malformed field |
| 401 | `UNAUTHORIZED` | No valid team session |
| 403 | `FORBIDDEN` | Logged in, but the complaint belongs to the other team |
| 404 | `NOT_FOUND` | Complaint not found |
| 409 | `INVALID_TRANSITION` | Status change not allowed, or status changed meanwhile |
| 413 | `PAYLOAD_TOO_LARGE` | Photo over 3 MB |
| 415 | `UNSUPPORTED_MEDIA` | Not a JPEG, PNG or WebP image |
| 500 | `SERVER_ERROR` | Unexpected failure |
| 502 | `STORAGE_ERROR` | Photo upload failed |

---

## 2. Endpoint list

| ID | Method and path | Who | Day |
|---|---|---|---|
| E1 | `GET /api/health` | Anyone | 2-3 |
| E2 | `POST /api/complaints` | Resident (no login) | 4-5 |
| E3 | `PATCH /api/complaints/[id]/status` | Logged-in team member | 7 |

Not endpoints: login and logout (browser calls Supabase Auth directly), and all page data reads (section 6).

---

## 3. E1: `GET /api/health`

- **Purpose:** confirm the deployed app can reach the database.
- **Authentication:** none.
- **Request:** none.
- **Response 200:** `{ "ok": true, "db": true }`
- **Response 503:** `{ "ok": false, "db": false }`
- **Validation:** none.
- **Error cases:** database unreachable gives 503. Must not reveal keys, URLs or error details.

---

## 4. E2: `POST /api/complaints`

- **Purpose:** create a complaint: validate, store photo, run AI, route, save (FR-1 to FR-8).
- **Authentication:** none (residents have no accounts).
- **Route setting:** `maxDuration = 30`.

### Request (`multipart/form-data`)

| Field | Required | Format |
|---|---|---|
| `photo` | yes | one file, JPEG, PNG or WebP |
| `area_id` | yes | UUID of an existing area |
| `latitude` | no | number string, -90 to 90 |
| `longitude` | no | number string, -180 to 180 |

### Validation (in this order)

1. Content type is multipart; `photo` exists and is a single file.
2. Size is more than 0 and at most **3 MB** (the browser targets about 1 MB; Vercel's hard cap is 4.5 MB).
3. File type checked by **signature bytes** (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF....WEBP`), not just the declared type.
4. `area_id` is a valid UUID and exists in `areas`.
5. `latitude` and `longitude`: both present or both absent; numeric; within range. If both are empty strings, treat as absent.
6. Unknown fields are ignored.

### Server steps

1. Validate. 2. Load area (get `owner_type`, `name`, `owner_name`). 3. Upload photo to `complaint-photos/reports/<uuid>.<ext>` and get the public URL. 4. Run AI analysis (Day 5; on Day 4 skip and set `ai_status = pending`). 5. Generate tracking ID and insert; on unique violation, generate a new ID and retry up to 5 times. 6. If the insert fails, delete the uploaded photo (best effort) and return an error.

### Response 201

```json
{
  "tracking_id": "SS-7K3M9Q",
  "status": "Reported",
  "area_name": "Ward 7 - Old Town",
  "routed_to": "municipal",
  "owner_name": "Municipal Sanitation Team",
  "waste_type": "mixed",
  "severity": "high",
  "reason": "Large heap spilling onto the road.",
  "ai_status": "done",
  "has_gps": true
}
```

If AI failed, the response is still **201** with `waste_type: "unclear"`, `severity: "medium"`, `ai_status: "failed"` and the fallback reason.

### Error cases

| Case | HTTP | `code` |
|---|---|---|
| No photo, no area, bad UUID, bad or half-given coordinates | 400 | `VALIDATION_ERROR` |
| Area id not found | 400 | `VALIDATION_ERROR` |
| Photo over 3 MB | 413 | `PAYLOAD_TOO_LARGE` |
| Wrong file type | 415 | `UNSUPPORTED_MEDIA` |
| Storage upload fails | 502 | `STORAGE_ERROR` |
| Database insert fails | 500 | `SERVER_ERROR` |
| AI fails | not an error | 201 with fallback |

Known v1 limit: no rate limiting or CAPTCHA. The client disables Submit while sending to avoid duplicates.

---

## 5. E3: `PATCH /api/complaints/[id]/status`

- **Purpose:** move a complaint forward and, for Cleaned, store the after photo (FR-14, FR-15).
- **Authentication:** required. Team identity comes from the session cookie checked with `getUser()` (verified by the auth server), never from the request body.
- **Path param:** `id` = the complaint's internal UUID (not the tracking ID).

### Request (`multipart/form-data`)

| Field | Required | Format |
|---|---|---|
| `to_status` | yes | `In Progress` or `Cleaned` |
| `after_photo` | only when `to_status` is `Cleaned` | JPEG, PNG or WebP, at most 3 MB |

### Allowed transitions

| From | To | Allowed |
|---|---|---|
| Reported | In Progress | yes |
| In Progress | Cleaned | yes, needs after photo |
| anything else (skip, backwards, from Cleaned) | | no, 409 |

### Server steps

1. Verify session, else 401. 2. Load the user's profile (`team_type`). 3. Load the complaint by `id` with the secret key, else 404. 4. If `routed_to` differs from `team_type`, 403. 5. Check the transition. 6. For Cleaned: validate and upload the after photo to `after-photos/after/<uuid>.<ext>`. 7. Update with `where id = ? and status = <current status>`; if no row changes, return 409 (someone else changed it, or a double click). The `updated_at` trigger runs automatically; set `cleaned_at` for Cleaned.

### Response 200

```json
{
  "id": "0b8c...-uuid",
  "tracking_id": "SS-7K3M9Q",
  "status": "Cleaned",
  "after_photo_url": "https://.../after-photos/after/....jpg",
  "cleaned_at": "2026-11-12T09:30:00Z",
  "updated_at": "2026-11-12T09:30:00Z"
}
```

### Error cases

| Case | HTTP | `code` |
|---|---|---|
| Not logged in or expired session | 401 | `UNAUTHORIZED` |
| No profile row for the user | 403 | `FORBIDDEN` |
| Complaint belongs to the other team | 403 | `FORBIDDEN` |
| `id` not a UUID or `to_status` invalid | 400 | `VALIDATION_ERROR` |
| Complaint not found | 404 | `NOT_FOUND` |
| Not an allowed transition, or status changed meanwhile | 409 | `INVALID_TRANSITION` |
| Cleaned without after photo | 400 | `VALIDATION_ERROR` |
| Photo too large or wrong type | 413 / 415 | `PAYLOAD_TOO_LARGE` / `UNSUPPORTED_MEDIA` |
| Upload fails | 502 | `STORAGE_ERROR` |
| Update fails | 500 | `SERVER_ERROR` |

---

## 6. Reads that are not endpoints

These happen inside server pages through `src/lib` functions.

| Screen | Function | Client and access |
|---|---|---|
| Report form (areas) | `getAreas()` | server client, public read policy |
| `/report/success`, `/track/[id]` | `getTrackingView(trackingId)` | secret key; safe fields only |
| `/dashboard` | `listTeamComplaints(filter)` | session client; RLS limits to the team |
| `/dashboard/[id]` | `getTeamComplaint(id)` | session client; RLS blocks other teams |
| Repeat locations panel | `getRepeatLocations(rows)` | computed in code from the team's rows |

## 7. Supabase Auth calls (from the browser)

| Action | Call | Result |
|---|---|---|
| Login | `signInWithPassword(email, password)` | Session cookies set; redirect to `/dashboard` |
| Logout | `signOut()` | Cookies cleared; redirect to `/login` |

No public sign-up. Users are created by hand in the Supabase dashboard.

## 8. Test checklist (use on Days 4, 5, 7, 9)

- E2: valid with GPS; valid without GPS; wrong type; 4 MB file; bad coordinates; missing area; invalid AI key still returns 201.
- E3: logged out (401); wrong team (403); skip step (409); Cleaned without photo (400); double click (second call 409); success path updates the tracking page.
