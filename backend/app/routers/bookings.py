"""
Booking Routes
Handles slot booking, queue management, and status updates.
Combines 'slots' and 'queue' from original plan into one clean router.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List

from app.database import get_db
from app.models import Farmer, Center, Booking, BookingStatus, PaymentStatus
from app.schemas import BookingCreate, BookingResponse, StatusUpdate, BookingWithDetails
from app.queue_service import (
    get_queue_position,
    get_estimated_wait_minutes,
    get_center_queue_list,
    generate_token
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])

# ---------------------------------------------------------------------------
# CREATE BOOKING
# ---------------------------------------------------------------------------
@router.post("/", response_model=BookingResponse)
def create_booking(booking: BookingCreate, db: Session = Depends(get_db)):
    """Farmer books a slot at a center. Auto-generates token."""
    farmer = db.query(Farmer).filter(Farmer.id == booking.farmer_id).first()
    center = db.query(Center).filter(Center.id == booking.center_id).first()

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    if not center:
        raise HTTPException(status_code=404, detail="Center not found")

    token = generate_token(center.name, center.id, db)

    db_booking = Booking(
        farmer_id=booking.farmer_id,
        center_id=booking.center_id,
        crop_type=booking.crop_type,
        quantity_kg=booking.quantity_kg,
        token_no=token,
        status=BookingStatus.CONFIRMED,
        booked_date=datetime.combine(booking.booked_date or date.today(), datetime.min.time())
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

# ---------------------------------------------------------------------------
# GET FARMER'S BOOKINGS
# ---------------------------------------------------------------------------
@router.get("/farmer/{farmer_id}", response_model=List[BookingResponse])
def get_farmer_bookings(farmer_id: int, db: Session = Depends(get_db)):
    """Get all bookings for a specific farmer."""
    bookings = db.query(Booking).filter(
        Booking.farmer_id == farmer_id
    ).order_by(Booking.created_at.desc()).all()
    return bookings

# ---------------------------------------------------------------------------
# GET CENTER QUEUE (Admin View)
# ---------------------------------------------------------------------------
@router.get("/center/{center_id}/queue")
def get_center_queue(center_id: int, db: Session = Depends(get_db)):
    """Get live queue for a center. Ordered by creation time."""
    queue = get_center_queue_list(center_id, db)
    return queue

# ---------------------------------------------------------------------------
# GET BOOKING WITH QUEUE POSITION
# ---------------------------------------------------------------------------
@router.get("/{booking_id}/position")
def get_booking_position(booking_id: int, db: Session = Depends(get_db)):
    """Get queue position and estimated wait time for a booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    position = get_queue_position(booking_id, booking.center_id, db)
    wait_minutes = get_estimated_wait_minutes(position)

    return {
        "booking_id": booking_id,
        "token_no": booking.token_no,
        "center_name": booking.center.name if booking.center else "Unknown",
        "position": position,
        "estimated_wait_minutes": wait_minutes,
        "status": booking.status.value
    }

# ---------------------------------------------------------------------------
# UPDATE BOOKING STATUS
# ---------------------------------------------------------------------------
@router.patch("/{booking_id}/status")
def update_status(booking_id: int, update: StatusUpdate, db: Session = Depends(get_db)):
    """Update booking status. Used by admin to advance queue."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    try:
        new_status = BookingStatus(update.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status. Use: PENDING, CONFIRMED, IN_QUEUE, SERVING, COMPLETED, CANCELLED")

    booking.status = new_status
    if new_status == BookingStatus.COMPLETED:
        booking.completed_at = datetime.utcnow()
        booking.payment_status = PaymentStatus.PAID

    db.commit()
    db.refresh(booking)
    return {
        "message": f"Status updated to {new_status.value}",
        "booking_id": booking.id,
        "token_no": booking.token_no
    }