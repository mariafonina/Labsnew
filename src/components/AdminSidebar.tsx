import {
  LayoutDashboard,
  Newspaper,
  Calendar,
  BookOpen,
  Video,
  HelpCircle,
  MessageCircle,
  Users,
  Mail,
  KeyRound,
  Package,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { motion } from "motion/react";
import { Logo } from "./Logo";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminSidebar({ 
  activeSection, 
  onSectionChange, 
  onLogout, 
  isCollapsed, 
  onToggleCollapse 
}: AdminSidebarProps) {
  const { comments } = useApp();

  // Подсчёт непрочитанных вопросов от пользователей (без ответов от админа)
  const userQuestionsCount = comments.filter(
    (c) => !c.parentId && c.authorRole === "user"
  ).length;

  const menuItems = [
    { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
    { id: "products", label: "Продукты", icon: Package },
    { id: "news", label: "Новости", icon: Newspaper },
    { id: "events", label: "События", icon: Calendar },
    { id: "instructions", label: "Инструкции", icon: BookOpen },
    { id: "recordings", label: "Записи", icon: Video },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "emails", label: "Email-рассылки", icon: Mail },
    { id: "initial-passwords", label: "Первичные пароли", icon: KeyRound },
    { id: "questions", label: "Вопросы", icon: MessageCircle, badge: userQuestionsCount },
    { id: "users", label: "Пользователи", icon: Users },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-white border-r border-gray-200 min-h-screen flex flex-col relative"
    >
      <div className={`border-b border-gray-200 ${isCollapsed ? 'px-3 pt-6 pb-1' : 'pt-6 pb-1 px-6'}`}>
        {!isCollapsed ? (
          <div className="flex flex-col gap-3">
            <Logo size="lg" onClick={() => onSectionChange("dashboard")} />
            <div>
              <p className="text-sm text-gray-500 leading-5">Управление контентом</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Logo size="sm" onClick={() => onSectionChange("dashboard")} />
          </div>
        )}
      </div>

      <nav className={`flex-1 ${isCollapsed ? 'px-2 pt-4' : 'pt-4 px-4'} space-y-1`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full h-10 rounded-lg flex items-center ${
                isCollapsed ? 'justify-center px-2' : 'justify-start px-6 gap-3'
              } transition-colors ${
                isActive
                  ? "bg-gradient-to-r from-[#fb64b6] to-[#ff637e] text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
                  : "text-[#364153] hover:bg-gray-100"
              }`}
            >
              <div className="relative flex items-center justify-center w-4 h-4">
                <Icon className="w-4 h-4" />
                {isCollapsed && item.badge && item.badge > 0 && (
                  <div className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left font-medium text-base leading-6 tracking-[-0.3125px]">
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span className={`font-medium text-base leading-6 tracking-[-0.3125px] ${
                      isActive ? "text-white" : "text-[#364153]"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`border-t border-gray-200 ${isCollapsed ? 'px-2 pt-4 pb-0' : 'pt-4 pb-0 px-4'}`}>
        <button
          onClick={onLogout}
          title={isCollapsed ? "Выйти" : undefined}
          className={`w-full h-10 rounded-lg flex items-center ${
            isCollapsed ? 'justify-center px-2' : 'justify-start px-4 gap-3'
          } text-[#e7000b] hover:bg-red-50 transition-colors`}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && (
            <span className="font-semibold text-base leading-6 tracking-[-0.3125px]">Выйти</span>
          )}
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-[18px] top-20 bg-white border-2 border-gray-200 rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:bg-gray-50 hover:shadow-xl hover:border-pink-300 transition-all z-10"
        aria-label={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-700" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-700" />
        )}
      </button>
    </motion.aside>
  );
}