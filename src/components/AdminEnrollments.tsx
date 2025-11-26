import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Plus,
  Trash2,
  UserCog,
  Filter,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { apiClient } from "../api/client";
import { AdminFormWrapper } from "./AdminFormWrapper";
import { AdminFormField } from "./AdminFormField";

interface Enrollment {
  id: number;
  user_id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  product_id: number;
  product_name: string;
  pricing_tier_id: number;
  tier_name: string;
  tier_level: number;
  cohort_id?: number;
  cohort_name?: string;
  status: string;
  expires_at?: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
}

interface PricingTier {
  id: number;
  name: string;
  tier_level: number;
}

interface Cohort {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filters
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("__all__");
  const [selectedUserId, setSelectedUserId] = useState<string>("__all__");
  const [selectedStatus, setSelectedStatus] = useState<string>("__all__");

  // Form data for adding enrollment
  const [selectedUserForEnrollment, setSelectedUserForEnrollment] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  useEffect(() => {
    loadEnrollments();
    loadProducts();
    loadUsers();
  }, [selectedProductId, selectedUserId, selectedStatus]);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProductId && selectedProductId !== "__all__") {
        params.append("product_id", selectedProductId);
      }
      if (selectedUserId && selectedUserId !== "__all__") {
        params.append("user_id", selectedUserId);
      }
      if (selectedStatus && selectedStatus !== "__all__") {
        params.append("status", selectedStatus);
      }

      const response = await apiClient.get(`/admin/enrollments?${params}`);
      setEnrollments(response);
    } catch (error) {
      console.error("Error loading enrollments:", error);
      toast.error("Ошибка загрузки зачислений");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiClient.get("/admin/products");
      setProducts(response);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiClient.get("/admin/users");
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadCohorts = async (productId: string) => {
    try {
      const response = await apiClient.getCohorts(parseInt(productId));
      setCohorts(response);
    } catch (error) {
      console.error("Error loading cohorts:", error);
      toast.error("Ошибка загрузки потоков");
    }
  };

  const loadPricingTiers = async (productId: string, cohortId: string) => {
    try {
      const response = await apiClient.getCohortTiers(parseInt(productId), parseInt(cohortId));
      setPricingTiers(response);
    } catch (error) {
      console.error("Error loading pricing tiers:", error);
      toast.error("Ошибка загрузки тарифов");
    }
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    setSelectedTier("");
    setSelectedCohort("");
    setPricingTiers([]);
    setCohorts([]);

    if (productId) {
      loadCohorts(productId);
    }
  };

  const handleCohortChange = (cohortId: string) => {
    setSelectedCohort(cohortId);
    setSelectedTier("");
    setPricingTiers([]);

    if (cohortId && selectedProduct) {
      loadPricingTiers(selectedProduct, cohortId);
    }
  };

  const handleAddEnrollment = async () => {
    if (!selectedUserForEnrollment || !selectedProduct || !selectedCohort || !selectedTier) {
      toast.error("Заполните все обязательные поля: пользователь, продукт, поток и тариф");
      return;
    }

    try {
      await apiClient.post("/admin/enrollments", {
        user_id: parseInt(selectedUserForEnrollment),
        product_id: parseInt(selectedProduct),
        pricing_tier_id: parseInt(selectedTier),
        cohort_id: parseInt(selectedCohort),
        status: "active",
        expires_at: expiresAt || null,
      });

      toast.success("Пользователь успешно зачислен");
      setIsAdding(false);
      resetForm();
      loadEnrollments();
    } catch (error: any) {
      console.error("Error adding enrollment:", error);
      toast.error(error.response?.data?.error || "Ошибка при зачислении пользователя");
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!deletingId) return;

    try {
      await apiClient.delete(`/admin/enrollments/${deletingId}`);
      toast.success("Зачисление удалено");
      setDeletingId(null);
      loadEnrollments();
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      toast.error("Ошибка при удалении зачисления");
    }
  };

  const resetForm = () => {
    setSelectedUserForEnrollment("");
    setSelectedProduct("");
    setSelectedTier("");
    setSelectedCohort("");
    setExpiresAt("");
    setPricingTiers([]);
    setCohorts([]);
  };

  const clearFilters = () => {
    setSelectedProductId("__all__");
    setSelectedUserId("__all__");
    setSelectedStatus("__all__");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      active: { label: "Активен", className: "bg-green-100 text-green-700" },
      expired: { label: "Истёк", className: "bg-gray-100 text-gray-700" },
      suspended: { label: "Приостановлен", className: "bg-red-100 text-red-700" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-700" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-5xl mb-2">Зачисления</h1>
          <p className="text-gray-500 text-lg">
            Управление зачислениями пользователей на продукты
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 shadow-md"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Добавить зачисление
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h2 className="font-bold text-lg">Фильтры</h2>
          {(selectedProductId !== "__all__" || selectedUserId !== "__all__" || selectedStatus !== "__all__") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Сбросить
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Продукт</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Все продукты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Все продукты</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Пользователь</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Все пользователи" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Все пользователи</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.username} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Статус</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Все статусы</SelectItem>
                <SelectItem value="active">Активен</SelectItem>
                <SelectItem value="expired">Истёк</SelectItem>
                <SelectItem value="suspended">Приостановлен</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Продукт</TableHead>
              <TableHead>Тариф</TableHead>
              <TableHead>Поток</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Срок действия</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Нет зачислений
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div>
                      <div className="font-semibold">{enrollment.username}</div>
                      <div className="text-sm text-gray-500">{enrollment.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{enrollment.product_name}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{enrollment.tier_name}</div>
                      <div className="text-sm text-gray-500">
                        Уровень {enrollment.tier_level}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{enrollment.cohort_name || "—"}</TableCell>
                  <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                  <TableCell>
                    {enrollment.expires_at
                      ? new Date(enrollment.expires_at).toLocaleDateString("ru-RU")
                      : "Бессрочно"}
                  </TableCell>
                  <TableCell>
                    {new Date(enrollment.created_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(enrollment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Enrollment Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Добавить зачисление
            </DialogTitle>
            <DialogDescription>
              Зачислите пользователя на продукт с выбранным тарифом
            </DialogDescription>
          </DialogHeader>

          <AdminFormWrapper>
            <AdminFormField label="Пользователь" required>
              <Select value={selectedUserForEnrollment} onValueChange={setSelectedUserForEnrollment}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пользователя" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AdminFormField>

            <AdminFormField label="Продукт" required>
              <Select value={selectedProduct} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите продукт" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AdminFormField>

            <AdminFormField label="Поток" required>
              <Select
                value={selectedCohort}
                onValueChange={handleCohortChange}
                disabled={!selectedProduct}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите поток" />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id.toString()}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AdminFormField>

            <AdminFormField label="Тариф" required>
              <Select
                value={selectedTier}
                onValueChange={setSelectedTier}
                disabled={!selectedCohort}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тариф" />
                </SelectTrigger>
                <SelectContent>
                  {pricingTiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id.toString()}>
                      {tier.name} (Уровень {tier.tier_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AdminFormField>

            <AdminFormField label="Срок действия (опционально)">
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </AdminFormField>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  resetForm();
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={handleAddEnrollment}
                className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
              >
                Добавить
              </Button>
            </div>
          </AdminFormWrapper>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить зачисление?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Пользователь потеряет доступ к продукту.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEnrollment}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
