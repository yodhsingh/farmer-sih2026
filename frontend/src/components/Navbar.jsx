// src/components/Navbar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { Sprout, UserPlus, LayoutDashboard, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const navItems = [
    { to: "/register", label: "Register Farmer", icon: UserPlus },
    { to: "/dashboard", label: "Farmer Dashboard", icon: LayoutDashboard },
    { to: "/admin", label: "Admin Queue", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 bg-forest text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-lime-light rounded-lg px-2 py-1"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-dark border border-lime/30 flex items-center justify-center text-lime group-hover:scale-105 transition-transform shadow-inner">
              <Sprout size={24} className="text-lime-light" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block text-white">
                Annadata Setu
              </span>
              <span className="text-[11px] text-lime-light block -mt-1 font-medium tracking-wide">
                Smart Mandi Queue & Procurement
              </span>
            </div>
          </NavLink>

          {/* Nav Links */}
          <nav className="flex items-center gap-2 sm:gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-forest-dark text-lime-light shadow-inner border border-lime/20 font-semibold"
                        : "text-cream/80 hover:text-white hover:bg-forest-dark/50"
                    }`
                  }
                >
                  <Icon size={17} />
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
