import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "./ui/card";
import { AdminSidebar } from "./AdminSidebar";
import { AdminQuestions } from "./AdminQuestions";
import { AdminInstructionsManager } from "./AdminInstructionsManager";
import { AdminUsers } from "./AdminUsers";
import { AdminNewsManager } from "./AdminNewsManager";
import { AdminRecordingsManager } from "./AdminRecordingsManager";
import { AdminFAQManager } from "./AdminFAQManager";
import { AdminEventsManager } from "./AdminEventsManager";

export function AdminPanel() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("news");
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

  const renderContent = () => {
    switch (activeSection) {
      case "news":
        return <AdminNewsManager />;
      case "events":
        return <AdminEventsManager />;
      case "instructions":
        return <AdminInstructionsManager />;
      case "recordings":
        return <AdminRecordingsManager />;
      case "faq":
        return <AdminFAQManager />;
      case "questions":
        return <AdminQuestions />;
      case "users":
        return <AdminUsers />;
      default:
        return <AdminNewsManager />;
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
