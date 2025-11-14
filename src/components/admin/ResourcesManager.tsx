import { useState, useEffect } from 'react';
import { Plus, X, FileText, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

interface ResourcesManagerProps {
  productId: number;
  tiers: any[];
}

export function ResourcesManager({ productId, tiers }: ResourcesManagerProps) {
  const [productResources, setProductResources] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [instructions, setInstructions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState<'recording' | 'instruction' | null>(null);
  
  const [formData, setFormData] = useState({
    resource_id: '',
    min_tier_level: tiers.length > 0 ? tiers[0].tier_level.toString() : '1'
  });

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadProductResources(),
        loadRecordings(),
        loadInstructions()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductResources = async () => {
    try {
      const data = await apiClient.getProductResources(productId);
      setProductResources(data);
    } catch (error) {
      console.error('Failed to load product resources:', error);
      toast.error('Не удалось загрузить материалы продукта');
    }
  };

  const loadRecordings = async () => {
    try {
      const data = await apiClient.getRecordings();
      setRecordings(data);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const loadInstructions = async () => {
    try {
      const data = await apiClient.getInstructions();
      setInstructions(data);
    } catch (error) {
      console.error('Failed to load instructions:', error);
    }
  };

  const handleAddResource = async (resourceType: 'recording' | 'instruction') => {
    if (!formData.resource_id) {
      toast.error('Выберите материал');
      return;
    }

    try {
      await apiClient.assignProductResource(productId, {
        resource_type: resourceType,
        resource_id: parseInt(formData.resource_id),
        min_tier_level: parseInt(formData.min_tier_level)
      });

      toast.success('Материал добавлен к продукту');
      setShowAddForm(null);
      setFormData({ resource_id: '', min_tier_level: '1' });
      loadProductResources();
    } catch (error: any) {
      console.error('Failed to add resource:', error);
      toast.error(error.response?.data?.error || 'Не удалось добавить материал');
    }
  };

  const handleRemoveResource = async (resourceId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот материал из продукта?')) return;

    try {
      await apiClient.removeProductResource(productId, resourceId);
      toast.success('Материал удален');
      loadProductResources();
    } catch (error) {
      console.error('Failed to remove resource:', error);
      toast.error('Не удалось удалить материал');
    }
  };

  const getResourcesByType = (type: string) => {
    return productResources.filter(r => r.resource_type === type);
  };

  const getAvailableRecordings = () => {
    const assignedIds = getResourcesByType('recording').map(r => r.resource_id);
    return recordings.filter(r => !assignedIds.includes(r.id));
  };

  const getAvailableInstructions = () => {
    const assignedIds = getResourcesByType('instruction').map(r => r.resource_id);
    return instructions.filter(i => !assignedIds.includes(i.id));
  };

  const getResourceDetails = (resourceType: string, resourceId: number) => {
    if (resourceType === 'recording') {
      return recordings.find(r => r.id === resourceId);
    } else if (resourceType === 'instruction') {
      return instructions.find(i => i.id === resourceId);
    }
    return null;
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Материалы продукта</h3>
        <p className="text-sm text-muted-foreground">
          Назначьте записи и инструкции этому продукту с указанием минимального тарифа для доступа
        </p>
      </div>

      <Tabs defaultValue="recordings">
        <TabsList>
          <TabsTrigger value="recordings">
            <Video className="w-4 h-4 mr-2" />
            Записи ({getResourcesByType('recording').length})
          </TabsTrigger>
          <TabsTrigger value="instructions">
            <FileText className="w-4 h-4 mr-2" />
            Инструкции ({getResourcesByType('instruction').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recordings" className="space-y-4">
          {tiers.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
              Сначала создайте хотя бы один тариф для этого продукта
            </div>
          ) : (
            <Button
              onClick={() => setShowAddForm(showAddForm === 'recording' ? null : 'recording')}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить запись
            </Button>
          )}

          {showAddForm === 'recording' && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="space-y-4">
                <div>
                  <Label>Запись *</Label>
                  <Select
                    value={formData.resource_id}
                    onValueChange={(value: string) => setFormData({ ...formData, resource_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите запись" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRecordings().map((recording) => (
                        <SelectItem key={recording.id} value={recording.id.toString()}>
                          {recording.title} ({recording.date})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Минимальный тариф для доступа</Label>
                  <Select
                    value={formData.min_tier_level}
                    onValueChange={(value: string) => setFormData({ ...formData, min_tier_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.tier_level} value={tier.tier_level.toString()}>
                          {tier.name} (уровень {tier.tier_level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleAddResource('recording')}>Добавить</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(null);
                      setFormData({ resource_id: '', min_tier_level: '1' });
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {getResourcesByType('recording').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет добавленных записей
              </div>
            ) : (
              getResourcesByType('recording').map((resource) => {
                const details = getResourceDetails('recording', resource.resource_id);
                if (!details) return null;

                return (
                  <div
                    key={resource.id}
                    className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{details.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {details.date} • {details.instructor}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Минимальный тариф:{' '}
                        <span className="font-medium text-foreground">
                          {resource.min_tier_name || `Уровень ${resource.min_tier_level}`}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveResource(resource.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="instructions" className="space-y-4">
          {tiers.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
              Сначала создайте хотя бы один тариф для этого продукта
            </div>
          ) : (
            <Button
              onClick={() => setShowAddForm(showAddForm === 'instruction' ? null : 'instruction')}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить инструкцию
            </Button>
          )}

          {showAddForm === 'instruction' && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="space-y-4">
                <div>
                  <Label>Инструкция *</Label>
                  <Select
                    value={formData.resource_id}
                    onValueChange={(value: string) => setFormData({ ...formData, resource_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите инструкцию" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableInstructions().map((instruction) => (
                        <SelectItem key={instruction.id} value={instruction.id.toString()}>
                          {instruction.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Минимальный тариф для доступа</Label>
                  <Select
                    value={formData.min_tier_level}
                    onValueChange={(value: string) => setFormData({ ...formData, min_tier_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.tier_level} value={tier.tier_level.toString()}>
                          {tier.name} (уровень {tier.tier_level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleAddResource('instruction')}>Добавить</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(null);
                      setFormData({ resource_id: '', min_tier_level: '1' });
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {getResourcesByType('instruction').length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет добавленных инструкций
              </div>
            ) : (
              getResourcesByType('instruction').map((resource) => {
                const details = getResourceDetails('instruction', resource.resource_id);
                if (!details) return null;

                return (
                  <div
                    key={resource.id}
                    className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{details.title}</div>
                      {details.category && (
                        <div className="text-sm text-muted-foreground">{details.category}</div>
                      )}
                      <div className="text-sm text-muted-foreground mt-1">
                        Минимальный тариф:{' '}
                        <span className="font-medium text-foreground">
                          {resource.min_tier_name || `Уровень ${resource.min_tier_level}`}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveResource(resource.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
