import { useState, useEffect } from 'react';
import { ArrowLeft, Video, Eye, Calendar, Clock, User, Edit2, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { apiClient } from '../api/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { LoomEmbed } from './LoomEmbed';

interface AdminStreamDetailProps {
  streamId: number;
  onBack: () => void;
}

interface Recording {
  id: number;
  title: string;
  date: string;
  duration?: string;
  instructor: string;
  thumbnail?: string;
  views: number;
  description?: string;
  video_url?: string;
  loom_embed_url?: string;
  created_at: string;
  updated_at: string;
}

export function AdminStreamDetail({ streamId, onBack }: AdminStreamDetailProps) {
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewStats, setViewStats] = useState<any>(null);

  useEffect(() => {
    loadRecording();
    loadViewStats();
  }, [streamId]);

  const loadRecording = async () => {
    try {
      setLoading(true);
      const recordings = await apiClient.getRecordings();
      const found = recordings.find((r: Recording) => r.id === streamId);
      if (found) {
        setRecording(found);
      } else {
        toast.error('Запись не найдена');
        onBack();
      }
    } catch (error) {
      console.error('Failed to load recording:', error);
      toast.error('Не удалось загрузить запись');
    } finally {
      setLoading(false);
    }
  };

  const loadViewStats = async () => {
    try {
      // TODO: Add API endpoint for recording view statistics
      // For now, we'll use a placeholder
      setViewStats({
        total_views: recording?.views || 0,
        unique_viewers: 0,
        recent_views: [],
      });
    } catch (error) {
      console.error('Failed to load view stats:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка данных записи...</p>
        </div>
      </div>
    );
  }

  if (!recording) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Запись не найдена</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
      </div>
    );
  }

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
            <h1 className="font-black text-4xl mb-2">{recording.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {recording.instructor}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(recording.date)}
              </div>
              {recording.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {recording.duration}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {recording.views} просмотров
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video/Embed */}
      {recording.loom_embed_url && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Видео</h2>
          <LoomEmbed url={recording.loom_embed_url} />
        </Card>
      )}

      {recording.video_url && !recording.loom_embed_url && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Видео</h2>
          <div className="aspect-video">
            <video
              src={recording.video_url}
              controls
              className="w-full h-full rounded-lg"
            />
          </div>
        </Card>
      )}

      {/* Thumbnail */}
      {recording.thumbnail && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Превью</h2>
          <img
            src={recording.thumbnail}
            alt={recording.title}
            className="w-full max-w-2xl rounded-lg"
          />
        </Card>
      )}

      {/* Description */}
      {recording.description && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Описание</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{recording.description}</p>
        </Card>
      )}

      {/* Statistics */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Статистика просмотров</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-pink-500" />
              <h3 className="font-semibold">Всего просмотров</h3>
            </div>
            <p className="text-3xl font-bold">{recording.views}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Уникальных зрителей</h3>
            </div>
            <p className="text-3xl font-bold">{viewStats?.unique_viewers || 0}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">Дата создания</h3>
            </div>
            <p className="text-lg font-semibold">{formatDate(recording.created_at)}</p>
          </div>
        </div>

        {viewStats?.recent_views && viewStats.recent_views.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Последние просмотры</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Дата просмотра</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewStats.recent_views.map((view: any) => (
                    <TableRow key={view.id}>
                      <TableCell className="font-medium">
                        {view.username || `Пользователь #${view.user_id}`}
                      </TableCell>
                      <TableCell>{formatDate(view.viewed_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>

      {/* Metadata */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Метаданные</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ID записи</p>
            <p className="font-semibold">{recording.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Создано</p>
            <p className="font-semibold">{formatDate(recording.created_at)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Обновлено</p>
            <p className="font-semibold">{formatDate(recording.updated_at)}</p>
          </div>
          {recording.video_url && (
            <div>
              <p className="text-sm text-gray-500">URL видео</p>
              <a
                href={recording.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:underline"
              >
                Открыть
              </a>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

