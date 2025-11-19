import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Package, Users, BookOpen, Heart, MessageSquare, FileText, Video, UserPlus, Activity, BarChart3, Clock, Globe } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { apiClient } from '../api/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface AdminUserDetailProps {
  userId: number;
  onBack: () => void;
}

export function AdminUserDetail({ userId, onBack }: AdminUserDetailProps) {
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
  }, [userId]);

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
        apiClient.getProductTiers(productId),
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
        user_id: userId,
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
      const response = await apiClient.get(`/admin/users/${userId}/stats`);
      setStats(response);
    } catch (error) {
      console.error('Failed to load user stats:', error);
      toast.error('Не удалось загрузить статистику пользователя');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0 сек';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    } else if (minutes > 0) {
      return `${minutes} мин ${secs} сек`;
    } else {
      return `${secs} сек`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка данных пользователя...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Не удалось загрузить данные пользователя</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
      </div>
    );
  }

  const fullName = stats.user.first_name || stats.user.last_name
    ? `${stats.user.first_name || ''} ${stats.user.last_name || ''}`.trim()
    : stats.user.username;

  const pageVisits = stats.activity?.pageVisits || {};
  const visitsStats = pageVisits.statistics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к списку
          </Button>
          <div>
            <h1 className="font-black text-4xl mb-2">{fullName}</h1>
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
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Общая информация</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
          <TabsTrigger value="products">Продукты</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
        </TabsList>

        {/* Общая информация */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-pink-500" />
                <h3 className="font-semibold">Всего посещений</h3>
              </div>
              <p className="text-3xl font-bold">{visitsStats.total_visits || 0}</p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Уникальных страниц</h3>
              </div>
              <p className="text-3xl font-bold">{visitsStats.unique_pages || 0}</p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">Среднее время</h3>
              </div>
              <p className="text-3xl font-bold">{formatTime(Math.round(visitsStats.avg_time_spent || 0))}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Статистика активности
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Прогресс по инструкциям</p>
                <p className="text-2xl font-bold">{stats.activity?.progress?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Просмотренные записи</p>
                <p className="text-2xl font-bold">{stats.activity?.recordingViews?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Заметки</p>
                <p className="text-2xl font-bold">{stats.activity?.notes?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Избранное</p>
                <p className="text-2xl font-bold">{stats.activity?.favorites?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Комментарии</p>
                <p className="text-2xl font-bold">{stats.activity?.comments?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Потоки</p>
                <p className="text-2xl font-bold">{stats.cohorts?.length || 0}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Активность */}
        <TabsContent value="activity" className="space-y-6 mt-6">
          {pageVisits.recent_visits && pageVisits.recent_visits.length > 0 ? (
            <>
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Последние посещения
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Страница</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Время</TableHead>
                        <TableHead>Длительность</TableHead>
                        <TableHead>Устройство</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageVisits.recent_visits.slice(0, 20).map((visit: any) => (
                        <TableRow key={visit.id}>
                          <TableCell className="font-medium">{visit.page_title || visit.page_path}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{visit.page_type || 'unknown'}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(visit.visited_at)}</TableCell>
                          <TableCell>{formatTime(visit.time_spent_seconds || 0)}</TableCell>
                          <TableCell>{visit.device_type || 'desktop'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {pageVisits.popular_pages && pageVisits.popular_pages.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Популярные страницы
                  </h3>
                  <div className="space-y-2">
                    {pageVisits.popular_pages.map((page: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{page.page_title || page.page_path}</p>
                          <p className="text-sm text-gray-500">{page.page_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{page.visit_count} посещений</p>
                          <p className="text-sm text-gray-500">{formatTime(Math.round(page.avg_time_spent || 0))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6">
              <p className="text-gray-500 text-center">Нет данных о посещениях</p>
            </Card>
          )}
        </TabsContent>

        {/* Продукты */}
        <TabsContent value="products" className="space-y-6 mt-6">
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
                        onValueChange={(value: string) => setEnrollFormData({ ...enrollFormData, pricing_tier_id: value })}
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
                        value={enrollFormData.cohort_id || "none"} 
                        onValueChange={(value: string) => setEnrollFormData({ ...enrollFormData, cohort_id: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите поток" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Без потока</SelectItem>
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
                      onValueChange={(value: string) => setEnrollFormData({ ...enrollFormData, status: value })}
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
              Потоки ({stats.cohorts?.length || 0})
            </h3>
            {stats.cohorts && stats.cohorts.length === 0 ? (
              <p className="text-sm text-gray-500">Пользователь не состоит ни в одном потоке</p>
            ) : (
              <div className="space-y-2">
                {stats.cohorts?.map((cohort: any) => (
                  <Card key={cohort.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{cohort.name}</p>
                        <p className="text-sm text-gray-500">
                          Присоединился: {formatDate(cohort.joined_at)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Активные продукты ({stats.enrollments?.active?.length || 0})
            </h3>
            {stats.enrollments?.active && stats.enrollments.active.length === 0 ? (
              <p className="text-sm text-gray-500">Нет активных продуктов</p>
            ) : (
              <div className="space-y-2">
                {stats.enrollments?.active?.map((enrollment: any) => (
                  <Card key={enrollment.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{enrollment.product_name}</p>
                        <p className="text-sm text-gray-500">
                          Тариф: {enrollment.tier_name || 'Не указан'}
                          {enrollment.cohort_name && ` • Поток: ${enrollment.cohort_name}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          Зачислен: {formatDate(enrollment.enrolled_at)}
                          {enrollment.expires_at && ` • Истекает: ${formatDate(enrollment.expires_at)}`}
                        </p>
                      </div>
                      <Badge variant="default">Активен</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {stats.enrollments?.expired && stats.enrollments.expired.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Истекшие продукты ({stats.enrollments.expired.length})
              </h3>
              <div className="space-y-2">
                {stats.enrollments.expired.map((enrollment: any) => (
                  <Card key={enrollment.id} className="p-4 opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{enrollment.product_name}</p>
                        <p className="text-sm text-gray-500">
                          Тариф: {enrollment.tier_name || 'Не указан'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Зачислен: {formatDate(enrollment.enrolled_at)}
                          {enrollment.expires_at && ` • Истек: ${formatDate(enrollment.expires_at)}`}
                        </p>
                      </div>
                      <Badge variant="secondary">Истек</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* История */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Заметки ({stats.activity?.notes?.length || 0})
            </h3>
            {stats.activity?.notes && stats.activity.notes.length === 0 ? (
              <p className="text-sm text-gray-500">Нет заметок</p>
            ) : (
              <div className="space-y-2">
                {stats.activity?.notes?.map((note: any) => (
                  <Card key={note.id} className="p-4">
                    <p className="font-medium">{note.title || 'Без названия'}</p>
                    <p className="text-sm text-gray-500 mt-1">{note.content?.substring(0, 100)}...</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Обновлено: {formatDate(note.updated_at)}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Избранное ({stats.activity?.favorites?.length || 0})
            </h3>
            {stats.activity?.favorites && stats.activity.favorites.length === 0 ? (
              <p className="text-sm text-gray-500">Нет избранного</p>
            ) : (
              <div className="space-y-2">
                {stats.activity?.favorites?.map((favorite: any) => (
                  <Card key={favorite.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{favorite.title}</p>
                        <p className="text-sm text-gray-500">{favorite.item_type}</p>
                      </div>
                      <Badge variant="outline">{favorite.item_type}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Комментарии ({stats.activity?.comments?.length || 0})
            </h3>
            {stats.activity?.comments && stats.activity.comments.length === 0 ? (
              <p className="text-sm text-gray-500">Нет комментариев</p>
            ) : (
              <div className="space-y-2">
                {stats.activity?.comments?.map((comment: any) => (
                  <Card key={comment.id} className="p-4">
                    <p className="font-medium">{comment.event_title || 'Без названия'}</p>
                    <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{formatDate(comment.created_at)}</span>
                      {comment.likes > 0 && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {comment.likes}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

