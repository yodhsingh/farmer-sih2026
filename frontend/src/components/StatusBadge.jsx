// src/components/StatusBadge.jsx
// Reusable status badge adhering to the Tactile Modernism color system.

import React from "react";
import { Clock, CheckCircle2, PlayCircle, AlertCircle, XCircle } from "lucide-react";

export default function StatusBadge({ status, size = "md" }) {
  const normalized = (status || "").toUpperCase();

  const configs = {
    CONFIRMED: {
      label: "Confirmed",
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      icon: Clock,
      dot: "bg-amber-500",
    },
    IN_QUEUE: {
      label: "In Queue",
      bg: "bg-gold/15 text-gold-dark border-gold/30",
      icon: Clock,
      dot: "bg-gold",
    },
    SERVING: {
      label: "Serving Now",
      bg: "bg-forest/10 text-forest-dark border-forest/30 font-semibold",
      icon: PlayCircle,
      dot: "bg-forest animate-ping",
    },
    COMPLETED: {
      label: "Completed",
      bg: "bg-lime/20 text-forest-dark border-lime/40",
      icon: CheckCircle2,
      dot: "bg-lime",
    },
    CANCELLED: {
      label: "Cancelled",
      bg: "bg-stone-100 text-stone-600 border-stone-300",
      icon: XCircle,
      dot: "bg-stone-400",
    },
    PAID: {
      label: "Paid",
      bg: "bg-lime/20 text-forest-dark border-lime/40",
      icon: CheckCircle2,
      dot: "bg-lime",
    },
    UNPAID: {
      label: "Unpaid",
      bg: "bg-gold/15 text-gold-dark border-gold/30",
      icon: Clock,
      dot: "bg-gold",
    },
  };

  const config = configs[normalized] || {
    label: normalized || "Unknown",
    bg: "bg-gray-100 text-gray-700 border-gray-200",
    icon: AlertCircle,
    dot: "bg-gray-400",
  };

  const Icon = config.icon;
  const sizeClasses = size === "sm" 
    ? "text-xs px-2.5 py-0.5 gap-1.5" 
    : "text-xs md:text-sm px-3 py-1 gap-2";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-xs transition-colors ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon size={size === "sm" ? 12 : 14} className="opacity-80" />
      <span>{config.label}</span>
    </span>
  );
}
