// src/api.js
// ============================================================================
// Annadata Setu - Centralized API Service (Axios)
// ============================================================================
// Why Axios?
// 1. Automatically parses JSON responses (no need for res.json())
// 2. Automatically throws errors on HTTP 4xx/5xx responses
// 3. Centralized baseURL and request timeouts
// 4. Easy for junior developers to learn and use!
// ============================================================================

import axios from "axios";

// 1. Create a configured Axios instance
const api = axios.create({
  baseURL: "https://farmer-sih2026.onrender.com/",
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Helper function to extract user-friendly error messages from Axios errors.
 * Makes it easy to show helpful alerts in components.
 */
export const getErrorMessage = (error) => {
  if (error.response) {
    // Server responded with 4xx or 5xx
    return error.response.data?.detail || `Server error: ${error.response.status}`;
  } else if (error.request) {
    // Request was made but no response (backend might not be running)
    return "Cannot connect to backend server. Make sure FastAPI is running on https://farmer-sih2026.onrender.com/";
  } else {
    // Something else went wrong
    return error.message || "An unexpected error occurred";
  }
};

// ============================================================================
// FARMER APIs
// ============================================================================

/**
 * Register a new farmer
 * @param {Object} farmerData - { name, phone, village, district, land_acres, bank_account }
 * @returns {Promise<Object>} The registered farmer object including `id`
 */
export const registerFarmer = async (farmerData) => {
  const response = await api.post("/farmers/", farmerData);
  return response.data;
};

/**
 * Fetch a farmer's profile by ID
 * @param {number|string} id - Farmer ID
 * @returns {Promise<Object>} Farmer profile
 */
export const getFarmer = async (id) => {
  const response = await api.get(`/farmers/${id}`);
  return response.data;
};

// ============================================================================
// CENTER (MANDI) APIs
// ============================================================================

/**
 * Get list of all procurement centers / mandis
 * @returns {Promise<Array>} List of center objects
 */
export const getCenters = async () => {
  const response = await api.get("/centers/");
  return response.data;
};

// ============================================================================
// BOOKING & QUEUE APIs
// ============================================================================

/**
 * Create a new slot booking for a farmer at a center
 * @param {Object} bookingData - { farmer_id, center_id, crop_type, quantity_kg }
 * @returns {Promise<Object>} Created booking with token_no
 */
export const createBooking = async (bookingData) => {
  const response = await api.post("/bookings/", bookingData);
  return response.data;
};

/**
 * Get all past and active bookings for a specific farmer
 * @param {number|string} farmerId
 * @returns {Promise<Array>} List of bookings
 */
export const getFarmerBookings = async (farmerId) => {
  const response = await api.get(`/bookings/farmer/${farmerId}`);
  return response.data;
};

/**
 * Get live queue for a specific mandi center (used on Admin page)
 * @param {number|string} centerId
 * @returns {Promise<Array>} Queue ordered by creation time with live positions
 */
export const getCenterQueue = async (centerId) => {
  const response = await api.get(`/bookings/center/${centerId}/queue`);
  return response.data;
};

/**
 * Get current queue position and estimated wait time for a specific booking
 * @param {number|string} bookingId
 * @returns {Promise<Object>} { booking_id, token_no, position, estimated_wait_minutes, status }
 */
export const getBookingPosition = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}/position`);
  return response.data;
};

/**
 * Update the status of a booking (Used by Mandi operator / Admin)
 * Allowed statuses: "PENDING", "CONFIRMED", "IN_QUEUE", "SERVING", "COMPLETED", "CANCELLED"
 * @param {number|string} bookingId
 * @param {string} status - New status
 * @returns {Promise<Object>} Update confirmation
 */
export const updateBookingStatus = async (bookingId, status) => {
  const response = await api.patch(`/bookings/${bookingId}/status`, { status });
  return response.data;
};

// ============================================================================
// ADMIN APIs
// ============================================================================

/**
 * Get top-level dashboard statistics (total farmers, centers, today's bookings & completed)
 * @returns {Promise<Object>} { total_farmers, total_centers, today_bookings, today_completed }
 */
export const getAdminStats = async () => {
  const response = await api.get("/admin/stats");
  return response.data;
};

export default api;
