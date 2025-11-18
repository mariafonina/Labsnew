import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Users, Package, Layers, Shield, DollarSign, TrendingUp, Zap } from "lucide-react";
import { apiClient } from "../api/client";
import { Skeleton } from "./ui/skeleton";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalCohorts: number;
  totalTiers: number;
  totalRevenue: number;
  averageCheck: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/dashboard/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Пользователи",
      value: stats?.totalUsers || 0,
      icon: Users,
      bgColor: "bg-cyan-400",
    },
    {
      title: "Продукты",
      value: stats?.totalProducts || 0,
      icon: Package,
      bgColor: "bg-pink-400",
    },
    {
      title: "Потоки",
      value: stats?.totalCohorts || 0,
      icon: Layers,
      bgColor: "bg-purple-400",
    },
    {
      title: "Тарифы",
      value: stats?.totalTiers || 0,
      icon: Shield,
      bgColor: "bg-emerald-400",
    },
    {
      title: "Общий доход",
      value: `${stats?.totalRevenue || 0} ₽`,
      icon: DollarSign,
      bgColor: "bg-orange-400",
    },
    {
      title: "Средний чек",
      value: `${stats?.averageCheck || 0} ₽`,
      icon: TrendingUp,
      bgColor: "bg-cyan-400",
    },
  ];

  const quickActions = [
    {
      title: "Создать продукт",
      description: "Добавить новый образовательный продукт",
      icon: Package,
      bgColor: "bg-pink-400",
      action: () => {
        // TODO: Navigate to products
      },
    },
    {
      title: "Добавить пользователя",
      description: "Создать нового пользователя платформы",
      icon: Users,
      bgColor: "bg-cyan-400",
      action: () => {
        // TODO: Navigate to users
      },
    },
    {
      title: "Посмотреть вопросы",
      description: "Ответить на вопросы пользователей",
      icon: Zap,
      bgColor: "bg-purple-400",
      action: () => {
        // TODO: Navigate to questions
      },
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-black text-[48px] leading-[48px] tracking-[0.3516px] text-neutral-950">
          Дашборд
        </h1>
        <p className="text-[18px] leading-[28px] tracking-[-0.4395px] text-[#6a7282]">
          Общая статистика и аналитика платформы
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-[26px] border-2 border-[rgba(0,0,0,0.1)] rounded-[14px]">
                <Skeleton className="h-[236px] w-full" />
              </Card>
            ))
          : statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="p-[26px] border-2 border-[rgba(0,0,0,0.1)] rounded-[14px] flex flex-col gap-10 hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-[14px] ${stat.bgColor} shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-[14px] leading-5 tracking-[-0.1504px] font-semibold text-[#6a7282] mb-0">
                      {stat.title}
                    </p>
                    <p className="text-[36px] leading-10 tracking-[0.3691px] font-black text-[#101828] mt-0">
                      {stat.value}
                    </p>
                  </div>
                </Card>
              );
            })}
      </div>

      {/* Bottom Grid - Products by Users + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products by Users */}
        <Card className="p-[26px] border-2 border-[rgba(0,0,0,0.1)] rounded-[14px] flex flex-col gap-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-pink-400 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-black leading-8 tracking-[0.0703px] text-neutral-950">
              Продукты по пользователям
            </h2>
          </div>
          <div className="text-center text-[16px] leading-6 tracking-[-0.3125px] text-[#6a7282]">
            Нет данных о продуктах
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-[26px] border-2 border-[rgba(0,0,0,0.1)] rounded-[14px] flex flex-col gap-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-purple-400 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-black leading-8 tracking-[0.0703px] text-neutral-950">
              Быстрые действия
            </h2>
          </div>

          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const gradientClasses = [
                "bg-gradient-to-r from-[#fdf2f8] to-[#fff1f2]",
                "bg-gradient-to-r from-[#eff6ff] to-[#ecfeff]",
                "bg-gradient-to-r from-[#faf5ff] to-[#eef2ff]",
              ];
              const iconBgClasses = [
                "bg-pink-400",
                "bg-cyan-400",
                "bg-purple-400",
              ];
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className={`w-full h-auto p-4 rounded-[10px] ${gradientClasses[index]} hover:opacity-90 transition-opacity text-left flex items-start gap-3 group`}
                >
                  <div className={`w-10 h-10 rounded-[10px] ${iconBgClasses[index]} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base leading-6 tracking-[-0.3125px] text-[#101828] mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm leading-5 tracking-[-0.1504px] text-[#6a7282]">
                      {action.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
