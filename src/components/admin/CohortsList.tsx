import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users as UsersIcon, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CohortForm } from './CohortForm';
import { CohortMembers } from './CohortMembers';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

interface Cohort {
  id: number;
  product_id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  max_members: number | null;
  created_at: string;
}

interface CohortsListProps {
  productId: number;
}

export function CohortsList({ productId }: CohortsListProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);

  useEffect(() => {
    loadCohorts();
  }, [productId]);

  const loadCohorts = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getCohorts(productId);
      setCohorts(data);
    } catch (error) {
      console.error('Failed to load cohorts:', error);
      toast.error('Не удалось загрузить потоки');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCohort = async (data: any) => {
    try {
      await apiClient.createCohort({ ...data, product_id: productId });
      toast.success('Поток успешно создан');
      setIsCreateDialogOpen(false);
      loadCohorts();
    } catch (error) {
      console.error('Failed to create cohort:', error);
      toast.error('Не удалось создать поток');
    }
  };

  const handleUpdateCohort = async (data: any) => {
    if (!editingCohort) return;

    try {
      await apiClient.updateCohort(editingCohort.id, data);
      toast.success('Поток успешно обновлен');
      setEditingCohort(null);
      loadCohorts();
    } catch (error) {
      console.error('Failed to update cohort:', error);
      toast.error('Не удалось обновить поток');
    }
  };

  const handleDeleteCohort = async (cohortId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот поток?')) return;

    try {
      await apiClient.deleteCohort(cohortId);
      toast.success('Поток удален');
      if (selectedCohort?.id === cohortId) {
        setSelectedCohort(null);
      }
      loadCohorts();
    } catch (error) {
      console.error('Failed to delete cohort:', error);
      toast.error('Не удалось удалить поток');
    }
  };

  const handleToggleActive = async (cohort: Cohort) => {
    try {
      await apiClient.updateCohort(cohort.id, {
        is_active: !cohort.is_active
      });
      toast.success(cohort.is_active ? 'Поток деактивирован' : 'Поток активирован');
      loadCohorts();
    } catch (error) {
      console.error('Failed to toggle cohort status:', error);
      toast.error('Не удалось изменить статус');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Учебные потоки</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Создать поток
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Создать новый поток</DialogTitle>
            </DialogHeader>
            <CohortForm onSubmit={handleCreateCohort} />
          </DialogContent>
        </Dialog>
      </div>

      {cohorts.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <p>Потоки еще не созданы</p>
            <p className="text-sm mt-1">Создайте первый поток для этого продукта</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cohorts.map((cohort) => (
            <Card key={cohort.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <h4 className="font-semibold text-lg">{cohort.name}</h4>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDate(cohort.start_date)} — {formatDate(cohort.end_date)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        cohort.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {cohort.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                    {cohort.max_members && (
                      <span className="text-sm text-muted-foreground">
                        Макс. участников: {cohort.max_members}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCohort(cohort)}
                    title="Управление участниками"
                  >
                    <UsersIcon className="w-4 h-4" />
                  </Button>
                  <Dialog open={editingCohort?.id === cohort.id} onOpenChange={(open: boolean) => !open && setEditingCohort(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCohort(cohort)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Редактировать поток</DialogTitle>
                      </DialogHeader>
                      <CohortForm cohort={editingCohort} onSubmit={handleUpdateCohort} />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(cohort)}
                  >
                    {cohort.is_active ? 'Деактивировать' : 'Активировать'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCohort(cohort.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedCohort && (
        <Dialog open={!!selectedCohort} onOpenChange={(open: boolean) => !open && setSelectedCohort(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Участники потока: {selectedCohort.name}</DialogTitle>
            </DialogHeader>
            <CohortMembers cohortId={selectedCohort.id} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
