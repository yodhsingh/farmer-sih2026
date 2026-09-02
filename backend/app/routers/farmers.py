from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Farmer
from app.schemas import FarmerCreate, FarmerResponse

router = APIRouter(prefix="/farmers", tags=["Farmers"])

@router.post("/", response_model=FarmerResponse)
def register_farmer(farmer: FarmerCreate, db: Session = Depends(get_db)):
    """Register a new farmer."""
    db_farmer = Farmer(**farmer.dict())
    db.add(db_farmer)
    db.commit()
    db.refresh(db_farmer)
    return db_farmer

@router.get("/{farmer_id}", response_model=FarmerResponse)
def get_farmer(farmer_id: int, db: Session = Depends(get_db)):
    """Get farmer profile by ID."""
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer