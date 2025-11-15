import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, Mail, Package, Users as UsersIcon } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface Enrollment {
  id: number;
  product_id: number;
  product_name: string;
  pricing_tier_id?: number;
  tier_name?: string;
  tier_level?: number;
  cohort_id?: number;
  cohort_name?: string;
  status: string;
  enrolled_at: string;
  expires_at?: string;
}

interface UserDetail {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  created_at: string;
  enrollments?: Enrollment[];
}

interface UserDetailCardProps {
  user: UserDetail;
  onClose: () => void;
  className?: string;
}

export const UserDetailCard: React.FC<UserDetailCardProps> = ({ user, onClose, className = '' }) => {
  const fullName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user.username;

  const activeEnrollments = user.enrollments?.filter((e) => e.status === 'active') || [];
  const expiredEnrollments = user.enrollments?.filter((e) => e.status !== 'active') || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{fullName}</h3>
            <div className="flex items-center gap-2 mt-1">
              {user.role === 'admin' && (
                <Badge variant="default" className="text-xs">Администратор</Badge>
              )}
              <span className="text-sm text-gray-500">@{user.username}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{user.email}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            Зарегистрирован: {formatDate(user.created_at)}
          </span>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" />
          Активные программы ({activeEnrollments.length})
        </h4>
        
        {activeEnrollments.length === 0 ? (
          <p className="text-sm text-gray-500">Нет активных программ</p>
        ) : (
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-3">
              {activeEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-sm">{enrollment.product_name}</div>
                  {enrollment.tier_name && (
                    <div className="text-xs text-gray-600 mt-1">
                      Тариф: {enrollment.tier_name} (Уровень {enrollment.tier_level})
                    </div>
                  )}
                  {enrollment.cohort_name && (
                    <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <UsersIcon className="h-3 w-3" />
                      {enrollment.cohort_name}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Зачислен: {formatDate(enrollment.enrolled_at)}
                  </div>
                  {enrollment.expires_at && (
                    <div className="text-xs text-gray-500">
                      Истекает: {formatDate(enrollment.expires_at)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {expiredEnrollments.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-semibold text-sm mb-3 text-gray-600">
            История ({expiredEnrollments.length})
          </h4>
          
          <ScrollArea className="max-h-[150px]">
            <div className="space-y-2">
              {expiredEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="font-medium text-gray-700">{enrollment.product_name}</div>
                  <div className="text-gray-500">
                    Статус: {enrollment.status === 'expired' ? 'Истек' : enrollment.status}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
};
