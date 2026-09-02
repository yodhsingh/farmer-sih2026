from sqlalchemy.orm import Session
from app.models import Booking, BookingStatus

def get_queue_position(booking_id: int, center_id: int, db: Session) -> int:
    """
    Calculate queue position for a booking at a center.
    Position = number of active bookings created BEFORE this one + 1
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        return 0

    position = db.query(Booking).filter(
        Booking.center_id == center_id,
        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_QUEUE]),
        Booking.created_at < booking.created_at
    ).count()

    return position + 1  # 1-based position

def get_estimated_wait_minutes(position: int, avg_time_per_farmer: int = 30) -> int:
    """
    Simple wait time estimate.
    MVP: assume 30 minutes per farmer in queue ahead.
    """
    return position * avg_time_per_farmer

def get_center_queue_list(center_id: int, db: Session):
    """
    Get ordered queue for a center with positions.
    Returns list of dicts with position, token, farmer name, etc.
    """
    bookings = db.query(Booking).filter(
        Booking.center_id == center_id,
        Booking.status.in_([
            BookingStatus.CONFIRMED,
            BookingStatus.IN_QUEUE,
            BookingStatus.SERVING
        ])
    ).order_by(Booking.created_at).all()

    result = []
    for i, b in enumerate(bookings, 1):
        result.append({
            "position": i,
            "id": b.id,
            "token_no": b.token_no,
            "farmer_name": b.farmer.name if b.farmer else "Unknown",
            "crop_type": b.crop_type,
            "quantity_kg": b.quantity_kg,
            "status": b.status.value,
            "created_at": b.created_at
        })
    return result

def generate_token(center_name: str, center_id: int, db: Session) -> str:
    """
    Generate unique token: First letter of center name + sequence number.
    Example: Ludhiana -> L-100, L-101, etc.
    """
    center_initial = center_name[0].upper() if center_name else "X"
    count = db.query(Booking).filter(Booking.center_id == center_id).count()
    return f"{center_initial}-{count + 100}"