import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Users, Package, Layers, DollarSign, TrendingUp, Zap } from "lucide-react";
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
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Продукты",
      value: stats?.totalProducts || 0,
      icon: Package,
      iconColor: "text-pink-500",
      bgColor: "bg-pink-50",
    },
    {
      title: "Потоки",
      value: stats?.totalCohorts || 0,
      icon: Layers,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      title: "Тарифы",
      value: stats?.totalTiers || 0,
      icon: DollarSign,
      iconColor: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Общий доход",
      value: `${stats?.totalRevenue || 0} ₽`,
      icon: TrendingUp,
      iconColor: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Средний чек",
      value: `${stats?.averageCheck || 0} ₽`,
      icon: TrendingUp,
      iconColor: "text-cyan-500",
      bgColor: "bg-cyan-50",
    },
  ];

  const quickActions = [
    {
      title: "Создать продукт",
      description: "Добавить новый образовательный продукт",
      icon: Package,
      color: "bg-pink-500",
      action: () => {
        // TODO: Navigate to products
      },
    },
    {
      title: "Добавить пользователя",
      description: "Создать нового пользователя платформы",
      icon: Users,
      color: "bg-blue-500",
      action: () => {
        // TODO: Navigate to users
      },
    },
    {
      title: "Посмотреть вопросы",
      description: "Ответить на вопросы пользователей",
      icon: Zap,
      color: "bg-purple-500",
      action: () => {
        // TODO: Navigate to questions
      },
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-black text-4xl mb-2">Дашборд</h1>
        <p className="text-gray-600">Общая статистика и аналитика платформы</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))
          : statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                    <p className="text-3xl font-black">{stat.value}</p>
                  </div>
                </Card>
              );
            })}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-50">
            <Zap className="h-5 w-5 text-purple-500" />
          </div>
          <h2 className="text-2xl font-black">Быстрые действия</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all text-left group"
              >
                <div className={`inline-flex p-3 rounded-lg ${action.color} text-white mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-1 group-hover:text-pink-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Products by Users - Placeholder */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-pink-50">
            <Package className="h-5 w-5 text-pink-500" />
          </div>
          <h2 className="text-2xl font-black">Продукты по пользователям</h2>
        </div>
        <div className="text-center text-gray-500 py-8">
          Нет данных о продуктах
        </div>
      </Card>
    </div>
  );
}
