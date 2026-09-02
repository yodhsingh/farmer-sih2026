"""
Annadata Setu - MVP Models
Only 3 tables. Clean relationships. No extras.
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime
import enum

Base = declarative_base()

# ---------------------------------------------------------------------------
# ENUMS
# ---------------------------------------------------------------------------
class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"       # Just created, not yet confirmed
    CONFIRMED = "CONFIRMED"   # Slot allocated, farmer should come
    IN_QUEUE = "IN_QUEUE"     # Farmer arrived, waiting in line
    SERVING = "SERVING"       # Currently being served
    COMPLETED = "COMPLETED"   # Procurement done
    CANCELLED = "CANCELLED"   # Slot cancelled

class PaymentStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PAID = "PAID"

# ---------------------------------------------------------------------------
# TABLE 1: FARMER
# ---------------------------------------------------------------------------
# What: Stores farmer identity and basic farm info
# Why MVP: Need to know WHO is booking the slot
# ---------------------------------------------------------------------------
class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)           # Full name
    phone = Column(String, nullable=False)          # Mobile number
    village = Column(String, nullable=False)        # Village name
    district = Column(String, nullable=False)       # District (used to find nearby centers)
    land_acres = Column(Float, default=0.0)         # Farm size
    bank_account = Column(String)                   # For payment (MVP: just store it)
    created_at = Column(DateTime, default=datetime.utcnow)

    # RELATIONSHIP: One Farmer -> Many Bookings
    # This lets you do: farmer.bookings to get all their slots
    bookings = relationship("Booking", back_populates="farmer")

# ---------------------------------------------------------------------------
# TABLE 2: CENTER (Mandi / Procurement Center)
# ---------------------------------------------------------------------------
# What: Stores Mandi center details and capacity
# Why MVP: Need to know WHERE the farmer goes and HOW MUCH it can handle
# ---------------------------------------------------------------------------
class Center(Base):
    __tablename__ = "centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)             # e.g., "Ludhiana Grain Market"
    district = Column(String, nullable=False)       # e.g., "Ludhiana"
    max_capacity_kg = Column(Float, default=50000)  # Daily capacity in kg
    process_rate_kg_per_hour = Column(Float, default=2000)  # How fast center works
    is_active = Column(Integer, default=1)            # 1 = open, 0 = closed

    # RELATIONSHIP: One Center -> Many Bookings
    # This lets you do: center.bookings to get all farmers coming here
    bookings = relationship("Booking", back_populates="center")

    # Helper property: calculate current load % (not stored, computed on fly)
    @property
    def current_load_percent(self):
        """Simple: count today's confirmed+active bookings vs capacity"""
        today_bookings = [b for b in self.bookings 
                         if b.booked_date.date() == datetime.utcnow().date()
                         and b.status in [BookingStatus.CONFIRMED, 
                                          BookingStatus.IN_QUEUE, 
                                          BookingStatus.SERVING]]
        total_kg = sum(b.quantity_kg for b in today_bookings)
        return round((total_kg / self.max_capacity_kg) * 100, 1) if self.max_capacity_kg else 0

# ---------------------------------------------------------------------------
# TABLE 3: BOOKING (The Core Table - Links Farmer + Center)
# ---------------------------------------------------------------------------
# What: One row = one slot booking. This IS the queue.
# Why MVP: Everything flows through this table:
#   - Farmer books a slot  -> new row with status=PENDING
#   - Admin confirms       -> status=CONFIRMED
#   - Farmer arrives       -> status=IN_QUEUE
#   - It's their turn      -> status=SERVING
#   - Done                 -> status=COMPLETED
# ---------------------------------------------------------------------------
class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    # FOREIGN KEYS: Link to Farmer and Center
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    center_id = Column(Integer, ForeignKey("centers.id"), nullable=False)

    # BOOKING DETAILS
    token_no = Column(String, unique=True, nullable=False)  # e.g., "A-142"
    crop_type = Column(String, nullable=False)              # Wheat, Rice, etc.
    quantity_kg = Column(Float, nullable=False)             # How much they're bringing
    booked_date = Column(DateTime, default=datetime.utcnow) # Which day they booked for

    # STATUS TRACKING
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.UNPAID)

    # TIMESTAMPS
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # RELATIONSHIPS: Link back to Farmer and Center
    farmer = relationship("Farmer", back_populates="bookings")
    center = relationship("Center", back_populates="bookings")

    # Helper: Queue position at this center
    @property
    def queue_position(self, db_session):
        """
        Count how many active bookings at this center were created BEFORE this one.
        This gives the farmer their position in line.
        """
        from sqlalchemy import func
        position = db_session.query(Booking).filter(
            Booking.center_id == self.center_id,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_QUEUE]),
            Booking.created_at < self.created_at
        ).count()
        return position + 1  # 1-based position

    # Helper: Estimated wait time
    @property  
    def estimated_wait_minutes(self):
        """
        Simple estimate: assume 30 mins per farmer in queue ahead.
        MVP formula. Can be improved with real process rate data later.
        """
        avg_time_per_farmer = 30  # minutes
        # We need queue_position here - in real code, pass it in or compute separately
        return f"~{avg_time_per_farmer} min per person ahead"


# ---------------------------------------------------------------------------
# DATABASE SETUP (One-liner to create everything)
# ---------------------------------------------------------------------------
# Usage: from models import engine, Base, Farmer, Center, Booking
#        Base.metadata.create_all(bind=engine)
# ---------------------------------------------------------------------------
engine = create_engine("sqlite:///./annadata_setu.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)
