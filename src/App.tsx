import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Onboarding } from "./components/Onboarding";
import { NewsFeed } from "./components/NewsFeed";
import { EventsCalendar } from "./components/EventsCalendar";
import { InstructionsLibrary } from "./components/InstructionsLibrary";
import { RecordedStreams } from "./components/RecordedStreams";
import { FAQ } from "./components/FAQ";
import { Favorites } from "./components/Favorites";
import { Notes } from "./components/Notes";
import { UserProfile } from "./components/UserProfile";
import { Login } from "./components/Login";
import { AdminPanel } from "./components/AdminPanel";
import { UserSidebar } from "./components/UserSidebar";
import { Logo } from "./components/Logo";
import { MigrationBanner } from "./components/MigrationBanner";
import { ResetPassword } from "./pages/ResetPassword";
import { SetupPassword } from "./pages/SetupPassword";
import { Calendar, BookOpen, Video, Newspaper, HelpCircle, MessageSquare, Bookmark, FileText } from "lucide-react";
import { useApp } from "./contexts/AppContext";
import { useAuth } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { initPageTracker, destroyPageTracker } from "./utils/page-tracker";

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const { getUnreadNotificationsCount } = useApp();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState("news");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Set page language and charset for proper Russian text rendering
    document.documentElement.lang = "ru";
    const metaCharset = document.querySelector('meta[charset]');
    if (!metaCharset) {
      const meta = document.createElement('meta');
      meta.setAttribute('charset', 'UTF-8');
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

  // Initialize page tracker
  useEffect(() => {
    if (isAuthenticated) {
      const tracker = initPageTracker();
      
      // Track initial page based on activeTab
      const pagePath = activeTab === 'news' ? '/news' :
                      activeTab === 'calendar' ? '/events' :
                      activeTab === 'library' ? '/instructions' :
                      activeTab === 'recordings' ? '/recordings' :
                      activeTab === 'faq' ? '/faq' :
                      activeTab === 'favorites' ? '/favorites' :
                      activeTab === 'notes' ? '/notes' :
                      activeTab === 'profile' ? '/profile' : '/';
      
      tracker.trackPage(pagePath);
      
      return () => {
        destroyPageTracker();
      };
    }
  }, [isAuthenticated]);

  // Track page changes when activeTab changes
  useEffect(() => {
    if (isAuthenticated) {
      const tracker = initPageTracker();
      const pagePath = activeTab === 'news' ? '/news' :
                      activeTab === 'calendar' ? '/events' :
                      activeTab === 'library' ? '/instructions' :
                      activeTab === 'recordings' ? '/recordings' :
                      activeTab === 'faq' ? '/faq' :
                      activeTab === 'favorites' ? '/favorites' :
                      activeTab === 'notes' ? '/notes' :
                      activeTab === 'profile' ? '/profile' : '/';
      
      tracker.trackPage(pagePath);
    }
  }, [activeTab, isAuthenticated]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setShowOnboarding(false);
  };

  const handleNavigateToQuestion = (_eventId: string, eventType: "event" | "instruction" | "recording", questionId: string) => {
    // Переключаемся на нужную вкладку
    if (eventType === "event") {
      setActiveTab("calendar");
    } else if (eventType === "instruction") {
      setActiveTab("library");
    } else if (eventType === "recording") {
      setActiveTab("recordings");
    }

    // Прокручиваем к вопросу после небольшой задержки
    setTimeout(() => {
      const element = document.getElementById(`question-${questionId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("highlight-animation");
        setTimeout(() => {
          element.classList.remove("highlight-animation");
        }, 2000);
      }
    }, 300);
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show admin panel if user is admin
  const isAdmin = user?.role === 'admin';
  if (isAdmin) {
    return <AdminPanel />;
  }

  const unreadCount = getUnreadNotificationsCount();

  return (
    <>
      <MigrationBanner />
      <Onboarding open={showOnboarding} onComplete={handleOnboardingComplete} />
      
      {/* Desktop Layout with Sidebar */}
      <div className="hidden lg:block min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <UserSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main 
          className="overflow-auto transition-all duration-300"
          style={{ 
            marginLeft: isSidebarCollapsed ? '80px' : '256px'
          }}
        >
          <div className="max-w-7xl mx-auto pl-16 pr-8 py-12">
            {activeTab === "news" && (
                <div>
                  <div className="mb-12">
                    <h2 className="text-gray-900 mb-3 font-black text-4xl">что нового</h2>
                    <p className="text-gray-600 text-lg">
                      Актуальные обновления и анонсы от преподавателей
                    </p>
                  </div>
                  <div className="max-w-2xl">
                    <NewsFeed onNavigateToQuestion={handleNavigateToQuestion} />
                  </div>
                </div>
              )}

              {activeTab === "calendar" && (
                <div>
                  <div className="mb-12">
                    <h2 className="text-gray-900 mb-3 font-black text-4xl">Расписание</h2>
                    <p className="text-gray-600 text-lg">
                      Предстоящие занятия и события курса
                    </p>
                  </div>
                  <EventsCalendar />
                </div>
              )}

              {activeTab === "library" && (
                <div>
                  <div className="mb-12">
                    <h2 className="text-gray-900 mb-3 font-black text-4xl">База знаний</h2>
                    <p className="text-gray-600 text-lg">
                      Инструкции, гайды и материалы по всем темам курса
                    </p>
                  </div>
                  <InstructionsLibrary />
                </div>
              )}

              {activeTab === "recordings" && (
                <div>
                  <div className="mb-12">
                    <h2 className="text-gray-900 mb-3 font-black text-4xl">Записи эфиров</h2>
                    <p className="text-gray-600 text-lg">
                      Все прошедшие занятия доступны для просмотра
                    </p>
                  </div>
                  <RecordedStreams />
                </div>
              )}

              {activeTab === "faq" && (
                <div>
                  <div className="mb-12">
                    <h2 className="text-gray-900 mb-3 font-black text-4xl">Вопрос-ответ (FAQ)</h2>
                    <p className="text-gray-600 text-lg">
                      Ответы на часто задаваемые вопросы о курсе
                    </p>
                  </div>
                  <FAQ />
                </div>
              )}

              {activeTab === "favorites" && (
                <div>
                  <div className="mb-12">
                    <h2 className="text-gray-900 mb-3 font-black text-4xl">Избранное</h2>
                    <p className="text-gray-600 text-lg">
                      Сохранённые материалы для быстрого доступа
                    </p>
                  </div>
                  <Favorites />
                </div>
              )}

              {activeTab === "notes" && (
                <div>
                  <div className="mb-12">
                    <h2 className="text-gray-900 mb-3 font-black text-4xl">Мои заметки</h2>
                    <p className="text-gray-600 text-lg">
                      Ваши личные заметки и идеи
                    </p>
                  </div>
                  <Notes onNavigateToItem={(type) => {
                    const tabMap: Record<string, string> = {
                      'news': 'news',
                      'instruction': 'instructions',
                      'recording': 'recordings',
                      'event': 'calendar'
                    };
                    const tab = tabMap[type];
                    if (tab) {
                      setActiveTab(tab);
                    }
                  }} />
                </div>
              )}

              {activeTab === "profile" && (
                <div>
                  <div className="mb-12">
                    <h2 className="text-gray-900 mb-3 font-black text-4xl">Мой профиль</h2>
                    <p className="text-gray-600 text-lg">
                      Управление личной информацией и настройками
                    </p>
                  </div>
                  <UserProfile />
                </div>
              )}
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-800/40 bg-gray-900 mt-16">
            <div className="max-w-7xl mx-auto px-6 py-12">
              {/* Блок "Задайте вопрос" */}
              <div className="mb-8 text-center">
                <h3 className="font-black text-2xl text-white mb-3">Остались вопросы?</h3>
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
                <Logo size="md" className="brightness-0 invert" onClick={() => setActiveTab("news")} />
                <p className="text-white">
                  Создано с любовью<br />
                  Мари Афониной<br />
                  и искусственным интеллектом 🤍
                </p>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile Layout with Tabs */}
      <div className="lg:hidden min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pb-20">
        {/* Header */}
        <header className="border-b border-gray-200/60 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Logo size="md" onClick={() => setActiveTab("news")} />
              <button
                onClick={() => setActiveTab("profile")}
                className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-300 to-rose-300 flex items-center justify-center text-white font-black shadow-lg cursor-pointer hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200"
              >
                А
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === "news" && (
            <div>
              <div className="mb-12">
                <h2 className="text-gray-900 mb-3 font-black text-4xl">что нового</h2>
                <p className="text-gray-600 text-lg">
                  Актуальные обновления и анонсы от преподавателей
                </p>
              </div>
              <NewsFeed onNavigateToQuestion={handleNavigateToQuestion} />
            </div>
          )}

          {activeTab === "calendar" && (
            <div>
              <div className="mb-12">
                <h2 className="text-gray-900 mb-3 font-black text-4xl">Расписание</h2>
                <p className="text-gray-600 text-lg">
                  Предстоящие занятия и события курса
                </p>
              </div>
              <EventsCalendar />
            </div>
          )}

          {activeTab === "library" && (
            <div>
              <div className="mb-12">
                <h2 className="text-gray-900 mb-3 font-black text-4xl">База знаний</h2>
                <p className="text-gray-600 text-lg">
                  Инструкции, гайды и материалы по всем темам курса
                </p>
              </div>
              <InstructionsLibrary />
            </div>
          )}

          {activeTab === "recordings" && (
            <div>
              <div className="mb-12">
                <h2 className="text-gray-900 mb-3 font-black text-4xl">Записи эфиров</h2>
                <p className="text-gray-600 text-lg">
                  Все прошедшие занятия доступны для просмотра
                </p>
              </div>
              <RecordedStreams />
            </div>
          )}

          {activeTab === "faq" && (
            <div>
              <div className="mb-12">
                <h2 className="text-gray-900 mb-3 font-black text-4xl">Вопрос-ответ</h2>
                <p className="text-gray-600 text-lg">
                  Ответы на часто задаваемые вопросы о курсе
                </p>
              </div>
              <FAQ />
            </div>
          )}

          {activeTab === "favorites" && (
            <div>
              <div className="mb-12">
                <h2 className="text-gray-900 mb-3 font-black text-4xl">Избранное</h2>
                <p className="text-gray-600 text-lg">
                  Сохранённые материалы для быстрого доступа
                </p>
              </div>
              <Favorites />
            </div>
          )}

          {activeTab === "notes" && (
            <div>
              <div className="mb-12">
                <h2 className="text-gray-900 mb-3 font-black text-4xl">Мои заметки</h2>
                <p className="text-gray-600 text-lg">
                  Ваши личные заметки и идеи
                </p>
              </div>
              <Notes onNavigateToItem={(type) => {
                const tabMap: Record<string, string> = {
                  'news': 'news',
                  'instruction': 'instructions',
                  'recording': 'recordings',
                  'event': 'calendar'
                };
                const tab = tabMap[type];
                if (tab) {
                  setActiveTab(tab);
                }
              }} />
            </div>
          )}

          {activeTab === "profile" && (
            <div>
              <div className="mb-12">
                <h2 className="text-gray-900 mb-3 font-black text-4xl">Мой профиль</h2>
                <p className="text-gray-600 text-lg">
                  Управление личной информацией и настройками
                </p>
              </div>
              <UserProfile />
            </div>
          )}
        </main>

        {/* Mobile Footer */}
        <footer className="border-t border-gray-800/40 bg-gray-900 mt-16">
          <div className="px-6 py-12">
            {/* Блок "Задайте вопрос" */}
            <div className="mb-8 text-center">
              <h3 className="font-black text-2xl text-white mb-3">Остались вопросы?</h3>
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
              <Logo size="md" className="brightness-0 invert" onClick={() => setActiveTab("news")} />
              <p className="text-white">
                Создано с любовью<br />
                Мари Афониной<br />
                и искусственным интеллектом 🤍
              </p>
            </div>
          </div>
        </footer>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/60 z-50 safe-area-inset-bottom">
          <div className="grid grid-cols-5 h-20">
            {/* Новости */}
            <button
              onClick={() => setActiveTab("news")}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                activeTab === "news" 
                  ? "text-pink-500" 
                  : "text-gray-500 active:bg-gray-50"
              }`}
            >
              {activeTab === "news" && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
              )}
              <Newspaper className={`h-6 w-6 ${activeTab === "news" ? "stroke-[2.5px]" : "stroke-2"}`} />
              <span className={`text-xs ${activeTab === "news" ? "font-bold" : "font-medium"}`}>
                Новости
              </span>
              {unreadCount > 0 && (
                <div className="absolute top-2 right-1/4 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Расписание */}
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                activeTab === "calendar" 
                  ? "text-pink-500" 
                  : "text-gray-500 active:bg-gray-50"
              }`}
            >
              {activeTab === "calendar" && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
              )}
              <Calendar className={`h-6 w-6 ${activeTab === "calendar" ? "stroke-[2.5px]" : "stroke-2"}`} />
              <span className={`text-xs ${activeTab === "calendar" ? "font-bold" : "font-medium"}`}>
                События
              </span>
            </button>

            {/* База знаний */}
            <button
              onClick={() => setActiveTab("library")}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                activeTab === "library" 
                  ? "text-pink-500" 
                  : "text-gray-500 active:bg-gray-50"
              }`}
            >
              {activeTab === "library" && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
              )}
              <BookOpen className={`h-6 w-6 ${activeTab === "library" ? "stroke-[2.5px]" : "stroke-2"}`} />
              <span className={`text-xs ${activeTab === "library" ? "font-bold" : "font-medium"}`}>
                Знания
              </span>
            </button>

            {/* Записи */}
            <button
              onClick={() => setActiveTab("recordings")}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                activeTab === "recordings" 
                  ? "text-pink-500" 
                  : "text-gray-500 active:bg-gray-50"
              }`}
            >
              {activeTab === "recordings" && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
              )}
              <Video className={`h-6 w-6 ${activeTab === "recordings" ? "stroke-[2.5px]" : "stroke-2"}`} />
              <span className={`text-xs ${activeTab === "recordings" ? "font-bold" : "font-medium"}`}>
                Записи
              </span>
            </button>

            {/* Ещё */}
            <button
              onClick={() => setActiveTab("faq")}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                ["faq", "favorites", "notes"].includes(activeTab)
                  ? "text-pink-500" 
                  : "text-gray-500 active:bg-gray-50"
              }`}
            >
              {["faq", "favorites", "notes"].includes(activeTab) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
              )}
              <HelpCircle className={`h-6 w-6 ${["faq", "favorites", "notes"].includes(activeTab) ? "stroke-[2.5px]" : "stroke-2"}`} />
              <span className={`text-xs ${["faq", "favorites", "notes"].includes(activeTab) ? "font-bold" : "font-medium"}`}>
                Ещё
              </span>
            </button>
          </div>

          {/* Submenu для "Ещё" */}
          {["faq", "favorites", "notes"].includes(activeTab) && (
            <div className="border-t border-gray-200/60 bg-white/98 backdrop-blur-xl">
              <div className="flex items-center justify-around px-6 py-3">
                <button
                  onClick={() => setActiveTab("faq")}
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
                  onClick={() => setActiveTab("favorites")}
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
                  onClick={() => setActiveTab("notes")}
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

export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/setup-password/:token" element={<SetupPassword />} />
        <Route path="*" element={<AppContent />} />
      </Routes>
    </>
  );
}