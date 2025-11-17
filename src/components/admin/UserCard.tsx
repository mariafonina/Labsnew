import { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, Package, Users, BookOpen, Heart, MessageSquare, FileText, Video, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

interface UserCardProps {
  user: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
  };
  onClose: () => void;
}

export function UserCard({ user, onClose }: UserCardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [tiers, setTiers] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [enrollFormData, setEnrollFormData] = useState({
    pricing_tier_id: '',
    cohort_id: '',
    status: 'active',
    expires_at: ''
  });

  useEffect(() => {
    loadStats();
    loadProducts();
  }, [user.id]);

  useEffect(() => {
    if (selectedProductId) {
      loadProductData(parseInt(selectedProductId));
    } else {
      setTiers([]);
      setCohorts([]);
    }
  }, [selectedProductId]);

  const loadProducts = async () => {
    try {
      const data = await apiClient.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadProductData = async (productId: number) => {
    try {
      const [tiersData, cohortsData] = await Promise.all([
        apiClient.getTiers(productId),
        apiClient.getCohorts(productId)
      ]);
      setTiers(tiersData);
      setCohorts(cohortsData);
    } catch (error) {
      console.error('Failed to load product data:', error);
    }
  };

  const handleEnroll = async () => {
    if (!selectedProductId || !enrollFormData.pricing_tier_id) {
      toast.error('Выберите продукт и тариф');
      return;
    }

    try {
      await apiClient.createEnrollment({
        user_id: user.id,
        product_id: parseInt(selectedProductId),
        pricing_tier_id: parseInt(enrollFormData.pricing_tier_id),
        cohort_id: enrollFormData.cohort_id ? parseInt(enrollFormData.cohort_id) : null,
        status: enrollFormData.status,
        expires_at: enrollFormData.expires_at || null
      });

      toast.success('Пользователь зачислен в продукт');
      setShowEnrollDialog(false);
      setSelectedProductId('');
      setEnrollFormData({
        pricing_tier_id: '',
        cohort_id: '',
        status: 'active',
        expires_at: ''
      });
      loadStats();
    } catch (error: any) {
      console.error('Failed to enroll user:', error);
      toast.error(error.response?.data?.error || 'Не удалось зачислить пользователя');
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${user.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load user stats:', error);
      toast.error('Не удалось загрузить статистику пользователя');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Загрузка статистики...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {stats.user.first_name || stats.user.last_name
                ? `${stats.user.first_name || ''} ${stats.user.last_name || ''}`.trim()
                : stats.user.username}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {stats.user.username}
              </div>
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {stats.user.email}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Tabs defaultValue="enrollments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enrollments">Продукты и потоки</TabsTrigger>
            <TabsTrigger value="activity">Активность</TabsTrigger>
            <TabsTrigger value="stats">Статистика</TabsTrigger>
          </TabsList>

          <TabsContent value="enrollments" className="space-y-4 mt-4">
            <div className="flex justify-end mb-4">
              <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Зачислить в продукт
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Зачислить пользователя в продукт</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="product">Продукт *</Label>
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
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
                    </div>

                    {selectedProductId && tiers.length > 0 && (
                      <div>
                        <Label htmlFor="tier">Тариф *</Label>
                        <Select 
                          value={enrollFormData.pricing_tier_id} 
                          onValueChange={(value) => setEnrollFormData({ ...enrollFormData, pricing_tier_id: value })}
                        >
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
                    )}

                    {selectedProductId && cohorts.length > 0 && (
                      <div>
                        <Label htmlFor="cohort">Поток (необязательно)</Label>
                        <Select 
                          value={enrollFormData.cohort_id} 
                          onValueChange={(value) => setEnrollFormData({ ...enrollFormData, cohort_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите поток" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Без потока</SelectItem>
                            {cohorts.map((cohort) => (
                              <SelectItem key={cohort.id} value={cohort.id.toString()}>
                                {cohort.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="status">Статус</Label>
                      <Select 
                        value={enrollFormData.status} 
                        onValueChange={(value) => setEnrollFormData({ ...enrollFormData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Активен</SelectItem>
                          <SelectItem value="inactive">Неактивен</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="expires_at">Дата окончания доступа (необязательно)</Label>
                      <Input
                        id="expires_at"
                        type="date"
                        value={enrollFormData.expires_at}
                        onChange={(e) => setEnrollFormData({ ...enrollFormData, expires_at: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleEnroll}>
                        Зачислить
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Потоки ({stats.cohorts.length})
              </h3>
              {stats.cohorts.length === 0 ? (
                <p className="text-sm text-gray-500">Пользователь не состоит ни в одном потоке</p>
              ) : (
                <div className="space-y-2">
                  {stats.cohorts.map((cohort: any) => (
                    <div key={cohort.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{cohort.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {cohort.start_date && cohort.end_date && (
                          <>
                            {new Date(cohort.start_date).toLocaleDateString('ru-RU')} - {new Date(cohort.end_date).toLocaleDateString('ru-RU')}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Активные продукты ({stats.enrollments.active.length})
              </h3>
              {stats.enrollments.active.length === 0 ? (
                <p className="text-sm text-gray-500">Нет активных продуктов</p>
              ) : (
                <div className="space-y-2">
                  {stats.enrollments.active.map((enrollment: any) => (
                    <div key={enrollment.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{enrollment.product_name}</div>
                      {enrollment.tier_name && (
                        <Badge variant="secondary" className="mt-1">{enrollment.tier_name}</Badge>
                      )}
                      {enrollment.cohort_name && (
                        <div className="text-sm text-gray-600 mt-1">Поток: {enrollment.cohort_name}</div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">
                        {enrollment.expires_at 
                          ? `Доступ до: ${new Date(enrollment.expires_at).toLocaleDateString('ru-RU')}`
                          : 'Бессрочный доступ'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Истекшие продукты ({stats.enrollments.expired.length})
              </h3>
              {stats.enrollments.expired.length === 0 ? (
                <p className="text-sm text-gray-500">Нет истекших продуктов</p>
              ) : (
                <div className="space-y-2">
                  {stats.enrollments.expired.map((enrollment: any) => (
                    <div key={enrollment.id} className="p-3 border rounded-lg opacity-60">
                      <div className="font-medium">{enrollment.product_name}</div>
                      {enrollment.tier_name && (
                        <Badge variant="secondary" className="mt-1">{enrollment.tier_name}</Badge>
                      )}
                      {enrollment.expires_at && (
                        <div className="text-sm text-gray-600 mt-1">
                          Истек: {new Date(enrollment.expires_at).toLocaleDateString('ru-RU')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Просмотренные уроки ({stats.activity.progress.length})
              </h3>
              {stats.activity.progress.length === 0 ? (
                <p className="text-sm text-gray-500">Нет просмотренных уроков</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.activity.progress.map((item: any) => (
                    <div key={item.instruction_id} className="p-3 border rounded-lg">
                      <div className="font-medium">{item.instruction_title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {item.completed && <Badge variant="default" className="mr-2">Завершено</Badge>}
                        Последний просмотр: {new Date(item.last_accessed).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Просмотренные записи ({stats.activity.recordingViews?.length || 0})
              </h3>
              {(!stats.activity.recordingViews || stats.activity.recordingViews.length === 0) ? (
                <p className="text-sm text-gray-500">Нет просмотренных записей</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.activity.recordingViews.map((view: any) => (
                    <div key={view.recording_id} className="p-3 border rounded-lg">
                      <div className="font-medium">{view.recording_title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Просмотрено: {new Date(view.viewed_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Заметки ({stats.activity.notes.length})
              </h3>
              {stats.activity.notes.length === 0 ? (
                <p className="text-sm text-gray-500">Нет заметок</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.activity.notes.map((note: any) => (
                    <div key={note.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{note.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {new Date(note.updated_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Избранное ({stats.activity.favorites.length})
              </h3>
              {stats.activity.favorites.length === 0 ? (
                <p className="text-sm text-gray-500">Нет избранного</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.activity.favorites.map((fav: any) => (
                    <div key={fav.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{fav.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Тип: {fav.item_type} • {new Date(fav.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Комментарии ({stats.activity.comments.length})
              </h3>
              {stats.activity.comments.length === 0 ? (
                <p className="text-sm text-gray-500">Нет комментариев</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.activity.comments.map((comment: any) => (
                    <div key={comment.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{comment.event_title}</div>
                      <div className="text-sm mt-1">{comment.content}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {comment.likes > 0 && <Badge variant="secondary" className="mr-2">❤️ {comment.likes}</Badge>}
                        {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold">{stats.activity.progress.length}</div>
                <div className="text-sm text-gray-600">Просмотренных уроков</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">
                  {stats.activity.progress.filter((p: any) => p.completed).length}
                </div>
                <div className="text-sm text-gray-600">Завершенных уроков</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">{stats.activity.notes.length}</div>
                <div className="text-sm text-gray-600">Заметок</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">{stats.activity.favorites.length}</div>
                <div className="text-sm text-gray-600">Избранного</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">{stats.activity.comments.length}</div>
                <div className="text-sm text-gray-600">Комментариев</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">
                  {stats.activity.comments.reduce((sum: number, c: any) => sum + (c.likes || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Лайков получено</div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

