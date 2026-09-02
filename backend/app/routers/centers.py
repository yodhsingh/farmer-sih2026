
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Center
from app.schemas import CenterResponse

router = APIRouter(prefix="/centers", tags=["Centers"])

@router.get("/", response_model=List[CenterResponse])
def list_centers(db: Session = Depends(get_db)):
    """List all active centers with current load percentage."""
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