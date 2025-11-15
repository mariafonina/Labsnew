import { useState, useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

interface EnrollmentManagerProps {
  productId: number;
  tiers: any[];
  cohorts: any[];
  onRefresh?: () => void;
}

export function EnrollmentManager({ productId, tiers, cohorts, onRefresh }: EnrollmentManagerProps) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    user_id: '',
    pricing_tier_id: '',
    cohort_id: '',
    status: 'active',
    expires_at: ''
  });

  useEffect(() => {
    loadEnrollments();
    loadUsers();
  }, [productId]);

  const loadEnrollments = async () => {
    try {
      const data = await apiClient.getEnrollments(undefined, productId);
      setEnrollments(data);
    } catch (error) {
      console.error('Failed to load enrollments:', error);
      toast.error('Не удалось загрузить зачисления');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiClient.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id || !formData.pricing_tier_id) {
      toast.error('Выберите пользователя и тариф');
      return;
    }

    try {
      await apiClient.createEnrollment({
        user_id: parseInt(formData.user_id),
        product_id: productId,
        pricing_tier_id: parseInt(formData.pricing_tier_id),
        cohort_id: formData.cohort_id ? parseInt(formData.cohort_id) : null,
        status: formData.status,
        expires_at: formData.expires_at || null
      });

      toast.success('Пользователь зачислен на продукт');
      setShowAddForm(false);
      setFormData({
        user_id: '',
        pricing_tier_id: '',
        cohort_id: '',
        status: 'active',
        expires_at: ''
      });
      loadEnrollments();
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to create enrollment:', error);
      toast.error(error.response?.data?.error || 'Не удалось зачислить пользователя');
    }
  };

  const handleUpdateStatus = async (enrollmentId: number, newStatus: string) => {
    try {
      await apiClient.updateEnrollment(enrollmentId, { status: newStatus });
      toast.success('Статус обновлен');
      loadEnrollments();
    } catch (error) {
      console.error('Failed to update enrollment:', error);
      toast.error('Не удалось обновить статус');
    }
  };

  const handleDelete = async (enrollmentId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это зачисление?')) return;

    try {
      await apiClient.deleteEnrollment(enrollmentId);
      toast.success('Зачисление удалено');
      loadEnrollments();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to delete enrollment:', error);
      toast.error('Не удалось удалить зачисление');
    }
  };

  const filteredUsers = users.filter(user => 
    (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enrolledUserIds = enrollments.map(e => e.user_id);
  const availableUsers = filteredUsers.filter(u => !enrolledUserIds.includes(u.id));

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Зачисленные пользователи ({enrollments.length})
        </h3>
        <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Зачислить пользователя
        </Button>
      </div>

      {showAddForm && (
        <div className="border rounded-lg p-6 bg-muted/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Пользователь *</Label>
              <Input
                type="text"
                placeholder="Поиск по имени или email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
              <Select value={formData.user_id} onValueChange={(value: string) => setFormData({ ...formData, user_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пользователя" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Тариф *</Label>
              <Select value={formData.pricing_tier_id} onValueChange={(value: string) => setFormData({ ...formData, pricing_tier_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тариф" />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id.toString()}>
                      {tier.name} (уровень {tier.tier_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Поток (опционально)</Label>
              <Select value={formData.cohort_id} onValueChange={(value: string) => setFormData({ ...formData, cohort_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Без потока" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Без потока</SelectItem>
                  {cohorts.filter(c => c.is_active).map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id.toString()}>
                      {cohort.name} ({cohort.start_date} - {cohort.end_date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Статус</Label>
              <Select value={formData.status} onValueChange={(value: string) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="paused">Приостановлен</SelectItem>
                  <SelectItem value="completed">Завершен</SelectItem>
                  <SelectItem value="cancelled">Отменен</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Срок действия (опционально)</Label>
              <Input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit">Зачислить</Button>
              <Button type="button" variant="outline" onClick={() => {
                setShowAddForm(false);
                setSearchTerm('');
                setFormData({
                  user_id: '',
                  pricing_tier_id: '',
                  cohort_id: '',
                  status: 'active',
                  expires_at: ''
                });
              }}>
                Отмена
              </Button>
            </div>
          </form>
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Нет зачисленных пользователей
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="border rounded-lg p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium">
                  {enrollment.first_name} {enrollment.last_name}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {enrollment.email} • {enrollment.username}
                </div>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-muted-foreground">
                    Тариф: <span className="font-medium text-foreground">{enrollment.tier_name}</span> (уровень {enrollment.tier_level})
                  </span>
                  {enrollment.cohort_name && (
                    <span className="text-muted-foreground">
                      Поток: <span className="font-medium text-foreground">{enrollment.cohort_name}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={enrollment.status}
                  onValueChange={(value: string) => handleUpdateStatus(enrollment.id, value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="paused">Приостановлен</SelectItem>
                    <SelectItem value="completed">Завершен</SelectItem>
                    <SelectItem value="cancelled">Отменен</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(enrollment.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
