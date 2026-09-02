# Annadata Setu — Minimal Viable Product (MVP) Plan
## SIH26032 | Team: Annadata Setu | IIT Madras BS

---

## 1. What Problem Are We Solving? (One Line)

> Farmers travel to Mandis without knowing if there's space, how long they'll wait, or whether their crop will even be accepted today.

**Our MVP answer:** A simple web app where a farmer registers → books a slot at a center → sees their queue position & wait time → center operator marks them served.

---

## 2. Core Data Model (Only 3 Tables)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   FARMER    │         │   BOOKING   │         │   CENTER    │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ id (PK)     │◄───────│ id (PK)     │───────►│ id (PK)     │
│ name        │   1:M   │ farmer_id   │   M:1   │ name        │
│ phone       │         │ center_id   │         │ district    │
│ village     │         │ crop_type   │         │ max_capacity│
│ district    │         │ quantity_kg │         │ process_rate│
│ land_acres  │         │ token_no    │         │ is_active   │
│ bank_ac_no  │         │ status      │         └─────────────┘
└─────────────┘         │ booked_date │
                        │ created_at  │
                        └─────────────┘
```

### Why only 3 tables?

| Table | Purpose | Why it's needed |
|-------|---------|----------------|
| **Farmer** | Stores who the farmer is | Can't book without knowing the person |
| **Center** | Stores Mandi center info | Can't allocate without knowing capacity |
| **Booking** | Links farmer + center + slot | This IS the queue. Status field handles everything |

### What we REMOVED from the original plan:
- ❌ `Transaction` table → Just add `payment_status` as a field in Booking
- ❌ Redis / ZSET queue → Queue position = COUNT of bookings ahead with earlier `created_at`
- ❌ Wait-time prediction engine → Simple formula: `(people ahead × avg_process_time)`
- ❌ Alternative center recommendation → Just show ALL centers with their current load %
- ❌ AadhaarHash, VehicleType, VehicleCapacityWeight → Overkill for MVP

---

## 3. Booking Status Lifecycle (The Heart of the App)

```
PENDING ──► CONFIRMED ──► IN_QUEUE ──► SERVING ──► COMPLETED
    │            │             │            │
    └────────────┴─────────────┴────────────┘
                 (can CANCEL at any point before SERVING)
```

| Status | Meaning | Who changes it |
|--------|---------|----------------|
| `PENDING` | Farmer requested, not yet confirmed | Auto on create |
| `CONFIRMED` | Slot allocated, farmer should come | Admin / Auto if capacity available |
| `IN_QUEUE` | Farmer arrived at center, waiting | Admin marks "Check In" |
| `SERVING` | Farmer's turn at the counter | Admin clicks "Next Token" |
| `COMPLETED` | Procurement done | Admin clicks "Mark Done" |
| `CANCELLED` | Slot cancelled | Farmer or Admin |

---

## 4. Minimal Backend (FastAPI + SQLite)

### File Structure (Stripped Down)

```
backend/
├── app/
│   ├── __init__.py
│   ├── database.py          # SQLite + SQLAlchemy setup
│   ├── models.py            # 3 tables only
│   ├── schemas.py           # Pydantic request/response models
│   ├── main.py              # FastAPI app + all routes (no separate routers folder)
│   └── seed_data.py         # 5 sample centers + 3 sample farmers + 2 sample bookings
├── requirements.txt         # fastapi, uvicorn, sqlalchemy, pydantic
└── run.py                   # python run.py starts the server
```

### Why this structure?
- **No separate routers folder** — For MVP, put all 8-10 endpoints in `main.py`. Splitting into 5 router files is premature optimization.
- **No Redis** — SQLite can handle queue logic with a simple `ORDER BY created_at` query.
- **No config.py** — Hardcode SQLite URL. Move to env vars only if you have time.
- **No CRUD layer** — Direct DB operations in endpoints. Less abstraction = easier to explain to judges.

### API Endpoints (Only 8 needed)

| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | `/farmers` | Register a new farmer |
| GET | `/farmers/{id}` | Get farmer profile |
| GET | `/centers` | List all centers with current load |
| POST | `/bookings` | Farmer books a slot |
| GET | `/bookings/farmer/{farmer_id}` | Farmer sees their bookings |
| GET | `/bookings/center/{center_id}` | Admin sees queue for a center |
| PATCH | `/bookings/{id}/status` | Admin updates status (check-in, serving, done) |
| GET | `/admin/stats` | Dashboard numbers (total farmers, today's bookings, etc.) |

---

## 5. Minimal Frontend (React + Vite + Tailwind)

### File Structure (Stripped Down)

```
frontend/
├── package.json
├── index.html
├── vite.config.js
├── tailwind.config.js
└── src/
    ├── main.jsx
    ├── App.jsx              # Route switcher: Registration / Dashboard / Admin
    ├── api.js               # One file: all fetch calls to backend
    ├── index.css
    └── components/
        ├── FarmerRegister.jsx     # One-page form (not multi-step)
        ├── FarmerDashboard.jsx    # "My Bookings" + "Book New Slot"
        ├── CenterQueue.jsx        # Admin view: live queue table
        └── AdminStats.jsx         # Simple 3-card stats row
