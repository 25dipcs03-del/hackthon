# CivicConnect – From Complaints to Action

> **AI-Powered Civic Complaint Management Platform**  
> Hackathon project — transforms scattered citizen complaints into prioritized, explainable, trackable actions.

---

## Architecture

```
CAPTURE → AI UNDERSTANDING → HOTSPOT INSIGHTS → ADMIN ACTION → CITIZEN TRACKING
```

```
civicconnect/
├── frontend/          # React 18 + Vite 5 + Tailwind CSS 3
│   └── src/
│       ├── pages/     # Landing, Auth, Citizen, Admin pages
│       ├── components/# Reusable UI components
│       ├── services/  # Axios API service
│       ├── contexts/  # AuthContext
│       └── layouts/   # AdminLayout (with notification badge)
├── server/            # Node.js 20 + Express 4 REST API
│   ├── routes/        # auth, complaints, admin
│   ├── controllers/   # authController, complaintController, adminController
│   ├── services/      # aiService (Gemini + scoring + duplicate detection + clustering)
│   ├── middleware/     # JWT auth + role checks
│   └── config/        # Supabase client
└── database/
    ├── schema.sql                  # PostgreSQL tables, RLS, indexes, triggers
    ├── seed.sql                    # 40 synthetic demonstration complaints
    └── migrate_add_ai_scoring.sql  # Migration: adds scoring_breakdown + factors columns
```

---

## Technology Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | React 18, Vite 5, Tailwind CSS, Framer Motion |
| Charts    | Recharts (AreaChart, BarChart, PieChart, RadarChart) |
| Maps      | Leaflet + React-Leaflet + OpenStreetMap       |
| Backend   | Node.js 20, Express 4                          |
| Database  | Supabase PostgreSQL                            |
| Auth      | Supabase Auth (JWT)                            |
| Storage   | Supabase Storage                               |
| AI        | Google Gemini 1.5 Flash API                    |

---

## Prerequisites

- Node.js v20+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) Gemini API key

---

## Setup Instructions

### 1. Database Setup (Supabase)

1. Go to your Supabase project → **SQL Editor**
2. Run `database/schema.sql` (creates all 9 tables, triggers, RLS policies, sequences)
3. Run `database/seed.sql` (inserts 40 synthetic demonstration complaints with coordinates)
4. In Supabase → **Storage**, create a bucket named `complaint-images` (set to **public**)

> **Existing database?** Run `database/migrate_add_ai_scoring.sql` to add the `scoring_breakdown` and `factors` columns to `ai_analysis`.

### 2. Create Admin User

In Supabase → **SQL Editor**, run:
```sql
-- First register a user via the app, then promote to admin:
UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@example.com';
```

### 3. Backend Setup

```bash
cd civicconnect/server
cp .env.example .env
# Edit .env with your Supabase credentials and Gemini API key
npm install
npm run dev
# Server runs on http://localhost:5000
```

**Backend `.env`:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 4. Frontend Setup

```bash
cd civicconnect/frontend
npm install --legacy-peer-deps
# No .env changes needed — Vite proxies /api to localhost:5000
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Running the Application

```bash
# Terminal 1 – Backend
cd civicconnect/server && npm run dev

# Terminal 2 – Frontend
cd civicconnect/frontend && npm run dev
```

Open `http://localhost:5173`

---

## Application Flows

### Citizen Journey
1. Visit landing page → Register
2. Login → Citizen Dashboard (with notification bell)
3. Click **Report a Problem**
4. Fill form (title, description, category, address, pin on map, upload photo)
5. Submit → Complaint saved, AI analysis starts asynchronously
6. Receive Complaint ID (e.g. `CC-2024-01234`)
7. View complaint → See AI priority + explainable scoring breakdown, status timeline
8. Track any complaint via `/track` using just the complaint number (no login required)

