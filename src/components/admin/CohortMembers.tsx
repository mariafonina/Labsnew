import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/api/client';
import { toast } from 'sonner';

interface CohortMember {
  id: number;
  user_id: number;
  username: string;
  email: string;
  joined_at: string;
}

interface CohortMembersProps {
  cohortId: number;
}

export function CohortMembers({ cohortId }: CohortMembersProps) {
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [cohortId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, usersData] = await Promise.all([
        apiClient.getCohortMembers(cohortId),
        apiClient.getUsers()
      ]);
      setMembers(membersData);
      setAllUsers(usersData);
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

    try {
      await apiClient.addCohortMembers(cohortId, selectedUserIds);
      toast.success(`Добавлено участников: ${selectedUserIds.length}`);
      setSelectedUserIds([]);
      setSearchQuery('');
      loadData();
    } catch (error) {
      console.error('Failed to add members:', error);
      toast.error('Не удалось добавить участников');
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
  const filteredUsers = availableUsers.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

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
        <div className="space-y-3">
          <div>
            <Label htmlFor="search">Поиск пользователей</Label>
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Имя или email"
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
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </label>
              ))
            )}
          </div>
          <Button
            onClick={handleAddMembers}
            disabled={selectedUserIds.length === 0}
            className="w-full"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Добавить выбранных ({selectedUserIds.length})
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
                <div>
                  <div className="font-medium">{member.username}</div>
                  <div className="text-xs text-muted-foreground">{member.email}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Добавлен: {new Date(member.joined_at).toLocaleDateString('ru-RU')}
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
