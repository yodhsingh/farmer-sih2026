"""
Admin Routes
Dashboard statistics and system overview.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import Farmer, Center, Booking, BookingStatus
from app.schemas import AdminStats

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    total_farmers = db.query(Farmer).count()
    total_centers = db.query(Center).count()

    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    today_bookings = db.query(Booking).filter(
        Booking.booked_date >= today_start
    ).count()

    today_completed = db.query(Booking).filter(
        Booking.status == BookingStatus.COMPLETED,
        Booking.completed_at >= today_start
    ).count()

    return AdminStats(
        total_farmers=total_farmers,
        total_centers=total_centers,
        today_bookings=today_bookings,
        today_completed=today_completed
    )