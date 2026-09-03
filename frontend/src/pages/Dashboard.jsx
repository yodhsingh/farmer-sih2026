// src/pages/Dashboard.jsx
// Farmer Dashboard Page
// Shows active booking card with queue position + new slot booking form + past bookings list

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Clock,
  Wheat,
  Scale,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  User,
  XCircle,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  getFarmer,
  getFarmerBookings,
  getBookingPosition,
  getCenters,
  createBooking,
  updateBookingStatus,
  getErrorMessage,
} from "../api";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const [searchParams] = useSearchParams();

  // Farmer ID: check URL query param first, then localStorage, or default to 1 (seeded farmer)
  const initialFarmerId =
    searchParams.get("farmerId") ||
    localStorage.getItem("current_farmer_id") ||
    "1";

  const [farmerId, setFarmerId] = useState(initialFarmerId);
  const [farmer, setFarmer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activePosition, setActivePosition] = useState(null);
  const [centers, setCenters] = useState([]);

  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(false);

  // New Booking Form State
  const [newBooking, setNewBooking] = useState({
    crop_type: "Wheat",
    center_id: "",
    quantity_kg: "",
  });

  // UI alerts
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 1. Fetch Centers
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const centersData = await getCenters();
        setCenters(centersData);
        if (centersData.length > 0) {
          setNewBooking((prev) => ({
            ...prev,
            center_id: centersData[0].id,
          }));
        }
      } catch (err) {
        console.error("Failed to load centers:", err);
      }
    };
    fetchCenters();
  }, []);

  // 2. Fetch Farmer Profile
  const fetchProfile = useCallback(async () => {
    if (!farmerId) return;
    try {
      setLoadingProfile(true);
      setErrorMsg("");
      const profile = await getFarmer(farmerId);
      setFarmer(profile);
      localStorage.setItem("current_farmer_id", String(profile.id));
    } catch (err) {
      console.error("Failed to fetch farmer profile:", err);
      setFarmer(null);
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoadingProfile(false);
    }
  }, [farmerId]);

  // 3. Fetch Farmer Bookings and active booking position
  const fetchBookings = useCallback(async () => {
    if (!farmerId) return;
    try {
      setLoadingBookings(true);
      const bookingsList = await getFarmerBookings(farmerId);
      setBookings(bookingsList);

      // Identify active booking (CONFIRMED, IN_QUEUE, SERVING)
      const active = bookingsList.find((b) =>
        ["CONFIRMED", "IN_QUEUE", "SERVING"].includes(b.status)
      );

      if (active) {
        try {
          const pos = await getBookingPosition(active.id);
          setActivePosition(pos);
        } catch (posErr) {
          console.error("Failed to get queue position:", posErr);
          setActivePosition(null);
        }
      } else {
        setActivePosition(null);
      }
    } catch (err) {
      console.error("Failed to fetch farmer bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  }, [farmerId]);

  useEffect(() => {
    fetchProfile();
    fetchBookings();
  }, [farmerId, fetchProfile, fetchBookings]);

  // Handle Book New Slot
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newBooking.quantity_kg || Number(newBooking.quantity_kg) <= 0) {
      setErrorMsg("Please enter a valid procurement quantity in kg.");
      return;
    }
    if (!newBooking.center_id) {
      setErrorMsg("Please select a mandi procurement center.");
      return;
    }

    try {
      setBookingSlot(true);
      const payload = {
        farmer_id: Number(farmerId),
        center_id: Number(newBooking.center_id),
        crop_type: newBooking.crop_type,
        quantity_kg: parseFloat(newBooking.quantity_kg),
      };

      const res = await createBooking(payload);
      setSuccessMsg(`Slot booked successfully! Assigned Token: ${res.token_no}`);
      setNewBooking((prev) => ({ ...prev, quantity_kg: "" }));

      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      console.error("Booking error:", err);
      setErrorMsg(getErrorMessage(err));
    } finally {
      setBookingSlot(false);
    }
  };

  // Cancel an active slot
  const handleCancelSlot = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this procurement slot?")) {
      return;
    }
    try {
      await updateBookingStatus(bookingId, "CANCELLED");
      setSuccessMsg("Slot cancelled successfully.");
      await fetchBookings();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  // Find active booking object
  const activeBooking = bookings.find((b) =>
    ["CONFIRMED", "IN_QUEUE", "SERVING"].includes(b.status)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Farmer Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ghost pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-forest">
              Farmer Dashboard
            </h1>
            {farmer && (
              <span className="text-xs bg-forest/10 text-forest font-semibold px-2.5 py-0.5 rounded-full border border-forest/20">
                Farmer #{farmer.id}
              </span>
            )}
          </div>
          <p className="text-muted text-sm mt-0.5">
            {farmer
              ? `Welcome, ${farmer.name} (${farmer.village}, ${farmer.district})`
              : "View active queue position and schedule mandi delivery slots."}
          </p>
        </div>

        {/* Quick Farmer ID Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="farmer-id-input" className="text-muted font-medium">
            Switch Farmer ID:
          </label>
          <input
            id="farmer-id-input"
            type="number"
            value={farmerId}
            onChange={(e) => setFarmerId(e.target.value)}
            className="w-20 bg-white border border-ghost rounded-lg px-2.5 py-1.5 font-bold text-forest focus:outline-none focus:border-forest"
          />
          <button
            onClick={() => {
              fetchProfile();
              fetchBookings();
            }}
            className="p-1.5 text-stone-600 hover:text-forest bg-white border border-ghost rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={14} className={loadingBookings ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-lime/15 border border-lime/40 text-forest-dark text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg("")}
            className="text-stone-500 hover:text-stone-800 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TOP SECTION: ACTIVE BOOKING CARD */}
      {activeBooking ? (
        <div className="bg-white rounded-xl border-2 border-forest/30 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ghost pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-forest text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Clock size={24} />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted font-semibold block">
                  Active Mandi Queue Token
                </span>
                <span className="text-3xl font-extrabold text-forest tracking-tight block">
                  {activeBooking.token_no}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={activeBooking.status} />
              <button
                type="button"
                onClick={fetchBookings}
                className="p-2 text-stone-500 hover:text-forest bg-cream rounded-lg border border-ghost hover:border-forest transition"
                title="Refresh queue status"
              >
                <RefreshCw size={16} className={loadingBookings ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Queue Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5">
            <div className="bg-cream/60 p-3 rounded-lg border border-ghost">
              <span className="text-muted text-xs block">Procurement Mandi</span>
              <span className="font-semibold text-stone-900 text-sm block mt-0.5">
                {activePosition?.center_name || "Ludhiana Grain Market"}
              </span>
            </div>

            <div className="bg-cream/60 p-3 rounded-lg border border-ghost">
              <span className="text-muted text-xs block">Position in Line</span>
              <span className="font-bold text-forest text-lg block mt-0.5">
                {activePosition?.position ? `#${activePosition.position}` : "Active"}
              </span>
            </div>

            <div className="bg-cream/60 p-3 rounded-lg border border-ghost">
              <span className="text-muted text-xs block">Estimated Wait</span>
              <span className="font-bold text-gold-dark text-lg block mt-0.5">
                ~{activePosition?.estimated_wait_minutes ?? 30} mins
              </span>
            </div>

            <div className="bg-cream/60 p-3 rounded-lg border border-ghost">
              <span className="text-muted text-xs block">Declared Crop</span>
              <span className="font-semibold text-stone-900 text-sm block mt-0.5">
                {activeBooking.crop_type} ({activeBooking.quantity_kg} kg)
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between">
            <p className="text-xs text-stone-500">
              Please reach the mandi premises 15 minutes before your estimated time for initial moisture testing.
            </p>
            <button
              type="button"
              onClick={() => handleCancelSlot(activeBooking.id)}
              className="inline-flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 font-medium hover:underline"
            >
              <XCircle size={14} />
              Cancel Slot
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-ghost p-6 text-center text-muted">
          <Clock size={32} className="mx-auto text-stone-400 mb-2" />
          <p className="font-medium text-stone-800">No Active Slot Right Now</p>
          <p className="text-xs mt-1">
            Book a new procurement slot below to secure your entry token.
          </p>
        </div>
      )}

      {/* MIDDLE SECTION: BOOK NEW SLOT FORM */}
      <div className="bg-white rounded-xl border border-ghost p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-ghost pb-3">
          <PlusCircle size={20} className="text-forest" />
          <h2 className="text-lg font-bold text-forest">
            Schedule New Mandi Slot
          </h2>
        </div>

        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Crop Type */}
            <div>
              <label
                htmlFor="crop_type"
                className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
              >
                Crop Type
              </label>
              <select
                id="crop_type"
                value={newBooking.crop_type}
                onChange={(e) =>
                  setNewBooking((prev) => ({ ...prev, crop_type: e.target.value }))
                }
                className="w-full bg-cream border border-ghost rounded-lg px-3 py-2 text-sm font-medium text-stone-900 focus:outline-none focus:border-forest"
              >
                <option value="Wheat">Wheat (Kanak)</option>
                <option value="Rice">Rice (Paddy / Jhona)</option>
                <option value="Maize">Maize (Makki)</option>
                <option value="Barley">Barley (Jau)</option>
                <option value="Cotton">Cotton (Narma)</option>
              </select>
            </div>

            {/* Procurement Center */}
            <div>
              <label
                htmlFor="center_id"
                className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
              >
                Mandi Center
              </label>
              <select
                id="center_id"
                value={newBooking.center_id}
                onChange={(e) =>
                  setNewBooking((prev) => ({ ...prev, center_id: e.target.value }))
                }
                className="w-full bg-cream border border-ghost rounded-lg px-3 py-2 text-sm font-medium text-stone-900 focus:outline-none focus:border-forest"
              >
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity in kg */}
            <div>
              <label
                htmlFor="quantity_kg"
                className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
              >
                Quantity (in kg)
              </label>
              <input
                id="quantity_kg"
                type="number"
                min="100"
                step="50"
                placeholder="e.g. 2000"
                value={newBooking.quantity_kg}
                onChange={(e) =>
                  setNewBooking((prev) => ({ ...prev, quantity_kg: e.target.value }))
                }
                className="w-full bg-cream border border-ghost rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={bookingSlot || !farmer}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-forest text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-forest-dark transition disabled:opacity-50 shadow-xs"
          >
            {bookingSlot ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Scheduling Slot...</span>
              </>
            ) : (
              <>
                <span>Book Slot</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* BOTTOM SECTION: PAST BOOKINGS TABLE */}
      <div className="bg-white rounded-xl border border-ghost shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-ghost flex items-center justify-between bg-cream/30">
          <h2 className="text-base font-bold text-forest">
            Booking History & MSP Payment Status
          </h2>
          <span className="text-xs text-muted">
            {bookings.length} Total Bookings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 uppercase text-[11px] font-semibold tracking-wider border-b border-ghost">
              <tr>
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-4">Booked Date</th>
                <th className="py-3 px-4">Crop</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Queue Status</th>
                <th className="py-3 px-4">MSP Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ghost">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted text-xs">
                    No bookings recorded for this farmer.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-cream/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-forest">
                      {b.token_no}
                    </td>
                    <td className="py-3 px-4 text-xs text-stone-600">
                      {new Date(b.booked_date || b.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-stone-800">
                      {b.crop_type}
                    </td>
                    <td className="py-3 px-4 text-xs text-stone-700">
                      {b.quantity_kg?.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.payment_status || "UNPAID"} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}