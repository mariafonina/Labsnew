import { useState, useEffect } from 'react';
import { Plus, Package, Edit, Trash2, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProductForm } from '@/components/admin/ProductForm';
import { TiersList } from '@/components/admin/TiersList';
import { CohortsList } from '@/components/admin/CohortsList';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  description: string;
  type: string;
  duration_weeks: number;
  default_price: number;
  is_active: boolean;
  created_at: string;
}

interface Tier {
  id: number;
  name: string;
  description: string;
  price: number;
  tier_level: number;
  features: string[];
  is_active: boolean;
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadTiers(selectedProduct.id);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      const products = await apiClient.getProducts();
      setProducts(products);
      
      if (selectedProduct) {
        const stillExists = products.find(p => p.id === selectedProduct.id);
        if (!stillExists) {
          setSelectedProduct(products[0] || null);
        }
      } else if (products.length > 0) {
        setSelectedProduct(products[0]);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Не удалось загрузить продукты');
    } finally {
      setLoading(false);
    }
  };

  const loadTiers = async (productId: number) => {
    try {
      const tiers = await apiClient.getProductTiers(productId);
      setTiers(tiers);
    } catch (error) {
      console.error('Failed to load tiers:', error);
      toast.error('Не удалось загрузить тарифы');
    }
  };

  const handleCreateProduct = async (data: any) => {
    try {
      await apiClient.createProduct(data);
      toast.success('Продукт успешно создан');
      setIsCreateDialogOpen(false);
      loadProducts();
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Не удалось создать продукт');
    }
  };

  const handleUpdateProduct = async (data: any) => {
    if (!editingProduct) return;
    
    try {
      await apiClient.updateProduct(editingProduct.id, data);
      toast.success('Продукт успешно обновлен');
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('Не удалось обновить продукт');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот продукт?')) return;

    try {
      await apiClient.deleteProduct(productId);
      toast.success('Продукт удален');
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }
      loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Не удалось удалить продукт');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await apiClient.updateProduct(product.id, {
        is_active: !product.is_active
      });
      toast.success(product.is_active ? 'Продукт деактивирован' : 'Продукт активирован');
      loadProducts();
    } catch (error) {
      console.error('Failed to toggle product status:', error);
      toast.error('Не удалось изменить статус');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление продуктами</h1>
          <p className="text-muted-foreground mt-1">
            Создавайте и управляйте образовательными продуктами, тарифами и потоками
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Создать продукт
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Создать новый продукт</DialogTitle>
            </DialogHeader>
            <ProductForm onSubmit={handleCreateProduct} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Список продуктов</h3>
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedProduct?.id === product.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {product.type} • {product.duration_weeks} недель
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Нет созданных продуктов
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="col-span-8">
          {selectedProduct ? (
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                  <p className="text-muted-foreground mt-1">
                    {selectedProduct.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Dialog open={!!editingProduct} onOpenChange={(open: boolean) => !open && setEditingProduct(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProduct(selectedProduct)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Редактировать
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Редактировать продукт</DialogTitle>
                      </DialogHeader>
                      <ProductForm
                        product={editingProduct}
                        onSubmit={handleUpdateProduct}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(selectedProduct)}
                  >
                    {selectedProduct.is_active ? 'Деактивировать' : 'Активировать'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteProduct(selectedProduct.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="tiers">
                <TabsList>
                  <TabsTrigger value="tiers">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Тарифы
                  </TabsTrigger>
                  <TabsTrigger value="cohorts">
                    <Users className="w-4 h-4 mr-2" />
                    Потоки
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="tiers" className="mt-4">
                  <TiersList
                    productId={selectedProduct.id}
                    tiers={tiers}
                    onUpdate={() => loadTiers(selectedProduct.id)}
                  />
                </TabsContent>
                <TabsContent value="cohorts" className="mt-4">
                  <CohortsList productId={selectedProduct.id} />
                </TabsContent>
              </Tabs>
            </Card>
          ) : (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Выберите продукт для просмотра деталей</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
