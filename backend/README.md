# Annadata Setu - Backend (MVP)

> Smart agricultural procurement scheduling, digital queue management, and capacity load-balancing platform.
> Built for SIH26032 — Ministry of Consumer Affairs, Food & Public Distribution.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI |
| Database | SQLite (via SQLAlchemy) |
| ORM | SQLAlchemy 2.0 |
| Validation | Pydantic v2 |
| Server | Uvicorn |

## Prerequisites

- **Python 3.11, 3.12, or 3.13** (Python 3.14 is NOT supported)
- `pip` package manager

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   └── models.py          # 3 core tables: Farmer, Center, Booking
├── main.py                # All 8 API endpoints
├── seed_data.py           # Demo data (5 centers, 3 farmers, 5 bookings)
├── requirements.txt       # Python dependencies
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Quick Start

### 1. Clone & Navigate

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

Output:
```
Seed data inserted successfully!
   Centers: 5
   Farmers: 3
   Bookings: 5
```

### 5. Start Server

```bash
python -m uvicorn main:app --reload
```

Server runs at: `http://127.0.0.1:8000`

Interactive API docs: `http://127.0.0.1:8000/docs`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/farmers` | Register a new farmer |
| GET | `/farmers/{id}` | Get farmer profile |
| GET | `/centers` | List all centers with load % |
| POST | `/bookings` | Book a slot |
| GET | `/bookings/farmer/{id}` | Get farmer\'s bookings |
| GET | `/bookings/center/{id}` | Get center queue (admin) |
| PATCH | `/bookings/{id}/status` | Update booking status |
| GET | `/admin/stats` | Dashboard statistics |

## Data Model

```
Farmer (1) ────────< Booking >──────── (1) Center
```

**3 Tables Only:**
- **Farmer** — Identity, location, farm info
- **Center** — Mandi name, capacity, processing rate
- **Booking** — The queue. Links farmer + center. Status tracks lifecycle.

## Booking Status Lifecycle

```
PENDING → CONFIRMED → IN_QUEUE → SERVING → COMPLETED
                    (CANCELLED at any point before COMPLETED)
```

## Demo Data Included

| Entity | Count | Details |
|--------|-------|---------|
| Centers | 5 | Ludhiana, Khanna, Moga, Karnal, Ambala |
| Farmers | 3 | Gurpreet Singh, Harpreet Kaur, Baldev Singh |
| Bookings | 5 | Active queue at Ludhiana Grain Market |

## Team

**Annadata Setu** — IIT Madras BS Degree Programme  
Smart India Hackathon 2026 | Problem Statement SIH26032