### Admin Journey
1. Login with admin account
2. Admin Dashboard → Real-time stats + 4 charts (trends, categories, priority, status)
3. All Complaints → Search, filter, sort, paginate
4. Open complaint → View AI analysis, scoring breakdown, duplicate detections, map, photo
5. Assign to department, update status, add remarks, override priority
6. Notification bell shows unread count, dropdown, mark-all-read
7. AI Insights → Gemini action brief + radar chart + per-category recommendations table
8. Hotspot Map → DBSCAN clusters with AI-generated action suggestion per cluster
9. Analytics → Dept performance chart + monthly trends + category + priority charts

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register citizen |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/profile` | Get current user profile |
| GET | `/api/auth/notifications` | Get user notifications |

### Citizen
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/citizen/dashboard` | Citizen stats + recent complaints |
| GET | `/api/citizen/complaints` | List own complaints |
| POST | `/api/complaints` | Submit new complaint (multipart/form-data) |
| GET | `/api/complaints/:id` | Get complaint detail (auth required) |
| GET | `/api/complaints/track/:number` | **Public** — look up by complaint number (CC-YYYY-NNNNN) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Stats + charts data (incl. dept performance) |
| GET | `/api/admin/complaints` | Filtered/paginated complaint list |
| GET | `/api/admin/complaints/:id` | Full complaint detail |
| PUT | `/api/admin/complaints/:id/status` | Update complaint status + status_history |
| PUT | `/api/admin/complaints/:id/assign` | Assign to department + status_history |
| PUT | `/api/admin/complaints/:id/priority` | Override AI priority |
| GET/POST/PUT/DELETE | `/api/admin/departments` | Department CRUD |
| GET | `/api/admin/notifications` | Admin notifications (last 30) |
| GET | `/api/admin/notifications/unread-count` | Fast unread badge count |
| PUT | `/api/admin/notifications/read-all` | Mark all notifications read |
| PUT | `/api/notifications/:id/read` | Mark single notification read |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/insights` | AI analytics + Gemini brief + per-category recommendations |
| GET | `/api/ai/hotspots` | Map data + DBSCAN clusters with suggested actions |

---

## AI Features

### Complaint Analysis (Gemini 1.5 Flash)
Analyzes title, description, category, location. Returns:
- `category`, `summary`, `priority`, `priority_score` (0–100)
- `priority_reason` — specific explanation citing the complaint text
- `suggested_department`, `recommended_action`
- `scoring_breakdown` — four factor scores with individual reasons
- `factors` — safety_risk, urgency, public_impact, estimated_resolution_days

### Explainable Priority Scoring
Each complaint is scored on four independent factors (each 0–25, summing to 0–100):

| Factor | What it measures |
|--------|-----------------|
| Safety Risk | Immediate injury / accident / health hazard risk |
| Urgency | Time-sensitivity — will it worsen if not addressed? |
| Public Impact | How many people or how much area is affected |
| Severity | Extent of physical damage or service failure |

| Priority | Score Band | Description |
|----------|------------|-------------|
| Critical | 80–100 | Immediate safety threat, life risk |
| High | 60–79 | Significant safety or service risk |
| Medium | 30–59 | Moderate inconvenience or growing risk |
| Low | 0–29 | Minor issue, preventive maintenance |

### Duplicate Detection
- **Trigram similarity** (60%) + **word overlap** (40%) → combined text score (weight 50%)
- **Haversine geographic proximity** — linear decay over 2 km radius (weight 35%)
- **Category match bonus** (weight 15%)
- Combined threshold: 42% → flagged as duplicate
- Each duplicate candidate includes `match_reasons` array

### Hotspot Clustering
- DBSCAN-inspired proximity clustering (0.8 km epsilon, min 2 points)
- Returns cluster center, count, unresolved count, top priority, top category
- **`suggested_action`** — deterministic action string per cluster (category + priority aware)

### AI Insights
- Two Gemini calls run in **parallel** (`Promise.allSettled`) for faster response
- Week-over-week trend comparison (increasing / decreasing / stable)
- Per-category unresolved pattern analysis + recommended actions
- Average scoring factor radar chart across all analyzed complaints

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (citizen/admin role) |
| `complaints` | Core complaint records with priority, status, coordinates |
| `complaint_images` | Uploaded photos (Supabase Storage URLs) |
| `ai_analysis` | Gemini results: summary, priority, scoring_breakdown, factors, duplicate_candidates |
| `departments` | City departments |
| `assignments` | Complaint-to-department assignments |
| `status_history` | Full audit trail — every status change including assignments |
| `duplicate_links` | Flagged duplicate pairs with similarity scores and match reasons |
| `notifications` | User notifications (citizen + admin) with read/unread state |

Row Level Security: Citizens can only access their own records.
Admins use service role key (server-side only) — never exposed to frontend.

---

## Security Notes

- Gemini API key and Supabase Service Role key are **server-side only**
- Frontend never receives privileged keys
- Admin role is verified server-side by querying the `profiles` table
- All JWT tokens are validated server-side via Supabase Auth
- Input validation on all API endpoints
- Public complaint tracking endpoint exposes only non-sensitive fields (no citizen PII)

---

## Limitations & Honesty Notes

1. **AI Analysis Latency**: Gemini analysis runs asynchronously after complaint submission (~5–15s). The citizen complaint detail page polls until complete.
2. **AI Accuracy**: Priority scores are AI estimates based on complaint text. They are advisory, not authoritative. Each score factor is explained to enable human review.
3. **Duplicate Detection**: Uses text similarity + proximity heuristics. May produce false positives or miss duplicates with very different wording for the same issue.
4. **Map Coordinates**: Only complaints with latitude/longitude appear on the map. Citizens must click the map to set coordinates.
5. **Image Analysis**: Complaint text is analyzed; uploaded image content is not currently passed to Gemini Vision. This is a noted extension point.
6. **Sample Data**: The 40 seed complaints use fictional locations and data. Coordinates are approximate.
7. **Performance**: The AI Insights endpoint calls Gemini twice in parallel. On cold start this takes ~3–8s. Not optimized for production scale.
8. **Email Notifications**: Not implemented. Notification system stores records in database only.

---

## Synthetic Data Notice

The `database/seed.sql` file contains **40 synthetic demonstration complaints** with:
- Fictional citizen names and locations across Bengaluru, Chennai, Mumbai, Hyderabad, Kolkata, Delhi, Pune
- 5 deliberate duplicate complaint pairs
- Multiple critical safety issues  
- Geographic clustering to demonstrate hotspot detection

**No real personal information is used.**

---

## License

Hackathon demonstration project. Not for production use without security review.
