from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import farmers, centers, bookings, admin

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Annadata Setu MVP",
    description="Smart agricultural procurement scheduling & queue management",
    version="1.0.0"
)

# ---------------------------------------------------------------------------
# CORS - Allow frontend to connect
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# REGISTER ROUTERS
# ---------------------------------------------------------------------------
app.include_router(farmers.router)
app.include_router(centers.router)
app.include_router(bookings.router)
app.include_router(admin.router)

# ---------------------------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {
        "message": "Annadata Setu MVP is running! 🌾",
        "docs": "/docs",
        "version": "1.0.0"
    }