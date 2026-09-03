// src/pages/Register.jsx
// Farmer Registration Form
// Connects to POST /farmers/ via Axios (src/api.js)

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  MapPin,
  Landmark,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { registerFarmer, getErrorMessage } from "../api";

export default function Register() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    village: "",
    district: "",
    land_acres: "",
    bank_account: "",
  });

  // UI status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredFarmer, setRegisteredFarmer] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error message when user starts typing
    if (errorMessage) setErrorMessage("");
  };

  // Quick fill helper for easy testing by junior devs / reviewers
  const handleQuickFill = () => {
    setFormData({
      name: "Davinder Singh",
      phone: "9876500001",
      village: "Samrala",
      district: "Ludhiana",
      land_acres: "10.5",
      bank_account: "12345678909",
    });
    setErrorMessage("");
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Basic client-side validation
    if (!formData.name.trim()) {
      setErrorMessage("Please enter the farmer's full name.");
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 10) {
      setErrorMessage("Please provide a valid 10-digit mobile phone number.");
      return;
    }
    if (!formData.village.trim() || !formData.district.trim()) {
      setErrorMessage("Please specify both village and district.");
      return;
    }

    try {
      setLoading(true);

      // Prepare payload with parsed numeric land_acres
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        village: formData.village.trim(),
        district: formData.district.trim(),
        land_acres: parseFloat(formData.land_acres) || 0.0,
        bank_account: formData.bank_account.trim(),
      };

      // Axios call through centralized api.js
      const newFarmer = await registerFarmer(payload);

      // Save the registered farmer ID to localStorage for convenience
      localStorage.setItem("current_farmer_id", String(newFarmer.id));
      localStorage.setItem("current_farmer_name", newFarmer.name);

      setRegisteredFarmer(newFarmer);
    } catch (err) {
      console.error("Farmer registration error:", err);
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Copy Farmer ID to clipboard
  const handleCopyId = () => {
    if (registeredFarmer?.id) {
      navigator.clipboard.writeText(String(registeredFarmer.id));
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Reset form to register another farmer
  const handleReset = () => {
    setRegisteredFarmer(null);
    setFormData({
      name: "",
      phone: "",
      village: "",
      district: "",
      land_acres: "",
      bank_account: "",
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Top Header */}
      <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-forest tracking-tight">
            Farmer Registration
          </h1>
          <p className="text-muted text-sm mt-1">
            Register new farmer into the Annadata Setu procurement network for transparent queue allocation and direct payouts.
          </p>
        </div>
        {!registeredFarmer && (
          <button
            type="button"
            onClick={handleQuickFill}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-medium bg-gold/15 text-gold-dark hover:bg-gold/25 px-3 py-1.5 rounded-md border border-gold/30 transition-colors"
            title="Auto-fills sample test data"
          >
            <Sparkles size={14} />
            Quick Demo Fill
          </button>
        )}
      </div>

      {/* SUCCESS STATE */}
      {registeredFarmer ? (
        <div className="bg-white rounded-xl border border-ghost p-6 sm:p-10 shadow-sm animate-fadeIn">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-lime/20 border-2 border-lime rounded-full flex items-center justify-center text-forest mb-4 shadow-inner">
              <CheckCircle2 size={36} className="text-forest" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-forest bg-forest/10 px-3 py-1 rounded-full mb-2">
              Registration Confirmed
            </span>

            <h2 className="text-2xl font-bold text-stone-900">
              Welcome, {registeredFarmer.name}!
            </h2>
            <p className="text-muted text-sm mt-1 max-w-md">
              Farmer profile has been securely recorded in the government procurement registry.
            </p>

            {/* Farmer ID Highlight Card */}
            <div className="mt-6 w-full max-w-md bg-cream border border-ghost rounded-xl p-5 shadow-xs">
              <div className="text-xs text-muted font-medium uppercase tracking-wider">
                Assigned Farmer ID
              </div>
              <div className="flex items-center justify-center gap-3 my-2">
                <span className="text-4xl font-extrabold text-forest tracking-tight">
                  #{registeredFarmer.id}
                </span>
                <button
                  onClick={handleCopyId}
                  className="p-2 text-stone-500 hover:text-forest bg-white rounded-lg border border-ghost hover:border-forest transition"
                  title="Copy Farmer ID"
                  aria-label="Copy Farmer ID"
                >
                  {copiedId ? (
                    <Check size={18} className="text-forest" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
              <p className="text-xs text-stone-500">
                Keep this ID handy to book procurement slots and check queue status.
              </p>
            </div>

            {/* Profile Summary Card */}
            <div className="mt-6 w-full max-w-md grid grid-cols-2 gap-3 text-left text-xs bg-stone-50 p-4 rounded-lg border border-ghost">
              <div>
                <span className="text-muted block">Mobile</span>
                <span className="font-medium text-stone-800">
                  {registeredFarmer.phone}
                </span>
              </div>
              <div>
                <span className="text-muted block">Location</span>
                <span className="font-medium text-stone-800">
                  {registeredFarmer.village}, {registeredFarmer.district}
                </span>
              </div>
              <div>
                <span className="text-muted block">Land Size</span>
                <span className="font-medium text-stone-800">
                  {registeredFarmer.land_acres} Acres
                </span>
              </div>
              <div>
                <span className="text-muted block">Bank Account</span>
                <span className="font-medium text-stone-800">
                  {registeredFarmer.bank_account || "Direct Cash/Pending"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
              <button
                onClick={() =>
                  navigate(`/dashboard?farmerId=${registeredFarmer.id}`)
                }
                className="w-full inline-flex items-center justify-center gap-2 bg-forest text-white px-6 py-3.5 rounded-lg font-medium hover:bg-forest-dark transition shadow-sm"
              >
                Go to Farmer Dashboard
                <ArrowRight size={18} />
              </button>
              <button
                onClick={handleReset}
                className="w-full inline-flex items-center justify-center gap-2 bg-cream text-stone-700 px-6 py-3 rounded-lg font-medium hover:bg-stone-200 border border-ghost transition"
              >
                <RefreshCw size={16} />
                Register Another
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* REGISTRATION FORM */
        <div className="bg-white rounded-xl border border-ghost p-6 sm:p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold">Unable to register: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Farmer Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
                >
                  Farmer Full Name <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <User size={18} />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Gurpreet Singh"
                    className="pl-10 w-full rounded-lg border border-ghost bg-cream/40 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition"
                  />
                </div>
              </div>

              {/* Mobile Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
                >
                  Mobile Phone Number <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Phone size={18} />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    className="pl-10 w-full rounded-lg border border-ghost bg-cream/40 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition"
                  />
                </div>
              </div>
            </div>

            {/* Geographical Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Village */}
              <div>
                <label
                  htmlFor="village"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
                >
                  Village / Town <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <MapPin size={18} />
                  </div>
                  <input
                    id="village"
                    name="village"
                    type="text"
                    required
                    value={formData.village}
                    onChange={handleChange}
                    placeholder="e.g. Phagwara"
                    className="pl-10 w-full rounded-lg border border-ghost bg-cream/40 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition"
                  />
                </div>
              </div>

              {/* District */}
              <div>
                <label
                  htmlFor="district"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
                >
                  District <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <MapPin size={18} />
                  </div>
                  <input
                    id="district"
                    name="district"
                    type="text"
                    required
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="e.g. Kapurthala"
                    className="pl-10 w-full rounded-lg border border-ghost bg-cream/40 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition"
                  />
                </div>
              </div>
            </div>

            {/* Land and Bank Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Land Size in Acres */}
              <div>
                <label
                  htmlFor="land_acres"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
                >
                  Total Land Size (Acres)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Layers size={18} />
                  </div>
                  <input
                    id="land_acres"
                    name="land_acres"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.land_acres}
                    onChange={handleChange}
                    placeholder="e.g. 12.5"
                    className="pl-10 w-full rounded-lg border border-ghost bg-cream/40 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition"
                  />
                </div>
              </div>

              {/* Bank Account */}
              <div>
                <label
                  htmlFor="bank_account"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5"
                >
                  Bank Account Number (for MSP Payouts)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Landmark size={18} />
                  </div>
                  <input
                    id="bank_account"
                    name="bank_account"
                    type="text"
                    value={formData.bank_account}
                    onChange={handleChange}
                    placeholder="e.g. 12345678901"
                    className="pl-10 w-full rounded-lg border border-ghost bg-cream/40 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition"
                  />
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="bg-cream/60 rounded-lg p-4 border border-ghost text-xs text-stone-600 flex items-start gap-2.5">
              <span className="text-forest font-bold">ℹ️ Note:</span>
              <span>
                Registering grants the farmer an Annadata ID for priority digital slot scheduling, reducing mandi wait times from 6 hours to under 30 minutes.
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-forest text-white py-3.5 px-6 rounded-lg font-medium text-base hover:bg-forest-dark focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 disabled:opacity-60 transition shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering Farmer in System...</span>
                  </>
                ) : (
                  <>
                    <span>Register Farmer</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}