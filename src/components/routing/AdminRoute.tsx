import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function AdminRoute() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  console.log('[AdminRoute] Current path:', location.pathname);
  console.log('[AdminRoute] isLoading:', isLoading);
  console.log('[AdminRoute] isAuthenticated:', isAuthenticated);
  console.log('[AdminRoute] user role:', user?.role);

  // Wait for auth to initialize
  if (isLoading) {
    console.log('[AdminRoute] Auth loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    console.log('[AdminRoute] Redirecting to / - not admin or not authenticated');
    return <Navigate to="/" replace />;
  }

  console.log('[AdminRoute] Rendering Outlet for admin routes');
  return <Outlet />;
}
