import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "./ui/card";
import { AdminSidebar } from "./AdminSidebar";
import { AdminDashboard } from "./AdminDashboard";
import { AdminQuestions } from "./AdminQuestions";
import { AdminInstructionsManager } from "./AdminInstructionsManager";
import { AdminUsers } from "./AdminUsers";
import { AdminNewsManager } from "./AdminNewsManager";
import { AdminRecordingsManager } from "./AdminRecordingsManager";
import { AdminFAQManager } from "./AdminFAQManager";
import { AdminEventsManager } from "./AdminEventsManager";
import { AdminEmailManager } from "./AdminEmailManager";
import { AdminInitialPasswordsManager } from "./AdminInitialPasswordsManager";
import { Products } from "../pages/admin/Products";
import { AdminUserDetail } from "./AdminUserDetail";
import { AdminStreamDetail } from "./AdminStreamDetail";

export function AdminPanel() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sectionParams, setSectionParams] = useState<Record<string, any>>({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  const navigateToSection = (section: string, params?: Record<string, any>) => {
    setActiveSection(section);
    if (params) {
      setSectionParams({ ...sectionParams, [section]: params });
    }
  };

  const renderContent = () => {
    // Handle user-detail section
    if (activeSection === "user-detail" && sectionParams["user-detail"]?.userId) {
      return (
        <AdminUserDetail
          userId={sectionParams["user-detail"].userId}
          onBack={() => {
            setActiveSection("users");
            setSectionParams({ ...sectionParams, "user-detail": undefined });
          }}
        />
      );
    }

    // Handle stream-detail section
    if (activeSection === "stream-detail" && sectionParams["stream-detail"]?.streamId) {
      return (
        <AdminStreamDetail
          streamId={sectionParams["stream-detail"].streamId}
          onBack={() => {
            setActiveSection("recordings");
            setSectionParams({ ...sectionParams, "stream-detail": undefined });
          }}
        />
      );
    }

    switch (activeSection) {
      case "dashboard":
        return <AdminDashboard />;
      case "products":
        return <Products />;
      case "news":
        return <AdminNewsManager />;
      case "events":
        return <AdminEventsManager />;
      case "instructions":
        return <AdminInstructionsManager />;
      case "recordings":
        return <AdminRecordingsManager onNavigateToStreamDetail={(streamId) => navigateToSection("stream-detail", { streamId })} />;
      case "faq":
        return <AdminFAQManager />;
      case "emails":
        return <AdminEmailManager />;
      case "initial-passwords":
        return <AdminInitialPasswordsManager />;
      case "questions":
        return <AdminQuestions />;
      case "users":
        return <AdminUsers onNavigateToUserDetail={(userId) => navigateToSection("user-detail", { userId })} />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className="flex-1 py-10 px-8 lg:px-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
