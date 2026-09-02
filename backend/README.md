# Annadata Setu - Backend (MVP)

> Smart agricultural procurement scheduling, digital queue management, and capacity load-balancing platform.
> Built for SIH26032 — Ministry of Consumer Affairs, Food & Public Distribution.
> Team: Annadata Setu | IIT Madras BS Degree Programme

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI |
| Database | SQLite (via SQLAlchemy 2.0) |
| ORM | SQLAlchemy |
| Validation | Pydantic v2 |
| Server | Uvicorn |

## Architecture

```
backend/
├── app/
│   ├── __init__.py
│   ├── database.py          # DB connection & session management
│   ├── models.py            # 3 ORM tables: Farmer, Center, Booking
│   ├── schemas.py           # Pydantic request/response models
│   └── services/
│       ├── queue_service.py     # Queue position & wait-time logic
│   └── routers/
│       ├── __init__.py
│       ├── farmers.py       # Farmer registration & profiles
│       ├── centers.py       # Mandi center listing & capacity
│       ├── bookings.py      # Slot booking, queue, status updates
│       └── admin.py         # Dashboard statistics
├── main.py                  # FastAPI app + CORS + router registration
├── seed_data.py             # Demo data (5 centers, 3 farmers, 5 bookings)
├── requirements.txt         # Python dependencies
├── .gitignore               # Ignore venv, DB, cache
└── README.md                # This file
```

## Data Model (3 Tables)

```
Farmer (1) ────────< Booking >──────── (1) Center
```

| Table | Purpose |
|-------|---------|
| **Farmer** | Identity, location, farm info |
| **Center** | Mandi name, capacity, processing rate |
| **Booking** | The queue. Links farmer ↔ center. Status tracks lifecycle. |

### Booking Status Lifecycle

```
PENDING → CONFIRMED → IN_QUEUE → SERVING → COMPLETED
                    (CANCELLED at any point before COMPLETED)
```

## Prerequisites

- **Python 3.11, 3.12, or 3.13** (Python 3.14 is NOT supported)
- `pip` package manager

## Quick Start

### 1. Navigate to backend

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
python3.12 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Seed Database

```bash
python seed_data.py
```

Expected output:
```
✅ Seed data inserted successfully!
   Centers: 5
   Farmers: 3
   Bookings: 5
```

### 5. Start Server

```bash
python -m uvicorn main:app --reload
```

- Server: `http://127.0.0.1:8000`
- Interactive API Docs: `http://127.0.0.1:8000/docs`

## API Endpoints

### Farmers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/farmers/` | Register a new farmer |
| GET | `/farmers/{id}` | Get farmer profile |

### Centers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/centers/` | List all centers with current load % |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings/` | Book a slot (auto-generates token) |
| GET | `/bookings/farmer/{id}` | Get farmer\'s bookings |
| GET | `/bookings/center/{id}/queue` | Get center queue (admin) |
| GET | `/bookings/{id}/position` | Get queue position & wait time |
| PATCH | `/bookings/{id}/status` | Update booking status |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard statistics |

## Demo Data

| Entity | Count | Details |
|--------|-------|---------|
| Centers | 5 | Ludhiana, Khanna, Moga, Karnal, Ambala |
| Farmers | 3 | Gurpreet Singh, Harpreet Kaur, Baldev Singh |
| Bookings | 5 | Active queue at Ludhiana Grain Market |

## Queue Logic (No Redis)

- **Queue Position**: `COUNT` of active bookings created before yours
- **Wait Time**: `position × 30 minutes` (MVP estimate)
- **Token Generation**: First letter of center + sequence (e.g., `L-100`, `L-101`)

## Team

**Annadata Setu** — IIT Madras BS Degree Programme  
Smart India Hackathon 2026 | Problem Statement SIH26032
