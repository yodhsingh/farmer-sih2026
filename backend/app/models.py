from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

# ---------------------------------------------------------------------------
# ENUMS
# ---------------------------------------------------------------------------
class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    IN_QUEUE = "IN_QUEUE"
    SERVING = "SERVING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PAID = "PAID"

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    village = Column(String, nullable=False)
    district = Column(String, nullable=False)
    land_acres = Column(Float, default=0.0)
    bank_account = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # One Farmer -> Many Bookings
    bookings = relationship("Booking", back_populates="farmer", cascade="all, delete-orphan")

class Center(Base):
    __tablename__ = "centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    max_capacity_kg = Column(Float, default=50000)
    process_rate_kg_per_hour = Column(Float, default=2000)
    is_active = Column(Integer, default=1)

    # One Center -> Many Bookings
    bookings = relationship("Booking", back_populates="center", cascade="all, delete-orphan")

    @property
    def current_load_percent(self):
        today_bookings = [b for b in self.bookings
                         if b.booked_date.date() == datetime.utcnow().date()
                         and b.status in [BookingStatus.CONFIRMED,
                                          BookingStatus.IN_QUEUE,
                                          BookingStatus.SERVING]]
        total_kg = sum(b.quantity_kg for b in today_bookings)
        return round((total_kg / self.max_capacity_kg) * 100, 1) if self.max_capacity_kg else 0

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    center_id = Column(Integer, ForeignKey("centers.id"), nullable=False)

    token_no = Column(String, unique=True, nullable=False)
    crop_type = Column(String, nullable=False)
    quantity_kg = Column(Float, nullable=False)
    booked_date = Column(DateTime, default=datetime.utcnow)

    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.UNPAID)

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    farmer = relationship("Farmer", back_populates="bookings")
    center = relationship("Center", back_populates="bookings")