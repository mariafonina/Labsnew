import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useViewMode } from "../../contexts/ViewModeContext";

export function AdminRoute() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { isUserViewMode } = useViewMode();
  const location = useLocation();

  console.log('[AdminRoute] Current path:', location.pathname);
  console.log('[AdminRoute] isLoading:', isLoading);
  console.log('[AdminRoute] isAuthenticated:', isAuthenticated);
  console.log('[AdminRoute] user role:', user?.role);
  console.log('[AdminRoute] isUserViewMode:', isUserViewMode);

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

  // Redirect to user view when in user view mode
  if (isUserViewMode) {
    console.log('[AdminRoute] Redirecting to /news - admin in user view mode');
    return <Navigate to="/news" replace />;
  }

  console.log('[AdminRoute] Rendering Outlet for admin routes');
  return <Outlet />;
}
