import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  ChevronRight,
  Key,
  Users,
  Package,
  Calendar,
  Send,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminFormWrapper } from "./AdminFormWrapper";
import { AdminFormField } from "./AdminFormField";
import { apiClient } from "../api/client";
import { BatchProgressTracker } from "./BatchProgressTracker";

type Product = {
  id: number;
  name: string;
};

type Cohort = {
  id: number;
  name: string;
  product_id: number;
  member_count?: number;
};

interface AdminEmailSendPasswordsProps {
  onBack: () => void;
}

export function AdminEmailSendPasswords({ onBack }: AdminEmailSendPasswordsProps) {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedCohorts, setSelectedCohorts] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, cohortsData] = await Promise.all([
        apiClient.getProducts(),
        apiClient.getCohorts(),
      ]);
      setProducts(productsData);

      // Load member count for each cohort
      const cohortsWithMembers = await Promise.all(
        cohortsData.map(async (cohort) => {
          try {
            // Get member count from cohort_members table
            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/cohorts/${cohort.id}/members`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              },
            });
            if (response.ok) {
              const members = await response.json();
              return { ...cohort, member_count: members.length };
            }
            // Return undefined on error to distinguish from empty cohort
            return { ...cohort, member_count: undefined };
          } catch {
            // Return undefined on error to distinguish from empty cohort
            return { ...cohort, member_count: undefined };
          }
        })
      );

      setCohorts(cohortsWithMembers);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  };

  const selectedProductData = products.find((p) => p.id === selectedProduct);
  const productCohorts = cohorts.filter((c) => c.product_id === selectedProduct);

  // Calculate total recipients (only count cohorts with valid member_count)
  const selectedCohortsData = productCohorts.filter((c) => selectedCohorts.includes(c.id));
  const hasErrorLoadingMembers = selectedCohortsData.some((c) => c.member_count === undefined);
  const totalRecipients = selectedCohortsData
    .reduce((acc, c) => acc + (c.member_count || 0), 0);

  const handleToggleCohort = (cohortId: number) => {
    setSelectedCohorts((prev) =>
      prev.includes(cohortId)
        ? prev.filter((id) => id !== cohortId)
        : [...prev, cohortId]
    );
  };

  const handleSelectAllCohorts = () => {
    const allCohortIds = productCohorts.map((c) => c.id);
    setSelectedCohorts(allCohortIds);
  };

  const handleDeselectAllCohorts = () => {
    setSelectedCohorts([]);
  };

  const handleSendPasswords = async () => {
    if (!selectedProduct || selectedCohorts.length === 0) {
      toast.error("Выберите продукт и хотя бы один поток");
      return;
    }

    setIsSending(true);

    try {
      const result = await apiClient.sendInitialPasswords(selectedCohorts);

      if (result.queued > 0) {
        let message = `В очередь добавлено ${result.queued} писем с паролями`;
        if (result.skipped > 0) {
          message += ` (пропущено ${result.skipped} - уже получили письма)`;
        }
        toast.success(message);

        // Show progress tracker if batch_id exists
        if (result.batch_id) {
          setActiveBatchId(result.batch_id);
          setShowProgress(true);
        }
      } else if (result.skipped > 0 && result.queued === 0) {
        toast.info(`Все ${result.skipped} пользователей уже получили письма ранее`);
      } else if (result.total === 0) {
        toast.info("Нет пользователей в выбранных потоках для рассылки");
      } else {
        toast.warning("Не удалось добавить письма в очередь");
      }
    } catch (error: any) {
      console.error('Send passwords error:', error);
      toast.error(error?.message || "Не удалось отправить пароли");
    } finally {
      setIsSending(false);
    }
  };

  const handleProgressComplete = () => {
    toast.success("Рассылка завершена!");
    setTimeout(() => {
      setShowProgress(false);
      setActiveBatchId(null);
      onBack();
    }, 2000);
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2 hover:bg-gray-100"
          disabled={showProgress}
        >
          <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
          Назад к списку рассылок
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                <Key className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-amber-100 text-amber-700">
                Массовая отправка паролей
              </Badge>
            </div>
            <h1 className="font-black text-5xl mb-3">
              Отправить первичные пароли
            </h1>
            <p className="text-gray-500 text-lg">
              Выберите продукт и потоки для отправки первичных паролей ученикам
            </p>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      {showProgress && activeBatchId && (
        <BatchProgressTracker
          batchId={activeBatchId}
          totalEmails={totalRecipients}
          onComplete={handleProgressComplete}
        />
      )}

      {/* Warning Alert */}
      {!showProgress && (
        <Card className="p-6 border-2 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-lg mb-1 text-amber-900">
                Важно
              </h3>
              <p className="text-amber-800">
                Отправка первичных паролей предназначена для новых учеников. Убедитесь, что выбрали правильные потоки. Письма будут отправлены всем ученикам выбранных потоков.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Form */}
      {!showProgress && (
      <AdminFormWrapper
        title="Параметры отправки"
        description="Выберите продукт и потоки"
        onSubmit={handleSendPasswords}
        onCancel={onBack}
        submitText={isSending ? "Отправка..." : "Отправить пароли"}
        submitDisabled={!selectedProduct || selectedCohorts.length === 0 || isSending}
      >
        <div className="space-y-6">
          {/* Product Selection */}
          <AdminFormField label="Продукт" required emoji="📦">
            <div className="space-y-3">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className={`p-4 border-2 cursor-pointer transition-all ${
                    selectedProduct === product.id
                      ? "border-purple-400 bg-purple-50 shadow-lg"
                      : "border-gray-200 hover:border-purple-200 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedProduct(product.id);
                    setSelectedCohorts([]);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          selectedProduct === product.id
                            ? "bg-purple-400"
                            : "bg-gray-100"
                        }`}
                      >
                        <Package
                          className={`h-5 w-5 ${
                            selectedProduct === product.id
                              ? "text-white"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-black text-lg">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {cohorts.filter((c) => c.product_id === product.id).length}{" "}
                          {cohorts.filter((c) => c.product_id === product.id).length === 1 ? "поток" : "потоков"}
                        </p>
                      </div>
                    </div>
                    {selectedProduct === product.id && (
                      <Badge className="bg-purple-500 text-white">
                        Выбран
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </AdminFormField>

          {/* Cohorts Selection */}
          {selectedProductData && productCohorts.length > 0 && (
            <AdminFormField label="Потоки" required emoji="📅">
              <div className="space-y-4">
                {/* Select All / Deselect All */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllCohorts}
                    className="flex-1"
                  >
                    Выбрать все
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllCohorts}
                    className="flex-1"
                  >
                    Снять выбор
                  </Button>
                </div>

                {/* Cohorts List */}
                <div className="space-y-3">
                  {productCohorts.map((cohort) => {
                    const isSelected = selectedCohorts.includes(cohort.id);
                    return (
                      <Card
                        key={cohort.id}
                        className={`p-4 border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-green-400 bg-green-50 shadow-lg"
                            : "border-gray-200 hover:border-green-200 hover:bg-gray-50"
                        }`}
                        onClick={() => handleToggleCohort(cohort.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                isSelected ? "bg-green-400" : "bg-gray-100"
                              }`}
                            >
                              <Calendar
                                className={`h-5 w-5 ${
                                  isSelected ? "text-white" : "text-gray-400"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="font-black">{cohort.name}</p>
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-3.5 w-3.5 text-gray-400" />
                                {cohort.member_count !== undefined ? (
                                  <span className="text-gray-500">
                                    {cohort.member_count}{" "}
                                    {cohort.member_count === 1
                                      ? "ученик"
                                      : "учеников"}
                                  </span>
                                ) : (
                                  <span className="text-red-500">
                                    Ошибка загрузки
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Badge className="bg-green-500 text-white">
                              Выбран
                            </Badge>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </AdminFormField>
          )}

          {/* Error Warning */}
          {hasErrorLoadingMembers && selectedCohorts.length > 0 && (
            <Card className="p-6 border-2 border-red-200 bg-red-50">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-black text-lg mb-1 text-red-900">
                    Ошибка загрузки
                  </h3>
                  <p className="text-red-800">
                    Не удалось загрузить количество учеников для некоторых потоков. Реальное количество получателей может отличаться от отображаемого.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Summary */}
          {totalRecipients > 0 && (
            <Card className="p-6 border-2 border-purple-200 bg-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-purple-400 flex items-center justify-center">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 mb-1">
                      Получателей {hasErrorLoadingMembers && "(приблизительно)"}
                    </p>
                    <p className="text-3xl font-black text-purple-900">
                      {totalRecipients}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-700 mb-1">
                    Выбрано потоков
                  </p>
                  <p className="text-2xl font-black text-purple-900">
                    {selectedCohorts.length}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </AdminFormWrapper>
      )}
    </div>
  );
}
