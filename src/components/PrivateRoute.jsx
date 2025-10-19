// src/components/PrivateRoute.jsx
import { Navigate, useLocation } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("safedocs_token");
  const location = useLocation();

  if (!token) {
    // Keep auth intact; just send unauth users to /auth (NOT Landing)
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }
  return children;
}
