import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Package,
  Users as UsersIcon,
  ChevronRight,
  ChevronDown,
  Layers,
  Tag,
  Copy,
  ExternalLink,
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
import { toast } from "sonner";
import { AdminFormWrapper } from "./AdminFormWrapper";
import { AdminFormField } from "./AdminFormField";
import { AdminStreamDetail } from "./AdminStreamDetail";
import { TierForm } from "./admin/TierForm";
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

interface AdminProductsProps {
  selectedProductId?: string;
  selectedCohortId?: string;
  section?: string;
  action?: string;
  itemId?: string;
}

export function AdminProducts({
  selectedProductId,
  selectedCohortId,
  section,
  action,
  itemId
}: AdminProductsProps = {}) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [expandedCohorts, setExpandedCohorts] = useState<Set<number>>(new Set());

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingCohort, setIsAddingCohort] = useState(false);
  const [isAddingTier, setIsAddingTier] = useState(false);
  const [isCopyingCohort, setIsCopyingCohort] = useState(false);
  const [deletingId, setDeletingId] = useState<{ type: string; id: number } | null>(null);

  const [selectedProductForCohort, setSelectedProductForCohort] = useState<number | null>(null);
  const [selectedCohortForTier, setSelectedCohortForTier] = useState<{
    productId: number;
    cohortId: number;
  } | null>(null);
  const [copyingCohort, setCopyingCohort] = useState<{ cohortId: number; productId: number } | null>(
    null
  );

  // Inline editing states
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingProductName, setEditingProductName] = useState("");
  const [editingCohortId, setEditingCohortId] = useState<number | null>(null);
  const [editingCohortName, setEditingCohortName] = useState("");
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [editingTierData, setEditingTierData] = useState({ name: "", price: "" });

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


  const [copyNameForm, setCopyNameForm] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  // Auto-expand product and cohort from URL
  useEffect(() => {
    if (selectedProductId) {
      const productId = Number(selectedProductId);
      setExpandedProducts(prev => new Set(prev).add(productId));

      // Load cohorts if not loaded
      const product = products.find(p => p.id === productId);
      if (product && !product.cohorts) {
        loadProductCohorts(productId);
      }

      if (selectedCohortId) {
        const cohortId = Number(selectedCohortId);
        setExpandedCohorts(prev => new Set(prev).add(cohortId));

        // Load tiers if not loaded
        const cohort = product?.cohorts?.find(c => c.id === cohortId);
        if (cohort && !cohort.tiers) {
          loadCohortTiers(cohortId, productId);
        }
      }
    }
  }, [selectedProductId, selectedCohortId, products]);

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
      const cohorts = await apiClient.getCohorts(productId);

      setProducts(
        products.map((p) => (p.id === productId ? { ...p, cohorts: cohorts } : p))
      );
    } catch (error: any) {
      toast.error("Не удалось загрузить потоки");
      console.error("Failed to load cohorts:", error);
    }
  };

  const loadCohortTiers = async (cohortId: number, productId: number) => {
    try {
      const tiers = await apiClient.getCohortTiers(productId, cohortId);

      setProducts(
        products.map((p) => {
          if (p.id === productId && p.cohorts) {
            return {
              ...p,
              cohorts: p.cohorts.map((c) => (c.id === cohortId ? { ...c, tiers } : c)),
            };
          }
          return p;
        })
      );
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
      const product = products.find((p) => p.id === productId);
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
      const product = products.find((p) => p.id === productId);
      const cohort = product?.cohorts?.find((c) => c.id === cohortId);
      if (cohort && !cohort.tiers) {
        await loadCohortTiers(cohortId, productId);
      }
    }
    setExpandedCohorts(newExpanded);
  };

  const resetForms = () => {
    setProductForm({ name: "", description: "", type: "" });
    setCohortForm({ name: "", description: "", start_date: "", end_date: "" });
    setCopyNameForm("");
    setIsAddingProduct(false);
    setIsAddingCohort(false);
    setIsAddingTier(false);
    setIsCopyingCohort(false);
    setSelectedProductForCohort(null);
    setSelectedCohortForTier(null);
    setCopyingCohort(null);
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

  const handleDeleteProduct = async () => {
    if (!deletingId || deletingId.type !== "product") return;

    try {
      await apiClient.deleteProduct(deletingId.id);
      setProducts(products.filter((p) => p.id !== deletingId.id));
      setDeletingId(null);
      toast.success("Продукт удален");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить продукт");
    }
  };

  const handleAddCohort = async () => {
    if (
      !selectedProductForCohort ||
      !cohortForm.name ||
      !cohortForm.start_date ||
      !cohortForm.end_date
    ) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      await apiClient.createCohort({
        product_id: selectedProductForCohort,
        ...cohortForm,
      });

      await loadProductCohorts(selectedProductForCohort);
      resetForms();
      toast.success("Поток добавлен");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить поток");
    }
  };

  const handleCopyCohort = async () => {
    if (!copyingCohort || !copyNameForm) {
      toast.error("Введите имя нового потока");
      return;
    }

    try {
      await apiClient.copyCohort(copyingCohort.cohortId, { name: copyNameForm });
      await loadProductCohorts(copyingCohort.productId);
      resetForms();
      toast.success("Поток скопирован");
    } catch (error: any) {
      toast.error(error.message || "Не удалось скопировать поток");
    }
  };

  const handleAddTier = async (data: any) => {
    if (!selectedCohortForTier) return;

    try {
      await apiClient.createCohortTier(
        selectedCohortForTier.productId,
        selectedCohortForTier.cohortId,
        data
      );

      await loadCohortTiers(selectedCohortForTier.cohortId, selectedCohortForTier.productId);
      setIsAddingTier(false);
      setSelectedCohortForTier(null);
      toast.success("Тариф добавлен");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить тариф");
    }
  };

  // Inline editing handlers
  const startEditProduct = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProductId(product.id);
    setEditingProductName(product.name);
  };

  const saveProductName = async (productId: number) => {
    if (!editingProductName.trim()) {
      toast.error("Название не может быть пустым");
      return;
    }

    try {
      await apiClient.updateProduct(productId, { name: editingProductName });
      setProducts(
        products.map((p) => (p.id === productId ? { ...p, name: editingProductName } : p))
      );
      setEditingProductId(null);
      toast.success("Название обновлено");
    } catch (error: any) {
      toast.error("Не удалось обновить название");
    }
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setEditingProductName("");
  };

  const startEditCohort = (cohort: Cohort, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCohortId(cohort.id);
    setEditingCohortName(cohort.name);
  };

  const saveCohortName = async (productId: number, cohortId: number) => {
    if (!editingCohortName.trim()) {
      toast.error("Название не может быть пустым");
      return;
    }

    try {
      await apiClient.updateCohort(cohortId, { name: editingCohortName });
      setProducts(
        products.map((p) => {
          if (p.id === productId && p.cohorts) {
            return {
              ...p,
              cohorts: p.cohorts.map((c) =>
                c.id === cohortId ? { ...c, name: editingCohortName } : c
              ),
            };
          }
          return p;
        })
      );
      setEditingCohortId(null);
      toast.success("Название потока обновлено");
    } catch (error: any) {
      toast.error("Не удалось обновить название");
    }
  };

  const cancelEditCohort = () => {
    setEditingCohortId(null);
    setEditingCohortName("");
  };

  const startEditTier = (tier: Tier, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTierId(tier.id);
    setEditingTierData({ name: tier.name, price: tier.price.toString() });
  };

  const saveTierData = async (productId: number, cohortId: number, tierId: number) => {
    if (!editingTierData.name.trim() || !editingTierData.price) {
      toast.error("Заполните все поля");
      return;
    }

    try {
      await apiClient.updateCohortTier(productId, cohortId, tierId, {
        name: editingTierData.name,
        price: parseFloat(editingTierData.price),
      });

      setProducts(
        products.map((p) => {
          if (p.id === productId && p.cohorts) {
            return {
              ...p,
              cohorts: p.cohorts.map((c) => {
                if (c.id === cohortId && c.tiers) {
                  return {
                    ...c,
                    tiers: c.tiers.map((t) =>
                      t.id === tierId
                        ? {
                            ...t,
                            name: editingTierData.name,
                            price: parseFloat(editingTierData.price),
                          }
                        : t
                    ),
                  };
                }
                return c;
              }),
            };
          }
          return p;
        })
      );

      setEditingTierId(null);
      toast.success("Тариф обновлён");
    } catch (error: any) {
      toast.error("Не удалось обновить тариф");
    }
  };

  const cancelEditTier = () => {
    setEditingTierId(null);
    setEditingTierData({ name: "", price: "" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  // Show cohort detail view if selected via URL
  if (selectedProductId && selectedCohortId) {
    const product = products.find(p => p.id === Number(selectedProductId));
    const cohort = product?.cohorts?.find(c => c.id === Number(selectedCohortId));

    if (product && cohort) {
      return (
        <AdminStreamDetail
          cohortId={cohort.id}
          cohortName={cohort.name}
          productName={product.name}
          productId={product.id}
          onBack={() => navigate('/admin/products')}
          section={section}
          action={action}
          itemId={itemId}
        />
      );
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-black text-5xl mb-2">Продукты</h1>
          <p className="text-gray-500 text-lg">
            Управление продуктами, потоками и тарифами • {products.length}{" "}
            {products.length === 1 ? "продукт" : "продуктов"}
          </p>
        </div>
        {!isAddingProduct && (
          <Button
            onClick={() => setIsAddingProduct(true)}
            size="lg"
            className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-5 w-5 mr-2" />
            Добавить продукт
          </Button>
        )}
      </div>

      {/* Add Product Form */}
      {isAddingProduct && (
        <AdminFormWrapper
          title="Новый продукт"
          description="Создайте новый образовательный продукт"
          onSubmit={handleAddProduct}
          onCancel={resetForms}
        >
          <AdminFormField label="Название продукта" required emoji="📦">
            <Input
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="Основной курс"
              className="h-12 text-base"
            />
          </AdminFormField>

          <AdminFormField label="Описание" emoji="📝">
            <Input
              value={productForm.description}
              onChange={(e) =>
                setProductForm({ ...productForm, description: e.target.value })
              }
              placeholder="Краткое описание продукта"
              className="h-12 text-base"
            />
          </AdminFormField>

          <AdminFormField label="Тип" required emoji="🏷️">
            <Input
              value={productForm.type}
              onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
              placeholder="Например: курс, программа, тренинг"
              className="h-12 text-base"
            />
          </AdminFormField>
        </AdminFormWrapper>
      )}

      {/* Add Cohort Form */}
      {isAddingCohort && selectedProductForCohort && (
        <AdminFormWrapper
          title="Новый поток"
          description="Создайте новый поток для продукта"
          onSubmit={handleAddCohort}
          onCancel={resetForms}
        >
          <AdminFormField label="Название потока" required emoji="🌊">
            <Input
              value={cohortForm.name}
              onChange={(e) => setCohortForm({ ...cohortForm, name: e.target.value })}
              placeholder="Поток СЕНТЯБРЬ"
              className="h-12 text-base"
            />
          </AdminFormField>

          <AdminFormField label="Описание" emoji="📝">
            <Input
              value={cohortForm.description}
              onChange={(e) =>
                setCohortForm({ ...cohortForm, description: e.target.value })
              }
              placeholder="Краткое описание потока"
              className="h-12 text-base"
            />
          </AdminFormField>

          <AdminFormField label="Дата начала" required emoji="📅">
            <Input
              type="date"
              value={cohortForm.start_date}
              onChange={(e) =>
                setCohortForm({ ...cohortForm, start_date: e.target.value })
              }
              className="h-12 text-base"
            />
          </AdminFormField>

          <AdminFormField label="Дата окончания" required emoji="📅">
            <Input
              type="date"
              value={cohortForm.end_date}
              onChange={(e) => setCohortForm({ ...cohortForm, end_date: e.target.value })}
              className="h-12 text-base"
            />
          </AdminFormField>
        </AdminFormWrapper>
      )}

      {/* Copy Cohort Form */}
      {isCopyingCohort && copyingCohort && (
        <AdminFormWrapper
          title="Копировать поток"
          description="Введите имя для нового потока"
          onSubmit={handleCopyCohort}
          onCancel={resetForms}
        >
          <AdminFormField label="Название нового потока" required emoji="🌊">
            <Input
              value={copyNameForm}
              onChange={(e) => setCopyNameForm(e.target.value)}
              placeholder="Поток ОКТЯБРЬ"
              className="h-12 text-base"
              autoFocus
            />
          </AdminFormField>
        </AdminFormWrapper>
      )}

      {/* Add Tier Dialog */}
      <Dialog open={isAddingTier} onOpenChange={(open: boolean) => {
        setIsAddingTier(open);
        if (!open) {
          setSelectedCohortForTier(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Добавить тариф</DialogTitle>
            <DialogDescription>
              Создайте новый тариф с настройками доступа и возможностями
            </DialogDescription>
          </DialogHeader>
          <TierForm onSubmit={handleAddTier} />
        </DialogContent>
      </Dialog>

      {/* Products List */}
      {products.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <div className="max-w-sm mx-auto">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="font-black text-2xl text-gray-900 mb-2">Нет продуктов</h3>
            <p className="text-gray-500 mb-6">Создайте первый образовательный продукт</p>
            <Button
              onClick={() => setIsAddingProduct(true)}
              size="lg"
              className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Добавить продукт
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden border-2">
              {/* Product Header */}
              <div className="p-6 bg-gradient-to-r from-pink-50 to-rose-50 cursor-pointer hover:from-pink-100 hover:to-rose-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1" onClick={() => toggleProduct(product.id)}>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      {editingProductId === product.id ? (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Input
                            value={editingProductName}
                            onChange={(e) => setEditingProductName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveProductName(product.id);
                              if (e.key === "Escape") cancelEditProduct();
                            }}
                            className="h-10 font-black text-2xl"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => saveProductName(product.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditProduct}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 group">
                            <h3 className="font-black text-2xl text-gray-900">
                              {product.name}
                            </h3>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => startEditProduct(product, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Редактировать название"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                      {product.description && (
                        <p className="text-gray-600 mt-1">{product.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <Badge className="bg-pink-100 text-pink-700">
                          <Layers className="h-3 w-3 mr-1" />
                          {product.cohort_count}{" "}
                          {product.cohort_count === 1 ? "поток" : "потоков"}
                        </Badge>
                        <Badge className="bg-rose-100 text-rose-700">
                          <Tag className="h-3 w-3 mr-1" />
                          {product.tier_count} тарифов
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-700">
                          <UsersIcon className="h-3 w-3 mr-1" />
                          {product.enrollment_count} зачислений
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId({ type: "product", id: product.id });
                      }}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <button onClick={() => toggleProduct(product.id)}>
                      {expandedProducts.has(product.id) ? (
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Content */}
              {expandedProducts.has(product.id) && (
                <div className="p-6 space-y-4">
                  {/* Cohorts */}
                  {product.cohorts &&
                    product.cohorts.map((cohort) => (
                      <Card key={cohort.id} className="overflow-hidden border">
                        <div className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1" onClick={() => toggleCohort(cohort.id, product.id)}>
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center">
                                <Layers className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                {editingCohortId === cohort.id ? (
                                  <div
                                    className="flex items-center gap-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Input
                                      value={editingCohortName}
                                      onChange={(e) => setEditingCohortName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          saveCohortName(product.id, cohort.id);
                                        if (e.key === "Escape") cancelEditCohort();
                                      }}
                                      className="h-9 font-bold text-lg"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => saveCohortName(product.id, cohort.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelEditCohort}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2 group">
                                      <h4 className="font-bold text-lg text-gray-900">
                                        {cohort.name}
                                      </h4>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => startEditCohort(cohort, e)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        title="Редактировать название потока"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                  <p className="text-sm text-gray-500">
                                    {cohort.tiers?.length || 0}{" "}
                                    {cohort.tiers?.length === 1 ? "тариф" : "тарифов"}
                                  </p>
                                  <span className="text-sm text-gray-400">•</span>
                                  <p className="text-sm text-gray-500">
                                    {cohort.member_count} участников
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/products/${product.id}/cohorts/${cohort.id}`);
                                }}
                                style={{
                                  background: 'linear-gradient(to right, rgb(99, 102, 241), rgb(168, 85, 247))',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(79, 70, 229), rgb(147, 51, 234))';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(99, 102, 241), rgb(168, 85, 247))';
                                }}
                                className="inline-flex items-center justify-center gap-2 h-10 rounded-md px-6 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all"
                                title="Управление материалами потока"
                              >
                                <ExternalLink className="h-5 w-5" />
                                Управлять потоком
                              </button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCopyingCohort({ cohortId: cohort.id, productId: product.id });
                                  setIsCopyingCohort(true);
                                }}
                                className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300"
                                title="Копировать поток со всеми тарифами"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <button onClick={() => toggleCohort(cohort.id, product.id)}>
                                {expandedCohorts.has(cohort.id) ? (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Tiers */}
                        {expandedCohorts.has(cohort.id) && (
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {cohort.tiers &&
                                cohort.tiers.map((tier) => (
                                  <Card
                                    key={tier.id}
                                    className="p-4 bg-white border hover:shadow-md transition-shadow group"
                                  >
                                    {editingTierId === tier.id ? (
                                      <div
                                        className="space-y-3"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center shrink-0">
                                            <Tag className="h-4 w-4 text-white" />
                                          </div>
                                          <Input
                                            value={editingTierData.name}
                                            onChange={(e) =>
                                              setEditingTierData({
                                                ...editingTierData,
                                                name: e.target.value,
                                              })
                                            }
                                            placeholder="Название тарифа"
                                            className="h-9"
                                          />
                                        </div>
                                        <Input
                                          type="number"
                                          value={editingTierData.price}
                                          onChange={(e) =>
                                            setEditingTierData({
                                              ...editingTierData,
                                              price: e.target.value,
                                            })
                                          }
                                          placeholder="Цена"
                                          className="h-9"
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              saveTierData(product.id, cohort.id, tier.id)
                                            }
                                            className="bg-green-600 hover:bg-green-700 flex-1"
                                          >
                                            <Save className="h-3 w-3 mr-1" />
                                            Сохранить
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={cancelEditTier}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2 flex-1">
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center">
                                              <Tag className="h-4 w-4 text-white" />
                                            </div>
                                            <h5 className="font-bold text-gray-900 flex-1">
                                              {tier.name}
                                            </h5>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={(e) => startEditTier(tier, e)}
                                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                              title="Редактировать тариф"
                                            >
                                              <Edit2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        <p className="font-semibold text-2xl text-pink-600 mb-2">
                                          {tier.price.toLocaleString("ru-RU")} ₽
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <span className="text-xs px-2 py-1 rounded bg-gray-100">
                                            Уровень {tier.tier_level}
                                          </span>
                                          <UsersIcon className="h-4 w-4" />
                                          <span>{tier.userCount || 0} пользователей</span>
                                        </div>
                                      </>
                                    )}
                                  </Card>
                                ))}
                            </div>

                            {/* Add Tier Button */}
                            <Button
                              onClick={() => {
                                setSelectedCohortForTier({
                                  productId: product.id,
                                  cohortId: cohort.id,
                                });
                                setIsAddingTier(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full border-dashed border-2 hover:border-green-300 hover:bg-green-50"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Добавить тариф
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}

                  {/* Add Cohort Button */}
                  <Button
                    onClick={() => {
                      setSelectedProductForCohort(product.id);
                      setIsAddingCohort(true);
                    }}
                    variant="outline"
                    className="w-full border-dashed border-2 hover:border-purple-300 hover:bg-purple-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить поток
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить продукт?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Продукт и все его потоки будут удалены.
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
