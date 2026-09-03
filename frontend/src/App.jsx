// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-cream flex flex-col font-sans text-stone-900 selection:bg-lime-light selection:text-forest-dark">
        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/register" replace />} />
          </Routes>
        </main>

        {/* Simple tactile footer */}
        <footer className="border-t border-ghost bg-white py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-forest">Annadata Setu</span>
              <span>•</span>
              <span>Smart Agricultural Procurement & Queue Allocation</span>
            </div>
            <div>
              <span>Ministry of Consumer Affairs, Food & Public Distribution | SIH26032</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;