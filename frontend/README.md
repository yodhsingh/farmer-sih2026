# Annadata Setu - Frontend (MVP v1)

> Basic React frontend for Annadata Setu MVP.
> Connects to FastAPI backend for farmer registration, slot booking, and queue management.
> Team: Annadata Setu | IIT Madras BS | SIH26032

---

## What This Frontend Does (3 Pages Only)

| Page | Who Uses It | What It Shows |
|------|-------------|---------------|
| **Register** | Farmer | Simple form to register (name, phone, village, district, land size, bank account) |
| **Dashboard** | Farmer | "My Active Booking" card + "Book New Slot" form + past bookings list |
| **Admin** | Center Operator | Live queue table for their mandi + buttons to advance queue |

That is it. No extra pages. No complex features.

---

## Color Theme (Tactile Modernism)

We use these colors everywhere. Do not add random colors.

| Color Name | Hex Code | Use Case |
|-----------|----------|----------|
| **Deep Forest** | `#1A5D1A` | Primary buttons, headers, active states |
| **Harvest Gold** | `#D4A017` | Status badges "In Queue", warnings |
| **Fresh Lime** | `#7CB342` | "Paid", "Completed", success states |
| **Cream Background** | `#FAF9F6` | Page background |
| **Ghost Border** | `#E0DED7` | Card borders, dividers |
| **Dark Text** | `#1A1A1A` | Main text |
| **Muted Text** | `#666666` | Labels, secondary text |

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| **React** | UI library |
| **Vite** | Build tool (fast, replaces create-react-app) |
| **Tailwind CSS** | Styling (utility classes, no separate CSS files needed) |
| **Lucide React** | Icons (simple, clean) |

---

## Project Structure

```
frontend/
├── public/
│   └── (empty for now)
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Route switcher (3 pages)
│   ├── index.css             # Tailwind imports + base styles
│   ├── api.js                # All backend API calls in ONE file
│   ├── pages/
│   │   ├── Register.jsx      # Farmer registration form
│   │   ├── Dashboard.jsx     # Farmer dashboard
│   │   └── Admin.jsx         # Center operator queue view
│   └── components/
│       ├── Navbar.jsx        # Top navigation bar
│       └── StatusBadge.jsx   # Reusable status color badge
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md                 # This file
```

---

## Step-by-Step Setup (For New Team Members)

### Step 1: Install Node.js

Make sure you have Node.js 18+ installed.

```bash
node --version    # Should show v18.x or v20.x
```

If not installed, download from [nodejs.org](https://nodejs.org/).

### Step 2: Create Vite Project

```bash
# Create new folder for frontend
cd /Users/yodhsingh/mvp-sih

# Vite will create the "frontend" folder
npm create vite@latest frontend -- --template react

cd frontend
```

### Step 3: Install Dependencies

```bash
npm install

# Add Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Add icons
npm install lucide-react

# Add router (for switching between pages)
npm install react-router-dom
```

### Step 4: Configure Tailwind

Replace `tailwind.config.js` with this:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: '#1A5D1A',
        'forest-dark': '#004407',
        gold: '#D4A017',
        'gold-dark': '#795900',
        lime: '#7CB342',
        'lime-light': '#91D885',
        cream: '#FAF9F6',
        ghost: '#E0DED7',
        'ghost-dark': '#C0C9BA',
      },
    },
  },
  plugins: [],
}
```

Replace `src/index.css` with this:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #FAF9F6;
  color: #1A1A1A;
  font-family: system-ui, -apple-system, sans-serif;
}
```

### Step 5: Start Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## How to Connect to Backend

Your backend runs at `http://127.0.0.1:8000`. Create `src/api.js`:

```js
// src/api.js
// ALL API calls go here. One file. Simple.

const API_URL = "http://127.0.0.1:8000";

// Helper: generic fetch wrapper
async function apiCall(method, endpoint, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${endpoint}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// FARMER APIs
export const registerFarmer = (data) => apiCall("POST", "/farmers/", data);
export const getFarmer = (id) => apiCall("GET", `/farmers/${id}`);

// CENTER APIs
export const getCenters = () => apiCall("GET", "/centers/");

// BOOKING APIs
export const createBooking = (data) => apiCall("POST", "/bookings/", data);
export const getFarmerBookings = (id) => apiCall("GET", `/bookings/farmer/${id}`);
export const getCenterQueue = (id) => apiCall("GET", `/bookings/center/${id}/queue`);
export const getBookingPosition = (id) => apiCall("GET", `/bookings/${id}/position`);
export const updateBookingStatus = (id, status) =>
  apiCall("PATCH", `/bookings/${id}/status`, { status });

// ADMIN APIs
export const getAdminStats = () => apiCall("GET", "/admin/stats");
```

