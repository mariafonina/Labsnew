import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { AdminSidebar } from "../components/AdminSidebar";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  console.log('[AdminLayout] Rendering for path:', location.pathname);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("labs_adminSidebarCollapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("labs_adminSidebarCollapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <h2 className="font-black text-2xl mb-4">Доступ запрещён</h2>
          <p className="text-gray-600">
            У вас нет прав для доступа к административной панели.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className="flex-1 py-10 px-8 lg:px-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