```

### What we REMOVED from the original plan:
- ❌ Multi-step registration → Single form with sections. Faster to build, same result.
- ❌ Tactile Modernism design system → Standard Tailwind green palette. Judges care about function, not hex codes.
- ❌ Hanken Grotesk / Source Sans 3 fonts → System fonts. Zero setup.
- ❌ Material Symbols → Lucide React icons only.
- ❌ StatusChip, MetricCard, TopNav, Footer as separate components → Inline or simple reusable.
- ❌ "Get Directions" button → Just show center name and district.
- ❌ SMS alerts → In-app notifications only. Mention SMS as "future scope" in presentation.

### Pages (Only 3)

| Page | For | What it shows |
|------|-----|---------------|
| **Register** | Farmer | Name, phone, village, district, land size, bank account |
| **Dashboard** | Farmer | "My Active Booking" card (token, center, status, wait time) + "Book New" form |
| **Admin** | Center Operator | Queue table for their center + buttons to advance queue + 3 stat cards |

---

## 6. Queue Logic (Simple, No Redis)

### How queue position is calculated:

```python
# When farmer checks their booking
def get_queue_position(booking_id, center_id):
    # Count how many CONFIRMED/IN_QUEUE bookings were created BEFORE this one
    position = db.query(Booking).filter(
        Booking.center_id == center_id,
        Booking.status.in_(['CONFIRMED', 'IN_QUEUE']),
        Booking.created_at < this_booking.created_at
    ).count()
    return position + 1  # 1-based position
```

### How wait time is calculated:

```python
# Simple estimate: each farmer takes ~30 mins to process
def get_wait_time_minutes(queue_position):
    avg_process_time = 30  # minutes per farmer
    return queue_position * avg_process_time
```

### Why this works for MVP:
- Hackathon demos run for 10-15 minutes. You don't need real-time sub-second updates.
- Refresh the page → position updates. Good enough.
- If judges ask "What about real-time?" → Say: "WebSocket/SSE upgrade planned for Phase 2."

---

## 7. Center Load Calculation (Simple)

```python
# For each center, show utilization %
def get_center_load(center_id):
    today_bookings = db.query(Booking).filter(
        Booking.center_id == center_id,
        Booking.booked_date == today,
        Booking.status.in_(['CONFIRMED', 'IN_QUEUE', 'SERVING'])
    ).all()

    total_kg = sum(b.quantity_kg for b in today_bookings)
    utilization = (total_kg / center.max_capacity) * 100
    return utilization
