import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Upload, X, Search } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface MultiSelectUsersProps {
  users: User[];
  selectedUserIds: number[];
  onChange: (userIds: number[]) => void;
  enableCsvUpload?: boolean;
  className?: string;
}

export const MultiSelectUsers: React.FC<MultiSelectUsersProps> = ({
  users,
  selectedUserIds,
  onChange,
  enableCsvUpload = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUserDisplayName = (user: User): string => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  const filteredUsers = users.filter((user) => {
    const displayName = getUserDisplayName(user).toLowerCase();
    const email = user.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return displayName.includes(query) || email.includes(query);
  });

  const handleToggleUser = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const handleToggleAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      onChange([]);
    } else {
      onChange(filteredUsers.map((u) => u.id));
    }
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    
    const emails = lines.map((line) => {
      const parts = line.split(',');
      return parts.find((part) => part.includes('@'))?.trim();
    }).filter(Boolean) as string[];

    const matchedUserIds = users
      .filter((user) => emails.includes(user.email))
      .map((user) => user.id);

    onChange([...new Set([...selectedUserIds, ...matchedUserIds])]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {enableCsvUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </>
        )}
        
        {selectedUserIds.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange([])}
          >
            <X className="h-4 w-4 mr-2" />
            Очистить ({selectedUserIds.length})
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 py-2 border-b">
        <Checkbox
          checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
          onCheckedChange={handleToggleAll}
        />
        <span className="text-sm font-medium">
          Выбрать всех ({filteredUsers.length})
        </span>
      </div>

      <ScrollArea className="h-[300px] border rounded-md p-4">
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
              onClick={() => handleToggleUser(user.id)}
            >
              <Checkbox checked={selectedUserIds.includes(user.id)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {getUserDisplayName(user)}
                  </span>
                  {user.role === 'admin' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      Админ
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
            </div>
          ))}
          
          {filteredUsers.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Пользователи не найдены
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
