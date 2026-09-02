// src/api.js
// ALL backend API calls in ONE file. No fetch() anywhere else.

const API_URL = "http://127.0.0.1:8000";

async function apiCall(method, endpoint, body = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, options);
    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `API error: ${res.status}`);
    }
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