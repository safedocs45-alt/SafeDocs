// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

// pages
import Landing from "./pages/Landing.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Scan from "./pages/Scan.jsx";
import ScanReport from "./pages/ScanReport.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Settings from "./pages/Settings.jsx";

// your existing auth page (keep as is in your project)
import Auth from "./pages/Auth.jsx"; // make sure this path matches your file

// layout
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

// route guard (keeps auth flow intact; redirects unauth to /auth, never to Landing)
import PrivateRoute from "./components/PrivateRoute.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/auth" element={<Auth />} />

        {/* Protected */}
        <Route
          path="/scan"
          element={
            <PrivateRoute>
              <Scan />
            </PrivateRoute>
          }
        />
        <Route
          path="/scanreport"
          element={
            <PrivateRoute>
              <ScanReport />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </div>
  );
}
