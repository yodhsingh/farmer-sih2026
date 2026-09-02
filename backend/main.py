"""
Annadata Setu - MVP Backend
FastAPI + SQLite. 8 endpoints. No extras.
Run: uvicorn main:app --reload
"""

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional

from models import (
    SessionLocal, engine, Base,
    Farmer, Center, Booking,
    BookingStatus, PaymentStatus
)

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Annadata Setu MVP", version="1.0")

# ---------------------------------------------------------------------------
# DATABASE DEPENDENCY
# ---------------------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------------------------------------------------------
# SCHEMAS (Pydantic - what goes in and out of API)
# ---------------------------------------------------------------------------

class FarmerCreate(BaseModel):
    name: str
    phone: str
    village: str
    district: str
    land_acres: float = 0.0
    bank_account: str = ""

class FarmerResponse(BaseModel):
    id: int
    name: str
    phone: str
    village: str
    district: str
    land_acres: float
    bank_account: str
    class Config:
        from_attributes = True

class CenterResponse(BaseModel):
    id: int
    name: str
    district: str
    max_capacity_kg: float
    process_rate_kg_per_hour: float
    is_active: int
    current_load_percent: float = 0.0
    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    farmer_id: int
    center_id: int
    crop_type: str
    quantity_kg: float
    booked_date: Optional[date] = None

class BookingResponse(BaseModel):
    id: int
    token_no: str
    farmer_id: int
    center_id: int
    crop_type: str
    quantity_kg: float
    status: str
    payment_status: str
    booked_date: datetime
    created_at: datetime
    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: str  # PENDING, CONFIRMED, IN_QUEUE, SERVING, COMPLETED, CANCELLED

# ---------------------------------------------------------------------------
# ENDPOINT 1: Register Farmer
# ---------------------------------------------------------------------------
@app.post("/farmers", response_model=FarmerResponse)
def register_farmer(farmer: FarmerCreate, db: Session = Depends(get_db)):
    db_farmer = Farmer(**farmer.dict())
    db.add(db_farmer)
    db.commit()
    db.refresh(db_farmer)
    return db_farmer

# ---------------------------------------------------------------------------
# ENDPOINT 2: Get Farmer Profile
# ---------------------------------------------------------------------------
@app.get("/farmers/{farmer_id}", response_model=FarmerResponse)
def get_farmer(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer

# ---------------------------------------------------------------------------
# ENDPOINT 3: List All Centers (with load %)
# ---------------------------------------------------------------------------
@app.get("/centers", response_model=List[CenterResponse])
def list_centers(db: Session = Depends(get_db)):
    centers = db.query(Center).all()
    result = []
    for c in centers:
        data = {
            "id": c.id,
            "name": c.name,
            "district": c.district,
            "max_capacity_kg": c.max_capacity_kg,
            "process_rate_kg_per_hour": c.process_rate_kg_per_hour,
            "is_active": c.is_active,
            "current_load_percent": c.current_load_percent
        }
        result.append(CenterResponse(**data))
    return result

# ---------------------------------------------------------------------------
# ENDPOINT 4: Book a Slot
# ---------------------------------------------------------------------------
@app.post("/bookings", response_model=BookingResponse)
def create_booking(booking: BookingCreate, db: Session = Depends(get_db)):
    # Verify farmer and center exist
    farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first()
    center = db.query(Center).filter(Center.id == booking.center_id).first()
    if not farmer or not center:
        raise HTTPException(status_code=404, detail="Farmer or Center not found")

    # Generate token: Center initial + booking count + 1
    center_initial = center.name[0].upper()
    count = db.query(Booking).filter(Booking.center_id == center.id).count()
    token = f"{center_initial}-{count + 100}"

    db_booking = Booking(
        farmer_id=booking.farmer_id,
        center_id=booking.center_id,
        crop_type=booking.crop_type,
        quantity_kg=booking.quantity_kg,
        token_no=token,
        status=BookingStatus.CONFIRMED,  # Auto-confirm for MVP
        booked_date=datetime.combine(booking.booked_date or date.today(), datetime.min.time())
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

# ---------------------------------------------------------------------------
# ENDPOINT 5: Get Farmer's Bookings
# ---------------------------------------------------------------------------
@app.get("/bookings/farmer/{farmer_id}", response_model=List[BookingResponse])
def get_farmer_bookings(farmer_id: int, db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.farmer_id == farmer_id).order_by(Booking.created_at.desc()).all()
    return bookings

# ---------------------------------------------------------------------------
# ENDPOINT 6: Get Center's Queue (Admin View)
# ---------------------------------------------------------------------------
@app.get("/bookings/center/{center_id}")
def get_center_queue(center_id: int, db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(
        Booking.center_id == center_id,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_QUEUE, BookingStatus.SERVING])
    ).order_by(Booking.created_at).all()

    result = []
    for i, b in enumerate(bookings, 1):
        result.append({
            "position": i,
            "token_no": b.token_no,
            "farmer_name": b.farmer.name,
            "crop_type": b.crop_type,
            "quantity_kg": b.quantity_kg,
            "status": b.status.value,
            "created_at": b.created_at
        })
    return result

# ---------------------------------------------------------------------------
# ENDPOINT 7: Update Booking Status (Admin Action)
# ---------------------------------------------------------------------------
@app.patch("/bookings/{booking_id}/status")
def update_status(booking_id: int, update: StatusUpdate, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    try:
        new_status = BookingStatus(update.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")

    booking.status = new_status
    if new_status == BookingStatus.COMPLETED:
        booking.completed_at = datetime.utcnow()
        booking.payment_status = PaymentStatus.PAID  # Auto-mark paid on completion

    db.commit()
    db.refresh(booking)
    return {"message": f"Status updated to {new_status.value}", "booking_id": booking.id}

# ---------------------------------------------------------------------------
# ENDPOINT 8: Admin Stats Dashboard
# ---------------------------------------------------------------------------
@app.get("/admin/stats")
def get_stats(db: Session = Depends(get_db)):
    total_farmers = db.query(Farmer).count()
    total_centers = db.query(Center).count()

    today = datetime.utcnow().date()
    today_bookings = db.query(Booking).filter(
        Booking.booked_date >= datetime.combine(today, datetime.min.time())
    ).count()

    today_completed = db.query(Booking).filter(
        Booking.status == BookingStatus.COMPLETED,
        Booking.completed_at >= datetime.combine(today, datetime.min.time())
    ).count()

    return {
        "total_farmers": total_farmers,
        "total_centers": total_centers,
        "today_bookings": today_bookings,
        "today_completed": today_completed
    }

# ---------------------------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {"message": "Annadata Setu MVP is running!"}