```

---

## 8. Seed Data (For Demo)

Pre-populate the database with:

**Centers (5):**
1. Ludhiana Grain Market (District: Ludhiana, Capacity: 50000 kg, Rate: 2000 kg/hr)
2. Khanna Mandi (District: Ludhiana, Capacity: 30000 kg, Rate: 1500 kg/hr)
3. Moga Grain Market (District: Moga, Capacity: 40000 kg, Rate: 1800 kg/hr)
4. Karnal Mandi (District: Karnal, Capacity: 35000 kg, Rate: 1600 kg/hr)
5. Ambala Center (District: Ambala, Capacity: 25000 kg, Rate: 1200 kg/hr)

**Farmers (3):**
1. Gurpreet Singh (Village: Phagwara, District: Kapurthala, Crop: Wheat)
2. Harpreet Kaur (Village: Jalandhar, District: Jalandhar, Crop: Rice)
3. Baldev Singh (Village: Ludhiana, District: Ludhiana, Crop: Wheat)

**Bookings (2 active):**
1. Gurpreet → Ludhiana Grain Market, Wheat 2000kg, Token: A-142, Status: IN_QUEUE
2. Harpreet → Khanna Mandi, Rice 1500kg, Token: B-089, Status: CONFIRMED

---

## 9. Demo Flow (For Judges)

**Step 1 — Registration (1 min):**
- Open app → Farmer Registration page
- Fill: Name, Phone, Village, District, Land Size, Bank Account
- Submit → "Registration Successful! Your Farmer ID: F-001"

**Step 2 — Book a Slot (1 min):**
- Go to Farmer Dashboard
- Select Crop: Wheat, Quantity: 2000 kg
- Select Center: Ludhiana Grain Market
- Pick Date: Today
- Click "Book Slot" → "Token A-143 Confirmed!"

**Step 3 — View Queue (30 sec):**
- Dashboard shows: Token A-143, Position: 8, Est. Wait: 4 hours
- Show "My Past Bookings" table below

**Step 4 — Admin Operations (2 min):**
- Switch to Admin View
- See queue table: 8 farmers waiting
- Click "Next Token" → A-142 moves to SERVING
- Position updates for everyone behind
- Click "Mark Complete" → A-142 done
- Stats update: "Today's Served: 47"

**Step 5 — Impact Pitch (1 min):**
- "Before Annadata Setu: Farmers travel 50km, wait 6 hours, may be turned away"
- "After: Book from home, know your turn, centers balance load"

---

## 10. Tech Stack (Final)

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | FastAPI + SQLite | Single file DB, zero setup, Python is SIH-friendly |
| Frontend | React + Vite + Tailwind | Fast dev, clean UI, one command to run |
| ORM | SQLAlchemy | Clean models, relationships handled automatically |
| Validation | Pydantic | Request/response schemas built-in with FastAPI |
| Icons | Lucide React | Simple, clean, no config |

---

## 11. What to Say When Judges Ask About "Missing" Features

| Judge Question | Your Answer |
|---------------|-------------|
| "Where is the SMS alert?" | "MVP focuses on core booking + queue. SMS integration via Twilio/Fast2SMS is Phase 2." |
| "Where is the ML wait-time prediction?" | "Current formula uses center process rate. ML enhancement after pilot data collection." |
| "What about Aadhaar verification?" | "MVP uses basic registration. UIDAI API integration is post-MVP." |
| "How does the center operator login?" | "MVP uses center selection dropdown. RBAC with JWT auth is planned for deployment." |
| "What about payment gateway?" | "MVP tracks payment status manually. UPI/Razorpay integration is future scope." |

---

## 12. Implementation Priority (Build in This Order)

**Day 1 — Backend Skeleton:**
1. Set up FastAPI + SQLite
2. Create 3 models (Farmer, Center, Booking)
3. Create database + seed data
4. Build `/farmers` POST and GET
5. Build `/centers` GET
6. Build `/bookings` POST and GET

**Day 2 — Frontend Skeleton:**
1. Set up React + Vite + Tailwind
2. Build Farmer Registration form
3. Build Farmer Dashboard (view bookings + book new)
4. Build Admin Queue page
5. Connect frontend to backend APIs

**Day 3 — Polish + Demo:**
1. Add queue position calculation
2. Add wait time estimate
3. Add admin "Next Token" / "Mark Complete" buttons
4. Add seed data for realistic demo
5. Practice the 5-minute demo flow

---

## Summary

| Original Plan | MVP Plan | Reason |
|--------------|----------|--------|
| 5 router files | 1 main.py | Less code, easier to explain |
| Redis ZSET queue | SQLite `ORDER BY created_at` | Zero setup, works for demo |
| 4+ tables | 3 tables | Booking handles queue + payment status |
| Multi-step registration | Single form | Faster to build, same data collected |
| 5+ frontend views | 3 views | Only what judges will see |
| Custom design system | Tailwind defaults | Judges evaluate function, not color palette |
| SMS alerts | In-app only | Mention as future scope |
| Payment tracking table | `payment_status` field | Simpler, same info |

**Remember: In a hackathon, a working simple app beats a broken ambitious app every time.**
