import { useState, useEffect } from "react";
import { apiClient } from "../../api/client";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { GraduationCap, Calendar, Clock, ChevronRight, Package, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

interface Enrollment {
  enrollment_id: number;
  status: string;
  enrolled_at: string;
  expires_at: string | null;
  product_id: number;
  product_name: string;
  product_description: string;
  product_type: string;
  default_price: number;
  product_status: string;
  product_color: string | null;
  cohort_id: number | null;
  cohort_name: string | null;
  cohort_start_date: string | null;
  cohort_end_date: string | null;
  tier_id: number | null;
  tier_name: string | null;
  tier_level: number | null;
}

interface CatalogProduct {
  id: number;
  name: string;
  description: string;
  type: string;
  duration_weeks: number;
  default_price: number;
}

const DEFAULT_COLORS = [
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

function getProductColor(product: { product_color?: string | null; product_id?: number; id?: number }, index: number = 0): string {
  if (product.product_color) return product.product_color;
  const id = product.product_id || product.id || index;
  return DEFAULT_COLORS[id % DEFAULT_COLORS.length];
}

export function ProgramsPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [enrollmentsData, catalogData] = await Promise.all([
        apiClient.getUserEnrollments(),
        apiClient.getCatalogProducts(),
      ]);
      setEnrollments(enrollmentsData);
      setCatalogProducts(catalogData);
    } catch (error) {
      console.error("Failed to load programs data:", error);
    } finally {
      setLoading(false);
    }
  };

  const enrolledProductIds = new Set(enrollments.map((e) => e.product_id));
  const availableProducts = catalogProducts.filter((p) => !enrolledProductIds.has(p.id));

  const activeEnrollments = enrollments.filter((e) => e.status === "active");
  const expiredEnrollments = enrollments.filter((e) => e.status !== "active");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string, expiresAt: string | null) => {
    if (status === "active") {
      if (expiresAt && new Date(expiresAt) < new Date()) {
        return <Badge variant="destructive">Истёк</Badge>;
      }
      return <Badge className="bg-green-500 hover:bg-green-600">Активен</Badge>;
    }
    if (status === "expired") {
      return <Badge variant="destructive">Истёк</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="secondary">Отменён</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (loading) {
    return (
      <div>
        <div className="mb-12">
          <Skeleton className="h-10 w-64 mb-3" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-12">
        <h2 className="text-gray-900 mb-3 font-black text-4xl">Мои программы</h2>
        <p className="text-gray-600 text-lg">
          Ваши образовательные программы и доступные курсы
        </p>
      </div>

      {activeEnrollments.length > 0 && (
        <section className="mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Активные программы
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            {activeEnrollments.map((enrollment, index) => {
              const color = getProductColor(enrollment, index);
              return (
                <motion.div
                  key={enrollment.enrollment_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: color }}
                    />
                    <div className="pl-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-bold text-gray-900">
                              {enrollment.product_name}
                            </h4>
                            {getStatusBadge(enrollment.status, enrollment.expires_at)}
                          </div>
                          {enrollment.cohort_name && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {enrollment.cohort_name}
                            </p>
                          )}
                        </div>
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Package className="h-5 w-5" style={{ color }} />
                        </div>
                      </div>

                      {enrollment.product_description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {enrollment.product_description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        {enrollment.tier_name && (
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            Тариф: {enrollment.tier_name}
                          </span>
                        )}
                        {enrollment.cohort_start_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Начало: {formatDate(enrollment.cohort_start_date)}
                          </span>
                        )}
                        {enrollment.expires_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            До: {formatDate(enrollment.expires_at)}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="group-hover:text-blue-600 transition-colors p-0 h-auto"
                          onClick={() => navigate("/library")}
                        >
                          Перейти к материалам
                          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {expiredEnrollments.length > 0 && (
        <section className="mb-12">
          <h3 className="text-xl font-bold text-gray-500 mb-6">
            Завершённые программы
          </h3>
          <div className="grid gap-4 md:grid-cols-2 opacity-75">
            {expiredEnrollments.map((enrollment) => (
              <Card key={enrollment.enrollment_id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-700">
                      {enrollment.product_name}
                    </h4>
                    {enrollment.cohort_name && (
                      <p className="text-sm text-gray-400">{enrollment.cohort_name}</p>
                    )}
                  </div>
                  {getStatusBadge(enrollment.status, enrollment.expires_at)}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {availableProducts.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Доступные программы
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableProducts.map((product, index) => {
              const color = DEFAULT_COLORS[product.id % DEFAULT_COLORS.length];
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border-dashed border-2 border-gray-200 hover:border-gray-300">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Package className="h-5 w-5" style={{ color }} />
                      </div>
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Доступно
                      </Badge>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      {product.name}
                    </h4>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        {product.default_price.toLocaleString("ru-RU")} ₽
                      </span>
                      {product.duration_weeks && (
                        <span className="text-sm text-gray-500">
                          {product.duration_weeks} нед.
                        </span>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {enrollments.length === 0 && availableProducts.length === 0 && (
        <div className="text-center py-16">
          <GraduationCap className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            Программы пока недоступны
          </h3>
          <p className="text-gray-500">
            Здесь появятся ваши образовательные программы
          </p>
        </div>
      )}
    </div>
  );
}
