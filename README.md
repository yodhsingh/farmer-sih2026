# Annadata Setu 

[Deployed Link](https://farmer-sih2026.vercel.app)

Smart procurement scheduling and queue management for farmers.

| Section | Link |
|---|---|
| Backend | [FastAPI + SQLite](backend/README.md) |
| Frontend | [React Application](frontend/README.md) |

## Problem

| Challenge | Impact |
|---|---|
| No information about center capacity | Farmers travel without knowing where to go |
| No queue visibility | Long and uncertain waiting times |
| Poor coordination between centers | Some centers are overcrowded while others remain unused |
| Unplanned journeys | Wasted fuel, time, and money |

## Solution

| Farmer Side | Procurement Center Side |
|---|---|
| Register with basic details | View live farmer queues |
| Select crop, quantity, center, and date | Call the next token |
| Book a confirmed slot | Update processing status |
| Receive a unique queue token | Mark bookings as complete |
| Track queue position and wait time | Monitor center capacity |
| View booking and payment status | Redirect farmers to less-loaded centers |

## MVP Flow

| Step | System Action |
|---|---|
| 1 | Farmer submits registration details |
| 2 | Farmer selects crop, quantity, center, and date |
| 3 | System checks center capacity |
| 4 | Slot is confirmed and a token is generated |
| 5 | Token is added to the center queue |
| 6 | Queue positions update as farmers are served |
| 7 | Operator marks the booking complete |

## Queue Logic

| Event | Result |
|---|---|
| New booking | Token is added to the queue |
| Next token selected | The next farmer moves into service |
| Booking completed | Payment and status are updated |
| Center near capacity | System suggests another available center |

## Phase 2

| Access Method | Benefit |
|---|---|
| SMS | Farmers without smartphones receive tokens and updates |
| WhatsApp | Farmers can access booking and queue information |
| Assisted kiosk | Center staff can book slots for farmers |

The access method may change, but the core booking, token, queue, and capacity-balancing logic remains the same.
