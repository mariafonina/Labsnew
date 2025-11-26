import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Users, Package, Layers, Shield, DollarSign, TrendingUp, Zap } from "lucide-react";
import { apiClient } from "../api/client";
import { Skeleton } from "./ui/skeleton";
import { AdminEmptyState } from "./AdminEmptyState";

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
        <h1 className="font-black text-5xl mb-2">Дашборд</h1>
        <p className="text-gray-500 text-lg">Общая статистика и аналитика платформы</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-32 w-full" />
            </Card>
          ))
        ) : (
          <>
            {/* Пользователи */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-2">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-md">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Пользователи</p>
              <p className="font-black text-4xl text-gray-900">{stats?.totalUsers || 0}</p>
            </Card>

            {/* Продукты */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-2">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center shadow-md">
                  <Package className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Продукты</p>
              <p className="font-black text-4xl text-gray-900">{stats?.totalProducts || 0}</p>
            </Card>

            {/* Потоки */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-2">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center shadow-md">
                  <Layers className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Потоки</p>
              <p className="font-black text-4xl text-gray-900">{stats?.totalCohorts || 0}</p>
            </Card>

            {/* Тарифы */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-2">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center shadow-md">
                  <Shield className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Тарифы</p>
              <p className="font-black text-4xl text-gray-900">{stats?.totalTiers || 0}</p>
            </Card>

            {/* Общий доход */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-2">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center shadow-md">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Общий доход</p>
              <p className="font-black text-4xl text-gray-900">{stats?.totalRevenue || 0} ₽</p>
            </Card>

            {/* Средний чек */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-2">
              <div className="flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center shadow-md">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Средний чек</p>
              <p className="font-black text-4xl text-gray-900">{stats?.averageCheck || 0} ₽</p>
            </Card>
          </>
        )}
      </div>

      {/* Bottom Grid - Products by Users + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products by Users */}
        <Card className="p-6 border-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h2 className="font-black text-2xl">Продукты по пользователям</h2>
          </div>
          <AdminEmptyState
            icon={<Package className="h-10 w-10 text-gray-400" />}
            title="Нет продуктов"
            description="Создайте первый продукт для начала работы"
            actionLabel="Создать продукт"
            onAction={() => {
              // TODO: Navigate to products section
            }}
          />
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 border-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h2 className="font-black text-2xl">Быстрые действия</h2>
          </div>

          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const bgGradient = action.bgColor === 'bg-pink-400'
                ? 'from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100'
                : action.bgColor === 'bg-cyan-400'
                ? 'from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100'
                : 'from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100';

              const iconGradient = action.bgColor === 'bg-pink-400'
                ? 'from-pink-400 to-rose-400'
                : action.bgColor === 'bg-cyan-400'
                ? 'from-blue-400 to-cyan-400'
                : 'from-purple-400 to-indigo-400';

              return (
                <button
                  key={index}
                  onClick={action.action}
                  className={`w-full p-4 text-left bg-gradient-to-r ${bgGradient} rounded-lg transition-colors group`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${iconGradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
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
