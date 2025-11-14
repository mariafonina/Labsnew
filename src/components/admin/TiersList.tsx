import { useState } from 'react';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TierForm } from './TierForm';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

interface Tier {
  id: number;
  name: string;
  description: string;
  price: number;
  tier_level: number;
  features: string[];
  is_active: boolean;
}

interface TiersListProps {
  productId: number;
  tiers: Tier[];
  onUpdate: () => void;
}

export function TiersList({ productId, tiers, onUpdate }: TiersListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);

  const handleCreateTier = async (data: any) => {
    try {
      await apiClient.createProductTier(productId, data);
      toast.success('Тариф успешно создан');
      setIsCreateDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to create tier:', error);
      toast.error('Не удалось создать тариф');
    }
  };

  const handleUpdateTier = async (data: any) => {
    if (!editingTier) return;

    try {
      await apiClient.updateProductTier(productId, editingTier.id, data);
      toast.success('Тариф успешно обновлен');
      setEditingTier(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update tier:', error);
      toast.error('Не удалось обновить тариф');
    }
  };

  const handleDeleteTier = async (tierId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот тариф?')) return;

    try {
      await apiClient.deleteProductTier(productId, tierId);
      toast.success('Тариф удален');
      onUpdate();
    } catch (error) {
      console.error('Failed to delete tier:', error);
      toast.error('Не удалось удалить тариф');
    }
  };

  const handleToggleActive = async (tier: Tier) => {
    try {
      await apiClient.updateProductTier(productId, tier.id, {
        is_active: !tier.is_active
      });
      toast.success(tier.is_active ? 'Тариф деактивирован' : 'Тариф активирован');
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle tier status:', error);
      toast.error('Не удалось изменить статус');
    }
  };

  const sortedTiers = [...tiers].sort((a, b) => a.tier_level - b.tier_level);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Тарифы продукта</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Добавить тариф
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Создать новый тариф</DialogTitle>
            </DialogHeader>
            <TierForm onSubmit={handleCreateTier} />
          </DialogContent>
        </Dialog>
      </div>

      {sortedTiers.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <p>Тарифы еще не созданы</p>
            <p className="text-sm mt-1">Создайте первый тариф для этого продукта</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedTiers.map((tier) => (
            <Card key={tier.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                      {tier.tier_level}
                    </div>
                    <div>
                      <h4 className="font-semibold">{tier.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {tier.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="text-2xl font-bold">
                      {tier.price.toLocaleString('ru-RU')} ₽
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        tier.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {tier.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  {tier.features && tier.features.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog open={editingTier?.id === tier.id} onOpenChange={(open: boolean) => !open && setEditingTier(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTier(tier)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Редактировать тариф</DialogTitle>
                      </DialogHeader>
                      <TierForm tier={editingTier} onSubmit={handleUpdateTier} />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(tier)}
                  >
                    {tier.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTier(tier.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
