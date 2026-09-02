import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Sprout } from "lucide-react";

// Pages (your teammates will create these)
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

function App() {
  return (
    <BrowserRouter>
      {/* Top Navigation */}
      <nav className="bg-forest text-white px-6 py-4 flex items-center gap-8 shadow-md">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Sprout size={24} />
          Annadata Setu
        </Link>
        <div className="flex gap-6 text-sm">
          <Link to="/register" className="hover:text-lime-light transition">Register</Link>
          <Link to="/dashboard" className="hover:text-lime-light transition">Dashboard</Link>
          <Link to="/admin" className="hover:text-lime-light transition">Admin</Link>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}


export default App;