**Usage in any component:**

```jsx
import { getCenters, createBooking } from "../api";

// In your component:
const centers = await getCenters();
const booking = await createBooking({
  farmer_id: 1,
  center_id: 1,
  crop_type: "Wheat",
  quantity_kg: 2000
});
```

---

## Page Breakdown (What Each Page Needs)

### 1. Register Page (`pages/Register.jsx`)

**What it does:** Farmer fills a form → clicks "Register" → gets Farmer ID.

**Fields needed:**
- Name (text input)
- Phone (text input)
- Village (text input)
- District (text input)
- Land Size in Acres (number input)
- Bank Account (text input)

**After submit:** Show success message with Farmer ID. Button to go to Dashboard.

**API used:** `POST /farmers/`

---

### 2. Dashboard Page (`pages/Dashboard.jsx`)

**What it does:** Farmer sees their active booking + can book a new slot.

**Top section — Active Booking Card:**
- Token number (e.g., "A-142")
- Status badge (color: gold for "In Queue", lime for "Completed")
- Center name
- Position in queue (e.g., "Position: 7")
- Estimated wait time (e.g., "~210 minutes")
- Two buttons: "Refresh" and "Cancel Slot"

**Middle section — Book New Slot:**
- Crop dropdown (Wheat, Rice, etc.)
- Center dropdown (fetch from `/centers/`)
- Quantity input (kg)
- "Book Slot" button (green, big)

**Bottom section — Past Bookings:**
- Simple table: Date | Crop | Quantity | Status | Payment

**APIs used:**
- `GET /farmers/{id}` — for greeting
- `GET /bookings/farmer/{id}` — for booking list
- `GET /bookings/{id}/position` — for queue position
- `POST /bookings/` — to book new slot

---

### 3. Admin Page (`pages/Admin.jsx`)

**What it does:** Center operator sees live queue and manages it.

**Top section — Stats Cards (3 cards in a row):**
- Total Farmers Today
- Active Bookings
- Completed Today

**Middle section — Live Queue Table:**
- Columns: Position | Token | Farmer Name | Crop | Quantity | Status | Actions
- Each row has buttons: "Mark Serving" | "Mark Complete"
- "Next Token" button at top (moves first CONFIRMED to IN_QUEUE)

**APIs used:**
- `GET /admin/stats` — for stat cards
- `GET /bookings/center/{id}/queue` — for queue table
- `PATCH /bookings/{id}/status` — to update status

---

## Routing Setup (`src/App.jsx`)

```jsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

function App() {
  return (
    <BrowserRouter>
      {/* Simple top nav */}
      <nav className="bg-forest text-white p-4 flex gap-6">
        <Link to="/" className="font-bold">Annadata Setu</Link>
        <Link to="/register">Register</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/admin">Admin</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## Common Tailwind Classes We Use

Instead of writing custom CSS, use these Tailwind classes:

| What You Need | Tailwind Classes |
|---------------|-----------------|
| Page background | `bg-cream min-h-screen` |
| Card container | `bg-white rounded-lg border border-ghost p-6 shadow-sm` |
| Primary button | `bg-forest text-white px-6 py-3 rounded-lg hover:bg-forest-dark` |
| Secondary button | `bg-gold text-white px-4 py-2 rounded-lg hover:bg-gold-dark` |
| Input field | `border-b-2 border-ghost bg-transparent py-2 w-full focus:border-forest outline-none` |
| Status badge (In Queue) | `bg-gold/20 text-gold-dark px-3 py-1 rounded-full text-sm font-medium` |
| Status badge (Completed) | `bg-lime/20 text-lime px-3 py-1 rounded-full text-sm font-medium` |
| Heading | `text-2xl font-bold text-forest` |
| Label | `text-sm text-muted uppercase tracking-wide` |

---

## Rules for Team Members

1. **Only 3 pages.** Do not add more pages.
2. **All API calls go in `api.js`.** Do not write `fetch()` inside components.
3. **Use only the colors listed above.** No random colors.
4. **No complex state management.** Use `useState` and `useEffect` only.
5. **Backend must be running** before you test frontend (`python -m uvicorn main:app --reload`).

---

## Backend Must Be Running First

Before testing frontend, start backend:

```bash
cd /Users/yodhsingh/mvp-sih/backend
source .venv/bin/activate
python -m uvicorn main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

---

## Version

**v1.0 MVP** — Basic registration, booking, and queue management.

---

## Team

**Annadata Setu** — IIT Madras BS Degree Programme  
Smart India Hackathon 2026 | Problem Statement SIH26032
