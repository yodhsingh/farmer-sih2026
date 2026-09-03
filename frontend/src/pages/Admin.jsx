// src/pages/Admin.jsx
// Mandi Center Operator & Queue Admin Dashboard
// Connects to GET /admin/stats, GET /centers/, GET /bookings/center/{id}/queue, PATCH /bookings/{id}/status

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Building2,
  CalendarCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowRight,
  Play,
  Check,
  AlertCircle,
  Clock,
  Wheat,
  Scale,
  Sparkles,
} from "lucide-react";
import {
  getAdminStats,
  getCenters,
  getCenterQueue,
  updateBookingStatus,
  getErrorMessage,
} from "../api";
import StatusBadge from "../components/StatusBadge";

export default function Admin() {
  // Center selection state
  const [centers, setCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState(null);

  // Stats state
  const [stats, setStats] = useState({
    total_farmers: 0,
    total_centers: 0,
    today_bookings: 0,
    today_completed: 0,
  });

  // Queue state
  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Notification / Alert message
  const [notification, setNotification] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // 1. Fetch Centers on initial mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const centersData = await getCenters();
        setCenters(centersData);
        if (centersData.length > 0) {
          setSelectedCenterId(centersData[0].id);
        }
      } catch (err) {
        console.error("Failed to load centers:", err);
        setErrorMsg(getErrorMessage(err));
      }
    };
    fetchInitialData();
  }, []);

  // 2. Fetch Admin Stats
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // 3. Fetch Queue for selected center
  const fetchQueue = useCallback(async () => {
    if (!selectedCenterId) return;
    try {
      setLoadingQueue(true);
      setErrorMsg("");
      const queueData = await getCenterQueue(selectedCenterId);
      setQueue(queueData);
    } catch (err) {
      console.error("Failed to fetch center queue:", err);
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoadingQueue(false);
    }
  }, [selectedCenterId]);

  // Load stats and queue when selectedCenterId changes
  useEffect(() => {
    fetchStats();
    fetchQueue();
  }, [selectedCenterId, fetchStats, fetchQueue]);

  // Auto-refresh interval (every 10 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats();
      fetchQueue();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStats, fetchQueue]);

  // Update a booking's status
  const handleStatusChange = async (bookingId, newStatus, tokenNo) => {
    try {
      setUpdatingId(bookingId);
      await updateBookingStatus(bookingId, newStatus);
      showNotification(`Token ${tokenNo} updated to ${newStatus}`);
      // Refresh both stats and queue
      await Promise.all([fetchQueue(), fetchStats()]);
    } catch (err) {
      console.error("Status update error:", err);
      setErrorMsg(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  // "Next Token" smart action:
  // Finds the next eligible booking to advance:
  // 1. If any is CONFIRMED, moves first to IN_QUEUE
  // 2. Or if IN_QUEUE, moves first to SERVING
  const handleAdvanceNextToken = async () => {
    // Check for next CONFIRMED booking
    const nextConfirmed = queue.find((b) => b.status === "CONFIRMED");
    if (nextConfirmed) {
      await handleStatusChange(nextConfirmed.id, "IN_QUEUE", nextConfirmed.token_no);
      return;
    }

    // Else check for next IN_QUEUE booking to move to SERVING
    const nextInQueue = queue.find((b) => b.status === "IN_QUEUE");
    if (nextInQueue) {
      await handleStatusChange(nextInQueue.id, "SERVING", nextInQueue.token_no);
      return;
    }

    showNotification("No pending tokens to advance in this center queue.", "info");
  };

  // Find currently active center object
  const activeCenter = centers.find((c) => c.id === Number(selectedCenterId));

  // Filtered Queue list
  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.token_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.crop_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-ghost pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-forest">
              Mandi Queue & Procurement Operations
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-forest/10 text-forest border border-forest/20">
              Center Operator View
            </span>
          </div>
          <p className="text-muted text-sm mt-0.5">
            Real-time digital token dispatching, weighing, and MSP payment queue clearance.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              autoRefresh
                ? "bg-lime/20 text-forest-dark border-lime/40"
                : "bg-stone-100 text-stone-500 border-stone-300"
            }`}
            title="Auto-refresh queue every 10s"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? "bg-forest animate-pulse" : "bg-stone-400"
              }`}
            />
            Auto-sync {autoRefresh ? "ON" : "OFF"}
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchQueue();
            }}
            disabled={loadingQueue || loadingStats}
            className="inline-flex items-center gap-1.5 bg-white text-stone-700 hover:text-forest px-3.5 py-1.5 rounded-lg text-xs font-medium border border-ghost hover:border-forest transition shadow-xs"
          >
            <RefreshCw
              size={14}
              className={loadingQueue || loadingStats ? "animate-spin text-forest" : ""}
            />
            Sync Now
          </button>
        </div>
      </div>

      {/* Notifications / Errors */}
      {notification && (
        <div
          className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
            notification.type === "success"
              ? "bg-lime/15 text-forest-dark border-lime/40"
              : "bg-amber-50 text-amber-900 border-amber-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notification.msg}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-500 hover:text-stone-800 text-xs font-bold px-1"
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

      {/* STATS CARDS ROW (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Farmers */}
        <div className="bg-white rounded-xl border border-ghost p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0 border border-forest/20">
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs font-medium text-muted uppercase tracking-wider block">
              Registered Farmers
            </span>
            <span className="text-2xl font-bold text-stone-900 block mt-0.5">
              {stats.total_farmers}
            </span>
          </div>
        </div>

        {/* Active Centers */}
        <div className="bg-white rounded-xl border border-ghost p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-gold-dark flex items-center justify-center shrink-0 border border-gold/30">
            <Building2 size={22} />
          </div>
          <div>
            <span className="text-xs font-medium text-muted uppercase tracking-wider block">
              Mandi Centers
            </span>
            <span className="text-2xl font-bold text-stone-900 block mt-0.5">
              {stats.total_centers}
            </span>
          </div>
        </div>

        {/* Today's Bookings */}
        <div className="bg-white rounded-xl border border-ghost p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
            <CalendarCheck size={22} />
          </div>
          <div>
            <span className="text-xs font-medium text-muted uppercase tracking-wider block">
              Today's Slots
            </span>
            <span className="text-2xl font-bold text-stone-900 block mt-0.5">
              {stats.today_bookings}
            </span>
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-white rounded-xl border border-ghost p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-lime/20 text-forest flex items-center justify-center shrink-0 border border-lime/40">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-xs font-medium text-muted uppercase tracking-wider block">
              Completed Today
            </span>
            <span className="text-2xl font-bold text-forest block mt-0.5">
              {stats.today_completed}
            </span>
          </div>
        </div>
      </div>

      {/* MANDI CENTER SELECTOR & DETAILS */}
      <div className="bg-white rounded-xl border border-ghost p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Dropdown */}
          <div className="flex-1 max-w-md">
            <label
              htmlFor="center-select"
              className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
            >
              Select Operating Procurement Center (Mandi)
            </label>
            <div className="relative">
              <select
                id="center-select"
                value={selectedCenterId || ""}
                onChange={(e) => setSelectedCenterId(Number(e.target.value))}
                className="w-full bg-cream border border-ghost rounded-lg px-3.5 py-2.5 text-sm font-medium text-stone-900 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest cursor-pointer"
              >
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.district}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Center Details Badges */}
          {activeCenter && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs bg-cream/70 p-3 rounded-lg border border-ghost">
              <div>
                <span className="text-muted block">Processing Rate</span>
                <span className="font-semibold text-stone-800">
                  {activeCenter.process_rate_kg_per_hour?.toLocaleString() || 2000} kg/hr
                </span>
              </div>
              <div>
                <span className="text-muted block">Daily Capacity</span>
                <span className="font-semibold text-stone-800">
                  {(activeCenter.max_capacity_kg / 1000).toFixed(0)} MT ({activeCenter.max_capacity_kg?.toLocaleString()} kg)
                </span>
              </div>
              <div>
                <span className="text-muted block">Live Center Load</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-20 bg-stone-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        activeCenter.current_load_percent > 80
                          ? "bg-rose-500"
                          : activeCenter.current_load_percent > 50
                          ? "bg-gold"
                          : "bg-forest"
                      }`}
                      style={{
                        width: `${Math.min(activeCenter.current_load_percent || 15, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-bold text-stone-700">
                    {Math.round(activeCenter.current_load_percent || 0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LIVE QUEUE TABLE SECTION */}
      <div className="bg-white rounded-xl border border-ghost shadow-sm overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-4 sm:p-5 border-b border-ghost flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-cream/30">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-forest">
                Live Queue Management
              </h2>
              <span className="text-xs bg-forest text-white px-2 py-0.5 rounded-full font-semibold">
                {queue.length} Total
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Advance farmers through inspection, moisture check, weighing, and instant MSP authorization.
            </p>
          </div>

          {/* Quick Action: Next Token */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleAdvanceNextToken}
              disabled={queue.length === 0 || updatingId !== null}
              className="inline-flex items-center gap-2 bg-forest text-white hover:bg-forest-dark px-4 py-2 rounded-lg text-sm font-semibold transition shadow-xs disabled:opacity-50"
              title="Advances first waiting farmer in line"
            >
              <Sparkles size={16} className="text-lime-light" />
              Call Next Token
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-3 border-b border-ghost flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search token, farmer or crop..."
              className="pl-9 pr-3 py-1.5 w-full text-xs rounded-lg border border-ghost bg-cream/30 focus:outline-none focus:border-forest"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
            {["ALL", "IN_QUEUE", "SERVING", "CONFIRMED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-forest text-white shadow-xs"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {st === "ALL" ? "All Tokens" : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50/80 text-stone-500 uppercase text-[11px] font-semibold tracking-wider border-b border-ghost">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Pos</th>
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-4">Farmer Name</th>
                <th className="py-3 px-4">Crop</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Operator Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ghost">
              {loadingQueue && queue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                      <span>Loading queue from mandi database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <p className="font-medium text-stone-700">No bookings in queue</p>
                    <p className="text-xs mt-1">
                      {searchTerm
                        ? "No bookings matched your filter query."
                        : "All farmer slots for this center are currently cleared or none are scheduled."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => {
                  const isUpdating = updatingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-cream/40 transition-colors ${
                        item.status === "SERVING" ? "bg-lime/5" : ""
                      }`}
                    >
                      {/* Position */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-xs font-semibold text-stone-500 bg-stone-100 rounded-md px-2 py-0.5">
                          #{item.position}
                        </span>
                      </td>

                      {/* Token No */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-sm text-forest bg-forest/10 px-2.5 py-1 rounded-md border border-forest/20">
                          {item.token_no}
                        </span>
                      </td>

                      {/* Farmer Name */}
                      <td className="py-3.5 px-4 font-medium text-stone-900">
                        {item.farmer_name}
                      </td>

                      {/* Crop */}
                      <td className="py-3.5 px-4 text-stone-700">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <Wheat size={14} className="text-gold-dark" />
                          {item.crop_type}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-stone-700">
                        <div className="font-medium text-xs">
                          {item.quantity_kg?.toLocaleString()} kg
                          <span className="text-muted ml-1 font-normal">
                            ({(item.quantity_kg / 100).toFixed(1)} Qtl)
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.status} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* If CONFIRMED -> Move to IN_QUEUE */}
                          {item.status === "CONFIRMED" && (
                            <button
                              onClick={() =>
                                handleStatusChange(item.id, "IN_QUEUE", item.token_no)
                              }
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1 text-xs font-medium bg-gold/15 text-gold-dark hover:bg-gold/25 px-2.5 py-1.5 rounded-md border border-gold/30 transition disabled:opacity-50"
                              title="Call farmer to physical queue"
                            >
                              <Clock size={13} />
                              Call to Queue
                            </button>
                          )}

                          {/* If IN_QUEUE -> Move to SERVING */}
                          {item.status === "IN_QUEUE" && (
                            <button
                              onClick={() =>
                                handleStatusChange(item.id, "SERVING", item.token_no)
                              }
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1 text-xs font-medium bg-forest text-white hover:bg-forest-dark px-2.5 py-1.5 rounded-md transition shadow-xs disabled:opacity-50"
                              title="Begin weighing and crop verification"
                            >
                              <Play size={13} />
                              Start Serving
                            </button>
                          )}

                          {/* If SERVING -> Move to COMPLETED */}
                          {item.status === "SERVING" && (
                            <button
                              onClick={() =>
                                handleStatusChange(item.id, "COMPLETED", item.token_no)
                              }
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1 text-xs font-semibold bg-lime text-forest-dark hover:bg-lime-light px-3 py-1.5 rounded-md transition shadow-xs disabled:opacity-50"
                              title="Mark procurement done and release payment"
                            >
                              <Check size={14} />
                              Mark Complete
                            </button>
                          )}

                          {/* If already COMPLETED */}
                          {item.status === "COMPLETED" && (
                            <span className="inline-flex items-center gap-1 text-xs text-forest font-medium">
                              <CheckCircle2 size={14} />
                              Procured
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}