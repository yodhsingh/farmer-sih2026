"""
Annadata Setu - Seed Data
Pre-populates the database with demo data for hackathon presentation.
Run: python seed_data.py
"""

from sqlalchemy.orm import Session
from models import SessionLocal, Farmer, Center, Booking, BookingStatus, PaymentStatus
from datetime import datetime

def seed_database():
    db = SessionLocal()

    # Clear existing data (optional - for clean slate)
    db.query(Booking).delete()
    db.query(Farmer).delete()
    db.query(Center).delete()
    db.commit()

    # ==================== CENTERS ====================
    centers = [
        Center(name="Ludhiana Grain Market", district="Ludhiana", 
               max_capacity_kg=50000, process_rate_kg_per_hour=2000, is_active=1),
        Center(name="Khanna Mandi", district="Ludhiana", 
               max_capacity_kg=30000, process_rate_kg_per_hour=1500, is_active=1),
        Center(name="Moga Grain Market", district="Moga", 
               max_capacity_kg=40000, process_rate_kg_per_hour=1800, is_active=1),
        Center(name="Karnal Mandi", district="Karnal", 
               max_capacity_kg=35000, process_rate_kg_per_hour=1600, is_active=1),
        Center(name="Ambala Center", district="Ambala", 
               max_capacity_kg=25000, process_rate_kg_per_hour=1200, is_active=1),
    ]
    for c in centers:
        db.add(c)
    db.commit()

    # ==================== FARMERS ====================
    farmers = [
        Farmer(name="Gurpreet Singh", phone="9876543210", village="Phagwara", 
                district="Kapurthala", land_acres=12.5, bank_account="12345678901"),
        Farmer(name="Harpreet Kaur", phone="9876543211", village="Jalandhar", 
                district="Jalandhar", land_acres=8.0, bank_account="12345678902"),
        Farmer(name="Baldev Singh", phone="9876543212", village="Ludhiana", 
                district="Ludhiana", land_acres=15.0, bank_account="12345678903"),
    ]
    for f in farmers:
        db.add(f)
    db.commit()

    # ==================== BOOKINGS ====================
    today = datetime.utcnow()

    bookings = [
        # Gurpreet at Ludhiana - IN_QUEUE (active demo)
        Booking(farmer_id=1, center_id=1, token_no="L-100", crop_type="Wheat", 
                quantity_kg=2000, status=BookingStatus.IN_QUEUE, 
                payment_status=PaymentStatus.UNPAID, booked_date=today),

        # Harpreet at Khanna - CONFIRMED
        Booking(farmer_id=2, center_id=2, token_no="K-100", crop_type="Rice", 
                quantity_kg=1500, status=BookingStatus.CONFIRMED, 
                payment_status=PaymentStatus.UNPAID, booked_date=today),

        # Baldev at Ludhiana - SERVING (currently being processed)
        Booking(farmer_id=3, center_id=1, token_no="L-101", crop_type="Wheat", 
                quantity_kg=3000, status=BookingStatus.SERVING, 
                payment_status=PaymentStatus.UNPAID, booked_date=today),

        # Extra bookings at Ludhiana to show queue
        Booking(farmer_id=1, center_id=1, token_no="L-102", crop_type="Wheat", 
                quantity_kg=1800, status=BookingStatus.CONFIRMED, 
                payment_status=PaymentStatus.UNPAID, booked_date=today),
        Booking(farmer_id=2, center_id=1, token_no="L-103", crop_type="Rice", 
                quantity_kg=2200, status=BookingStatus.CONFIRMED, 
                payment_status=PaymentStatus.UNPAID, booked_date=today),
    ]
    for b in bookings:
        db.add(b)
    db.commit()

    print("✅ Seed data inserted successfully!")
    print(f"   Centers: {db.query(Center).count()}")
    print(f"   Farmers: {db.query(Farmer).count()}")
    print(f"   Bookings: {db.query(Booking).count()}")

    db.close()

if __name__ == "__main__":
    seed_database()
