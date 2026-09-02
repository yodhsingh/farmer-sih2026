"""
Annadata Setu - Pydantic Schemas
Request/response models. Separated from DB models for clean API contracts.
"""

from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List

# ---------------------------------------------------------------------------
# FARMER SCHEMAS
# ---------------------------------------------------------------------------
class FarmerBase(BaseModel):
    name: str
    phone: str
    village: str
    district: str
    land_acres: float = 0.0
    bank_account: str = ""

class FarmerCreate(FarmerBase):
    pass

class FarmerResponse(FarmerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# CENTER SCHEMAS
# ---------------------------------------------------------------------------
class CenterBase(BaseModel):
    name: str
    district: str
    max_capacity_kg: float = 50000
    process_rate_kg_per_hour: float = 2000
    is_active: int = 1

class CenterCreate(CenterBase):
    pass

class CenterResponse(CenterBase):
    id: int
    current_load_percent: float = 0.0

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# BOOKING SCHEMAS
# ---------------------------------------------------------------------------
class BookingBase(BaseModel):
    farmer_id: int
    center_id: int
    crop_type: str
    quantity_kg: float
    booked_date: Optional[date] = None

class BookingCreate(BookingBase):
    pass

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
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BookingWithDetails(BaseModel):
    id: int
    token_no: str
    position: int
    farmer_name: str
    crop_type: str
    quantity_kg: float
    status: str
    created_at: datetime

# ---------------------------------------------------------------------------
# STATUS UPDATE SCHEMA
# ---------------------------------------------------------------------------
class StatusUpdate(BaseModel):
    status: str  # PENDING, CONFIRMED, IN_QUEUE, SERVING, COMPLETED, CANCELLED

# ---------------------------------------------------------------------------
# ADMIN STATS SCHEMA
# ---------------------------------------------------------------------------
class AdminStats(BaseModel):
    total_farmers: int
    total_centers: int
    today_bookings: int
    today_completed: int