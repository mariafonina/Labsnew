import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Users as UsersIcon,
  ChevronRight,
  ChevronDown,
  Layers,
  Tag,
  Copy,
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { toast } from "sonner";
import { AdminFormWrapper } from "./AdminFormWrapper";
import { AdminFormField } from "./AdminFormField";
import { AdminEmptyState } from "./AdminEmptyState";
import { AdminStreamDetail } from "./AdminStreamDetail";
import { apiClient } from "../api/client";

type Tier = {
  id: number;
  name: string;
  price: number;
  tier_level: number;
  userCount?: number;
};

type Cohort = {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  member_count: number;
  tiers?: Tier[];
};

type Product = {
  id: number;
  name: string;
  description?: string;
  type: string;
  tier_count: number;
  cohort_count: number;
  enrollment_count: number;
  cohorts?: Cohort[];
  created_at: string;
};

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [expandedCohorts, setExpandedCohorts] = useState<Set<number>>(new Set());

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCohort, setIsAddingCohort] = useState(false);
  const [isAddingTier, setIsAddingTier] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCohort, setEditingCohort] = useState<{cohort: Cohort, productId: number} | null>(null);
  const [editingTier, setEditingTier] = useState<{tier: Tier, productId: number, cohortId: number} | null>(null);
  const [deletingId, setDeletingId] = useState<{type: string, id: number} | null>(null);

  const [selectedProductForCohort, setSelectedProductForCohort] = useState<number | null>(null);
  const [selectedCohortForTier, setSelectedCohortForTier] = useState<{productId: number, cohortId: number} | null>(null);
  const [viewingCohortDetail, setViewingCohortDetail] = useState<{cohortId: number, cohortName: string, productName: string} | null>(null);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    type: "",
  });

  const [cohortForm, setCohortForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  const [tierForm, setTierForm] = useState({
    name: "",
    price: "",
    tier_level: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProducts();
      setProducts(data);
    } catch (error: any) {
      toast.error("Не удалось загрузить продукты");
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductCohorts = async (productId: number) => {
    try {
      const cohorts = await apiClient.getCohorts();
      const productCohorts = cohorts.filter((c: Cohort) => {
        // Assuming cohorts have product_id field from API
        return (c as any).product_id === productId;
      });

      setProducts(products.map(p =>
        p.id === productId ? { ...p, cohorts: productCohorts } : p
      ));
    } catch (error: any) {
      toast.error("Не удалось загрузить потоки");
      console.error("Failed to load cohorts:", error);
    }
  };

  const loadCohortTiers = async (cohortId: number, productId: number) => {
    try {
      const tiers = await apiClient.getProductTiers(productId);

      setProducts(products.map(p => {
        if (p.id === productId && p.cohorts) {
          return {
            ...p,
            cohorts: p.cohorts.map(c =>
              c.id === cohortId ? { ...c, tiers } : c
            )
          };
        }
        return p;
      }));
    } catch (error: any) {
      toast.error("Не удалось загрузить тарифы");
      console.error("Failed to load tiers:", error);
    }
  };

  const toggleProduct = async (productId: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
      // Load cohorts if not loaded
      const product = products.find(p => p.id === productId);
      if (product && !product.cohorts) {
        await loadProductCohorts(productId);
      }
    }
    setExpandedProducts(newExpanded);
  };

  const toggleCohort = async (cohortId: number, productId: number) => {
    const newExpanded = new Set(expandedCohorts);
    if (newExpanded.has(cohortId)) {
      newExpanded.delete(cohortId);
    } else {
      newExpanded.add(cohortId);
      // Load tiers if not loaded
      const product = products.find(p => p.id === productId);
      const cohort = product?.cohorts?.find(c => c.id === cohortId);
      if (cohort && !cohort.tiers) {
        await loadCohortTiers(cohortId, productId);
      }
    }
    setExpandedCohorts(newExpanded);
  };

  const resetForms = () => {
    setProductForm({ name: "", description: "", type: "" });
    setCohortForm({ name: "", description: "", start_date: "", end_date: "" });
    setTierForm({ name: "", price: "", tier_level: "" });
    setIsAddingProduct(false);
    setIsAddingCohort(false);
    setIsAddingTier(false);
    setEditingProduct(null);
    setEditingCohort(null);
    setEditingTier(null);
    setSelectedProductForCohort(null);
    setSelectedCohortForTier(null);
  };

  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.type) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const newProduct = await apiClient.createProduct(productForm);
      setProducts([newProduct, ...products]);
      resetForms();
      toast.success("Продукт добавлен");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить продукт");
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      const updated = await apiClient.updateProduct(editingProduct.id, productForm);
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...updated } : p));
      resetForms();
      toast.success("Продукт обновлен");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить продукт");
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingId || deletingId.type !== "product") return;

    try {
      await apiClient.deleteProduct(deletingId.id);
      setProducts(products.filter(p => p.id !== deletingId.id));
      setDeletingId(null);
      toast.success("Продукт удален");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить продукт");
    }
  };

  const handleAddCohort = async () => {
    if (!selectedProductForCohort || !cohortForm.name || !cohortForm.start_date || !cohortForm.end_date) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const newCohort = await apiClient.createCohort({
        product_id: selectedProductForCohort,
        ...cohortForm
      });

      await loadProductCohorts(selectedProductForCohort);
      resetForms();
      toast.success("Поток добавлен");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить поток");
    }
  };

  const handleCopyCohort = async (cohortId: number, productId: number) => {
    try {
      const name = prompt("Введите имя нового потока:");
      if (!name) return;

      await apiClient.copyCohort(cohortId, { name });
      await loadProductCohorts(productId);
      toast.success("Поток скопирован");
    } catch (error: any) {
      toast.error(error.message || "Не удалось скопировать поток");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  // Show cohort detail view if selected
  if (viewingCohortDetail) {
    return (
      <AdminStreamDetail
        cohortId={viewingCohortDetail.cohortId}
        cohortName={viewingCohortDetail.cohortName}
        productName={viewingCohortDetail.productName}
        onBack={() => setViewingCohortDetail(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">Продукты и потоки</h2>
          <p className="text-gray-500 mt-2">Управление иерархией: Продукты → Потоки → Тарифы</p>
        </div>
        <Button
          onClick={() => setIsAddingProduct(true)}
          size="lg"
          className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Добавить продукт
        </Button>
      </div>

      {products.length === 0 ? (
        <AdminEmptyState
          icon={<Package className="h-10 w-10 text-gray-400" />}
          title="Нет продуктов"
          description="Создайте первый продукт для вашей платформы"
          actionLabel="Добавить продукт"
          onAction={() => setIsAddingProduct(true)}
        />
      ) : (
        <div className="space-y-6">
          {products.map((product) => (
            <Card key={product.id} className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleProduct(product.id)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    {expandedProducts.has(product.id) ? (
                      <ChevronDown className="h-5 w-5 text-pink-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-pink-600" />
                    )}
                  </button>
                  <Package className="h-8 w-8 text-pink-600" />
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900">{product.name}</h3>
                    {product.description && (
                      <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                    )}
                    <div className="flex gap-3 mt-2">
                      <Badge className="bg-pink-200 text-pink-700 text-xs">
                        <Layers className="h-3 w-3 mr-1" />
                        {product.cohort_count} потоков
                      </Badge>
                      <Badge className="bg-rose-200 text-rose-700 text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {product.tier_count} тарифов
                      </Badge>
                      <Badge className="bg-purple-200 text-purple-700 text-xs">
                        <UsersIcon className="h-3 w-3 mr-1" />
                        {product.enrollment_count} зачислений
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedProductForCohort(product.id);
                      setIsAddingCohort(true);
                    }}
                    size="sm"
                    className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Поток
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingProduct(product);
                      setProductForm({
                        name: product.name,
                        description: product.description || "",
                        type: product.type,
                      });
                    }}
                    variant="ghost"
                    size="icon"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setDeletingId({type: "product", id: product.id})}
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Cohorts */}
              {expandedProducts.has(product.id) && product.cohorts && (
                <div className="ml-14 space-y-4">
                  {product.cohorts.map((cohort) => (
                    <Card key={cohort.id} className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => toggleCohort(cohort.id, product.id)}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                          >
                            {expandedCohorts.has(cohort.id) ? (
                              <ChevronDown className="h-5 w-5 text-purple-600" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-purple-600" />
                            )}
                          </button>
                          <Layers className="h-6 w-6 text-purple-600" />
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => setViewingCohortDetail({
                              cohortId: cohort.id,
                              cohortName: cohort.name,
                              productName: product.name
                            })}
                          >
                            <h4 className="font-bold text-lg text-gray-900">{cohort.name}</h4>
                            {cohort.description && (
                              <p className="text-gray-600 text-sm mt-1">{cohort.description}</p>
                            )}
                            <div className="flex gap-3 mt-2">
                              <Badge className="bg-purple-200 text-purple-700 text-xs">
                                <UsersIcon className="h-3 w-3 mr-1" />
                                {cohort.member_count} участников
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(cohort.start_date).toLocaleDateString()} - {new Date(cohort.end_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleCopyCohort(cohort.id, product.id)}
                            size="sm"
                            variant="ghost"
                            className="text-purple-600 hover:bg-purple-100"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Копировать
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedCohortForTier({productId: product.id, cohortId: cohort.id});
                              setIsAddingTier(true);
                            }}
                            size="sm"
                            className="bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Тариф
                          </Button>
                        </div>
                      </div>

                      {/* Tiers */}
                      {expandedCohorts.has(cohort.id) && cohort.tiers && (
                        <div className="ml-14 mt-4 space-y-3">
                          {cohort.tiers.map((tier) => (
                            <Card key={tier.id} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Tag className="h-5 w-5 text-green-600" />
                                  <div>
                                    <h5 className="font-bold text-gray-900">{tier.name}</h5>
                                    <p className="text-sm text-gray-600">
                                      {tier.price} ₽ • Уровень {tier.tier_level}
                                    </p>
                                  </div>
                                </div>
                                <Badge className="bg-green-200 text-green-700">
                                  <UsersIcon className="h-3 w-3 mr-1" />
                                  {tier.userCount || 0}
                                </Badge>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={isAddingProduct || editingProduct !== null} onOpenChange={(open) => !open && resetForms()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Редактировать продукт" : "Добавить продукт"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <AdminFormField label="Название" required>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                placeholder="Название продукта"
              />
            </AdminFormField>
            <AdminFormField label="Описание">
              <Input
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                placeholder="Описание продукта"
              />
            </AdminFormField>
            <AdminFormField label="Тип" required>
              <Input
                value={productForm.type}
                onChange={(e) => setProductForm({...productForm, type: e.target.value})}
                placeholder="Например: курс, программа, тренинг"
              />
            </AdminFormField>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={resetForms}>Отмена</Button>
            <Button
              onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
              className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
            >
              {editingProduct ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Cohort Dialog */}
      <Dialog open={isAddingCohort} onOpenChange={(open) => !open && resetForms()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить поток</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <AdminFormField label="Название" required>
              <Input
                value={cohortForm.name}
                onChange={(e) => setCohortForm({...cohortForm, name: e.target.value})}
                placeholder="Название потока"
              />
            </AdminFormField>
            <AdminFormField label="Описание">
              <Input
                value={cohortForm.description}
                onChange={(e) => setCohortForm({...cohortForm, description: e.target.value})}
                placeholder="Описание потока"
              />
            </AdminFormField>
            <AdminFormField label="Дата начала" required>
              <Input
                type="date"
                value={cohortForm.start_date}
                onChange={(e) => setCohortForm({...cohortForm, start_date: e.target.value})}
              />
            </AdminFormField>
            <AdminFormField label="Дата окончания" required>
              <Input
                type="date"
                value={cohortForm.end_date}
                onChange={(e) => setCohortForm({...cohortForm, end_date: e.target.value})}
              />
            </AdminFormField>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={resetForms}>Отмена</Button>
            <Button
              onClick={handleAddCohort}
              className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500"
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все связанные данные также будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
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
