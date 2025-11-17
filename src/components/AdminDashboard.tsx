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
      <div>
        <h1 className="font-black text-4xl mb-2">Дашборд</h1>
        <p className="text-gray-500">Общая статистика и аналитика платформы</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-32 w-full" />
              </Card>
            ))
          : statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className={`inline-flex p-4 rounded-2xl ${stat.bgColor} mb-6`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-2">{stat.title}</p>
                    <p className="text-5xl font-black">{stat.value}</p>
                  </div>
                </Card>
              );
            })}
      </div>

      {/* Bottom Grid - Products by Users + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products by Users */}
        <Card className="p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-pink-400">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-black">Продукты по пользователям</h2>
          </div>
          <div className="text-center text-gray-400 py-12">
            Нет данных о продуктах
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-purple-400">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-black">Быстрые действия</h2>
          </div>

          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="w-full p-4 rounded-xl bg-gray-50 hover:bg-pink-50 transition-colors text-left flex items-start gap-4 group"
                >
                  <div className={`p-3 rounded-xl ${action.bgColor} flex-shrink-0`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1 group-hover:text-pink-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-gray-500 text-sm">
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
