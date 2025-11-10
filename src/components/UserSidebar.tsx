import { Badge } from "./ui/badge";
import {
  Newspaper,
  Calendar,
  BookOpen,
  Video,
  HelpCircle,
  Bookmark,
  FileText,
  User,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { Logo } from "./Logo";

interface UserSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function UserSidebar({ 
  activeTab, 
  onTabChange, 
  isCollapsed, 
  onToggleCollapse 
}: UserSidebarProps) {
  const { getUnreadNotificationsCount, auth } = useApp();
  const unreadCount = getUnreadNotificationsCount();

  // Get user gender for colors
  const gender = auth.isAuthenticated 
    ? (localStorage.getItem("userGender") as "male" | "female" | null)
    : null;
  
  const accentColor = gender === "male" ? "text-lime-500" : "text-pink-500";
  const logoVariant = gender === "male" ? "male" : gender === "female" ? "female" : "default";

  const mainMenuItems = [
    { id: "news", label: "Новости", icon: Newspaper, badge: unreadCount },
    { id: "calendar", label: "Расписание", icon: Calendar },
    { id: "library", label: "База знаний", icon: BookOpen, hasArrow: true },
    { id: "recordings", label: "Записи", icon: Video, hasArrow: true },
  ];

  const quickAccessItems = [
    { id: "favorites", label: "Избранное", icon: Bookmark },
    { id: "notes", label: "Заметки", icon: FileText },
    { id: "faq", label: "FAQ", icon: HelpCircle },
  ];

  const profileItem = { id: "profile", label: "Профиль", icon: User };

  if (isCollapsed) {
    return (
      <motion.aside 
        initial={false}
        animate={{ width: 80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 bg-white border-r border-gray-200/60 h-screen flex flex-col z-50"
      >
        <div className="p-3 border-b border-gray-200/60">
          <div className="flex justify-center">
            <Logo size="sm" onClick={() => onTabChange("news")} />
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {[...mainMenuItems, ...quickAccessItems, profileItem].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.label}
                className={`w-full h-12 flex items-center justify-center rounded-lg transition-colors relative ${
                  isActive ? accentColor : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <div className={`absolute -top-1 -right-1 ${gender === "male" ? "bg-lime-500" : "bg-pink-500"} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center`}>
                    {item.badge}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-gray-200/60">
          <a
            href="https://t.me/+Z8WgUOXsjuRjZDYy"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center h-12 w-full rounded-lg ${gender === "male" ? "bg-lime-500 hover:bg-lime-600" : "bg-pink-500 hover:bg-pink-600"} text-white transition-colors`}
            title="В чат"
          >
            <MessageSquare className="h-5 w-5" />
          </a>
        </div>

        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-24 bg-white border border-gray-200 rounded-full p-1.5 hover:bg-gray-50 transition-colors z-10"
          aria-label="Развернуть меню"
        >
          <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
        </button>
      </motion.aside>
    );
  }

  return (
    <motion.aside 
      initial={false}
      animate={{ width: 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 bg-white border-r border-gray-200/60 h-screen flex flex-col z-50"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200/60 space-y-3">
        <Logo size="lg" onClick={() => onTabChange("news")} />
        <button
          onClick={() => onTabChange("profile")}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors text-left w-full"
        >
          Добро пожаловать, <span className="underline hover:text-pink-400 hover:shadow-[0_0_15px_rgba(251,113,133,0.7)] transition-all duration-300 cursor-pointer">Александр</span>
        </button>
      </div>

      {/* Quick Access Icons */}
      <div className="px-6 py-4 border-b border-gray-200/60">
        <div className="flex items-center justify-around gap-2">
          {quickAccessItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.label}
                whileHover={{ 
                  scale: 1.05,
                  rotate: [0, -2, 2, -2, 2, 0],
                  transition: {
                    rotate: {
                      repeat: Infinity,
                      duration: 0.5,
                      ease: "easeInOut"
                    },
                    scale: { duration: 0.2 }
                  }
                }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all ${
                  isActive 
                    ? `${gender === "male" ? "bg-gradient-to-br from-lime-400 to-green-400 shadow-[0_0_20px_rgba(132,204,22,0.6)]" : "bg-gradient-to-br from-pink-400 to-rose-400 shadow-[0_0_20px_rgba(251,113,133,0.6)]"}` 
                    : `${gender === "male" ? "bg-gradient-to-br from-lime-300 to-green-300 hover:from-lime-400 hover:to-green-400 hover:shadow-[0_0_20px_rgba(132,204,22,0.6)]" : "bg-gradient-to-br from-pink-300 to-rose-300 hover:from-pink-400 hover:to-rose-400 hover:shadow-[0_0_20px_rgba(251,113,133,0.6)]"}`
                }`}
              >
                <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-6 py-6 space-y-1 overflow-y-auto">
        {mainMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`w-full flex items-center gap-3 py-3 px-2 text-left transition-colors group ${
                isActive ? accentColor : "text-gray-900 hover:text-gray-600"
              }`}
            >
              <span className="flex-1 font-semibold text-lg tracking-tight lowercase">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge className={`${gender === "male" ? "bg-lime-500" : "bg-pink-500"} text-white border-0 px-2 py-0.5 text-xs`}>
                    {item.badge}
                  </Badge>
                </motion.div>
              )}
              {item.hasArrow && (
                <ChevronRight className={`h-4 w-4 flex-shrink-0 ${isActive ? "" : "text-gray-400"}`} />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-200/60">
        <div className="px-6 py-6">
          <motion.a
            href="https://t.me/+Z8WgUOXsjuRjZDYy"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center justify-center gap-2 h-11 rounded-lg ${gender === "male" ? "bg-lime-500 hover:bg-lime-600 hover:shadow-[0_0_25px_rgba(132,204,22,0.7)]" : "bg-pink-500 hover:bg-pink-600 hover:shadow-[0_0_25px_rgba(251,113,133,0.7)]"} text-white transition-all font-black text-sm`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>чат курса</span>
          </motion.a>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-24 bg-white border border-gray-200 rounded-full p-1.5 hover:bg-gray-50 transition-colors z-10"
        aria-label="Свернуть меню"
      >
        <ChevronRight className="h-3.5 w-3.5 text-gray-600 rotate-180" />
      </button>
    </motion.aside>
  );
}