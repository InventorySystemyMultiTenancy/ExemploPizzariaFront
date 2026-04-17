import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

function PrivateRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default PrivateRoute;
