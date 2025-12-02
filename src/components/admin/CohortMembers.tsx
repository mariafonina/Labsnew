import { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Upload, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

interface CohortMember {
  id: number;
  user_id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  joined_at: string;
  tier_name?: string;
  actual_amount?: number;
  tier_price?: number;
}

interface PricingTier {
  id: number;
  name: string;
  price: number;
  tier_level: number;
}

interface CohortMembersProps {
  cohortId: number;
  productId: number;
}

export function CohortMembers({ cohortId, productId }: CohortMembersProps) {
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [actualAmount, setActualAmount] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [cohortId, productId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, usersResponse, tiersData] = await Promise.all([
        apiClient.getCohortMembers(cohortId),
        apiClient.getUsers(),
        apiClient.getPricingTiers(cohortId)
      ]);
      setMembers(membersData);
      setAllUsers(usersResponse.data || []);
      setTiers(tiersData || []);
      
      if (tiersData && tiersData.length > 0 && !selectedTierId) {
        setSelectedTierId(tiersData[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('Выберите пользователей для добавления');
      return;
    }

    if (!selectedTierId) {
      toast.error('Выберите тариф');
      return;
    }

    try {
      const parsedAmount = actualAmount ? parseFloat(actualAmount) : null;
      
      for (const userId of selectedUserIds) {
        await apiClient.addCohortMemberWithTier(cohortId, {
          user_id: userId,
          pricing_tier_id: parseInt(selectedTierId),
          actual_amount: parsedAmount
        });
      }
      
      toast.success(`Добавлено участников: ${selectedUserIds.length}`);
      setSelectedUserIds([]);
      setSearchQuery('');
      setActualAmount('');
      loadData();
    } catch (error: any) {
      console.error('Failed to add members:', error);
      toast.error(error.response?.data?.error || 'Не удалось добавить участников');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить участника из потока?')) return;

    try {
      await apiClient.removeCohortMembers(cohortId, [userId]);
      toast.success('Участник удален из потока');
      loadData();
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Не удалось удалить участника');
    }
  };

  const memberUserIds = new Set(members.map(m => m.user_id));
  const availableUsers = allUsers.filter(u => !memberUserIds.has(u.id));
  const filteredUsers = availableUsers.filter(u => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(searchLower)) ||
      (u.email && u.email.toLowerCase().includes(searchLower)) ||
      (u.first_name && u.first_name.toLowerCase().includes(searchLower)) ||
      (u.last_name && u.last_name.toLowerCase().includes(searchLower))
    );
  });

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xls|xlsx)$/i)) {
      toast.error('Неподдерживаемый формат файла. Используйте CSV или XLS/XLSX');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/admin/cohorts/${cohortId}/members/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки файла');
      }

      toast.success(`Добавлено участников: ${data.added}${data.notFound ? `. Не найдено: ${data.notFound.length}` : ''}`);
      if (data.notFound && data.notFound.length > 0) {
        console.warn('Не найдены пользователи:', data.notFound);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadData();
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      toast.error(error.message || 'Не удалось загрузить файл');
    } finally {
      setUploading(false);
    }
  };

  const selectedTier = tiers.find(t => t.id.toString() === selectedTierId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3">Добавить участников</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Загрузить из файла (CSV/XLS)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xls,.xlsx"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Загрузка...' : 'Выбрать файл'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Файл должен содержать колонку с email или username
            </p>
          </div>

          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Тариф *</Label>
                <Select value={selectedTierId} onValueChange={setSelectedTierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тариф" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id.toString()}>
                        {tier.name} ({tier.price?.toLocaleString('ru-RU')} ₽)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tiers.length === 0 && (
                  <p className="text-xs text-destructive mt-1">
                    Сначала создайте тарифы для этого потока
                  </p>
                )}
              </div>

              <div>
                <Label>Фактическая сумма оплаты</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={selectedTier ? `${selectedTier.price} ₽ (цена тарифа)` : 'Введите сумму'}
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Оставьте пустым для цены тарифа
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="search">Поиск пользователей</Label>
              {filteredUsers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="h-8"
                >
                  {selectedUserIds.length === filteredUsers.length ? (
                    <>
                      <CheckSquare className="w-4 h-4 mr-1" />
                      Снять все
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 mr-1" />
                      Выбрать всех ({filteredUsers.length})
                    </>
                  )}
                </Button>
              )}
            </div>
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Имя, фамилия или email"
            />
          </div>
          <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchQuery ? 'Пользователи не найдены' : 'Все пользователи уже добавлены'}
              </p>
            ) : (
              filteredUsers.map(user => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {user.first_name || user.last_name 
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : user.username}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </label>
              ))
            )}
          </div>
          <Button
            onClick={handleAddMembers}
            disabled={selectedUserIds.length === 0 || !selectedTierId}
            className="w-full"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Добавить выбранных ({selectedUserIds.length})
            {actualAmount && ` — ${parseFloat(actualAmount).toLocaleString('ru-RU')} ₽ каждый`}
          </Button>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">
          Текущие участники ({members.length})
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Участники еще не добавлены
            </p>
          ) : (
            members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {member.first_name || member.last_name 
                      ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                      : member.username}
                  </div>
                  <div className="text-xs text-muted-foreground">{member.email}</div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                    <span>Добавлен: {new Date(member.joined_at).toLocaleDateString('ru-RU')}</span>
                    {member.tier_name && (
                      <span>Тариф: {member.tier_name}</span>
                    )}
                    {(member.actual_amount !== null && member.actual_amount !== undefined) ? (
                      <span className="text-green-600 font-medium">
                        Оплата: {Number(member.actual_amount).toLocaleString('ru-RU')} ₽
                      </span>
                    ) : member.tier_price !== null && member.tier_price !== undefined ? (
                      <span>Оплата: {Number(member.tier_price).toLocaleString('ru-RU')} ₽ (тариф)</span>
                    ) : null}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.user_id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
