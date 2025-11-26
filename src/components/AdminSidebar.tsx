import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
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
  UserCog,
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
    { id: "enrollments", label: "Зачисления", icon: UserCog },
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
      <div className={`p-6 border-b border-gray-200 ${isCollapsed ? 'px-3' : ''}`}>
        {!isCollapsed ? (
          <div className="flex flex-col gap-3">
            <Logo size="lg" onClick={() => onSectionChange("dashboard")} />
            <div>
              <p className="text-sm text-gray-500">Управление контентом</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Logo size="sm" onClick={() => onSectionChange("dashboard")} />
          </div>
        )}
      </div>

      <nav className={`flex-1 p-4 space-y-1 ${isCollapsed ? 'px-2' : ''}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <Button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              variant={isActive ? "default" : "ghost"}
              title={isCollapsed ? item.label : undefined}
              size={isCollapsed ? "default" : "lg"}
              className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start gap-3 text-base'} ${
                isActive
                  ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500 shadow-md"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {isCollapsed && item.badge && item.badge > 0 && (
                  <div className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge
                      className={`${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-pink-100 text-pink-600"
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </nav>

      <div className={`p-4 border-t border-gray-200 ${isCollapsed ? 'px-2' : ''}`}>
        <Button
          onClick={onLogout}
          variant="ghost"
          title={isCollapsed ? "Выйти" : undefined}
          size={isCollapsed ? "default" : "lg"}
          className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start gap-3 text-base'} text-red-600 hover:text-red-700 hover:bg-red-50`}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="font-semibold">Выйти</span>}
        </Button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 bg-white border-2 border-gray-200 rounded-full p-2 shadow-lg hover:bg-gray-50 hover:shadow-xl hover:border-pink-300 transition-all z-10"
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