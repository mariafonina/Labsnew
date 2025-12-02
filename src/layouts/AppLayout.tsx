import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Onboarding } from "../components/Onboarding";
import { UserSidebar } from "../components/UserSidebar";
import { Logo } from "../components/Logo";
import { MigrationBanner } from "../components/MigrationBanner";
import {
  Calendar,
  BookOpen,
  Video,
  Newspaper,
  HelpCircle,
  MessageSquare,
  Bookmark,
  FileText,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { useViewMode } from "../contexts/ViewModeContext";

export function AppLayout() {
  const { isAuthenticated, user } = useAuth();
  const { getUnreadNotificationsCount } = useApp();
  const { isUserViewMode } = useViewMode();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("labs_sidebarCollapsed") === "true";
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect admin users to admin panel (only if NOT in user view mode)
  useEffect(() => {
    if (user?.role === 'admin' && !isUserViewMode) {
      navigate('/admin', { replace: true });
    }
  }, [user, isUserViewMode, navigate]);

  useEffect(() => {
    localStorage.setItem("labs_sidebarCollapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    // Set page language and charset for proper Russian text rendering
    document.documentElement.lang = "ru";
    const metaCharset = document.querySelector("meta[charset]");
    if (!metaCharset) {
      const meta = document.createElement("meta");
      meta.setAttribute("charset", "UTF-8");
      document.head.insertBefore(meta, document.head.firstChild);
    }
  }, []);

  useEffect(() => {
    // Check if user has seen onboarding
    if (isAuthenticated) {
      const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setShowOnboarding(false);
  };

  const unreadCount = getUnreadNotificationsCount();

  // Derive activeTab from URL
  const activeTab = location.pathname.split("/")[1] || "news";

  return (
    <>
      <MigrationBanner />
      <Onboarding open={showOnboarding} onComplete={handleOnboardingComplete} />

      {/* Desktop Layout with Sidebar */}
      <div className="hidden lg:flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <UserSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main
          className="flex-1 flex flex-col overflow-auto transition-all duration-300"
          style={{
            marginLeft: isSidebarCollapsed ? "80px" : "256px",
          }}
        >
          <div className="flex-1 max-w-7xl mx-auto pl-16 pr-8 py-12">
            <Outlet />
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-800/40 bg-gray-900 mt-auto">
            <div className="max-w-7xl mx-auto px-6 py-12">
              {/* Блок "Задайте вопрос" */}
              <div className="mb-8 text-center">
                <h3 className="font-black text-2xl text-white mb-3">
                  Остались вопросы?
                </h3>
                <p className="text-gray-300 mb-6">
                  Наша служба заботы всегда готова помочь
                </p>
                <a
                  href="https://t.me/support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-black rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <MessageSquare className="h-5 w-5" />
                  Написать в службу заботы
                </a>
              </div>

              {/* Разделитель */}
              <div className="border-t border-gray-700 mb-8"></div>

              <div className="text-center flex flex-col items-center gap-4">
                <Logo
                  size="md"
                  className="brightness-0 invert"
                  onClick={() => navigate("/news")}
                />
                <p className="text-white">
                  Создано с любовью
                  <br />
                  Мари Афониной
                  <br />и искусственным интеллектом 🤍
                </p>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile Layout with Tabs */}
      <div className="lg:hidden flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pb-20">
        {/* Header */}
        <header className="border-b border-gray-200/60 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Logo size="md" onClick={() => navigate("/news")} />
              <button
                onClick={() => navigate("/profile")}
                className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-300 to-rose-300 flex items-center justify-center text-white font-black shadow-lg cursor-pointer hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200"
              >
                А
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
          <Outlet />
        </main>

        {/* Mobile Footer */}
        <footer className="border-t border-gray-800/40 bg-gray-900 mt-auto">
          <div className="px-6 py-12">
            {/* Блок "Задайте вопрос" */}
            <div className="mb-8 text-center">
              <h3 className="font-black text-2xl text-white mb-3">
                Остались вопросы?
              </h3>
              <p className="text-gray-300 mb-6">
                Наша служба заботы всегда готова помочь
              </p>
              <a
                href="https://t.me/support"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-black rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
              >
                <MessageSquare className="h-5 w-5" />
                Написать в службу заботы
              </a>
            </div>

            {/* Разделитель */}
            <div className="border-t border-gray-700 mb-8"></div>

            <div className="text-center flex flex-col items-center gap-4">
              <Logo
                size="md"
                className="brightness-0 invert"
                onClick={() => navigate("/news")}
              />
              <p className="text-white">
                Создано с любовью
                <br />
                Мари Афониной
                <br />и искусственным интеллектом 🤍
              </p>
            </div>
          </div>
        </footer>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/60 z-50 safe-area-inset-bottom">
          <div className="grid grid-cols-5 h-20">
            {/* Новости */}
            <button
              onClick={() => navigate("/news")}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                activeTab === "news"
                  ? "text-pink-500"
                  : "text-gray-500 active:bg-gray-50"
              }`}
            >
              {activeTab === "news" && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
              )}
              <Newspaper
                className={`h-6 w-6 ${
                  activeTab === "news" ? "stroke-[2.5px]" : "stroke-2"
                }`}
              />
              <span
                className={`text-xs ${
                  activeTab === "news" ? "font-bold" : "font-medium"
                }`}
              >
                Новости
              </span>
              {unreadCount > 0 && (
                <div className="absolute top-2 right-1/4 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Расписание */}
            <button
              onClick={() => navigate("/calendar")}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                activeTab === "calendar"
                  ? "text-pink-500"
                  : "text-gray-500 active:bg-gray-50"
              }`}
            >
              {activeTab === "calendar" && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
              )}
              <Calendar
                className={`h-6 w-6 ${
                  activeTab === "calendar" ? "stroke-[2.5px]" : "stroke-2"
                }`}
              />
              <span
                className={`text-xs ${
                  activeTab === "calendar" ? "font-bold" : "font-medium"
                }`}
              >
                События
              </span>
            </button>

            {/* База знаний */}
            <button
              onClick={() => navigate("/library")}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                activeTab === "library"
                  ? "text-pink-500"
                  : "text-gray-500 active:bg-gray-50"
              }`}
            >
              {activeTab === "library" && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
              )}
              <BookOpen
                className={`h-6 w-6 ${
                  activeTab === "library" ? "stroke-[2.5px]" : "stroke-2"
                }`}
              />
              <span
                className={`text-xs ${
                  activeTab === "library" ? "font-bold" : "font-medium"
                }`}
              >
                Знания
              </span>
            </button>

            {/* Записи */}
            <button
              onClick={() => navigate("/recordings")}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                activeTab === "recordings"
                  ? "text-pink-500"
                  : "text-gray-500 active:bg-gray-50"
              }`}
            >
              {activeTab === "recordings" && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
              )}
              <Video
                className={`h-6 w-6 ${
                  activeTab === "recordings" ? "stroke-[2.5px]" : "stroke-2"
                }`}
              />
              <span
                className={`text-xs ${
                  activeTab === "recordings" ? "font-bold" : "font-medium"
                }`}
              >
                Записи
              </span>
            </button>

            {/* Ещё */}
            <button
              onClick={() => navigate("/faq")}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                ["faq", "favorites", "notes"].includes(activeTab)
                  ? "text-pink-500"
                  : "text-gray-500 active:bg-gray-50"
              }`}
            >
              {["faq", "favorites", "notes"].includes(activeTab) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
              )}
              <HelpCircle
                className={`h-6 w-6 ${
                  ["faq", "favorites", "notes"].includes(activeTab)
                    ? "stroke-[2.5px]"
                    : "stroke-2"
                }`}
              />
              <span
                className={`text-xs ${
                  ["faq", "favorites", "notes"].includes(activeTab)
                    ? "font-bold"
                    : "font-medium"
                }`}
              >
                Ещё
              </span>
            </button>
          </div>

          {/* Submenu для "Ещё" */}
          {["faq", "favorites", "notes"].includes(activeTab) && (
            <div className="border-t border-gray-200/60 bg-white/98 backdrop-blur-xl">
              <div className="flex items-center justify-around px-6 py-3">
                <button
                  onClick={() => navigate("/faq")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    activeTab === "faq"
                      ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black shadow-lg"
                      : "text-gray-600 font-semibold active:bg-gray-100"
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="text-sm">FAQ</span>
                </button>
                <button
                  onClick={() => navigate("/favorites")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    activeTab === "favorites"
                      ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black shadow-lg"
                      : "text-gray-600 font-semibold active:bg-gray-100"
                  }`}
                >
                  <Bookmark className="h-4 w-4" />
                  <span className="text-sm">Избранное</span>
                </button>
                <button
                  onClick={() => navigate("/notes")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    activeTab === "notes"
                      ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black shadow-lg"
                      : "text-gray-600 font-semibold active:bg-gray-100"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Заметки</span>
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
