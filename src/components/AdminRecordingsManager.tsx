import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Plus, Pencil, Trash2, Video, Search, Eye } from "lucide-react";
import { AdminFormWrapper } from "./AdminFormWrapper";
import { AdminFormField } from "./AdminFormField";
import { AdminEmptyState } from "./AdminEmptyState";
import { apiClient } from "../api/client";
import { toast } from "sonner";

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

export function AdminRecordingsManager() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Recording | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [recordingForm, setRecordingForm] = useState({
    title: "",
    date: "",
    duration: "",
    instructor: "",
    thumbnail: "",
    views: 0,
    description: "",
    video_url: "",
    loom_embed_url: "",
  });

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getRecordings();
      setRecordings(data);
    } catch (error: any) {
      toast.error("Не удалось загрузить записи");
      console.error("Failed to load recordings:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRecordingForm({
      title: "",
      date: "",
      duration: "",
      instructor: "",
      thumbnail: "",
      views: 0,
      description: "",
      video_url: "",
      loom_embed_url: "",
    });
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleAdd = async () => {
    if (!recordingForm.title || !recordingForm.date || !recordingForm.instructor) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const newItem = await apiClient.createRecording(recordingForm);
      setRecordings([newItem, ...recordings]);
      resetForm();
      toast.success("Запись добавлена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить запись");
      console.error("Failed to create recording:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    if (!recordingForm.title || !recordingForm.date || !recordingForm.instructor) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const updated = await apiClient.updateRecording(editingItem.id, recordingForm);
      setRecordings(recordings.map((item) => (item.id === editingItem.id ? updated : item)));
      resetForm();
      toast.success("Запись обновлена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить запись");
      console.error("Failed to update recording:", error);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await apiClient.deleteRecording(deletingId);
      setRecordings(recordings.filter((item) => item.id !== deletingId));
      setDeletingId(null);
      toast.success("Запись удалена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить запись");
      console.error("Failed to delete recording:", error);
    }
  };

  const startEdit = (item: Recording) => {
    setEditingItem(item);
    setRecordingForm({
      title: item.title,
      date: item.date,
      duration: item.duration || "",
      instructor: item.instructor,
      thumbnail: item.thumbnail || "",
      views: item.views,
      description: item.description || "",
      video_url: item.video_url || "",
      loom_embed_url: item.loom_embed_url || "",
    });
    setIsAdding(false);
  };

  const filteredRecordings = recordings.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">Управление записями</h2>
          <p className="text-gray-500 mt-1">Добавляйте записи прошедших эфиров</p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          size="lg"
          className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Добавить запись
        </Button>
      </div>

      {recordings.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск записей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {filteredRecordings.length === 0 ? (
        <AdminEmptyState
          icon={<Video className="h-10 w-10 text-gray-400" />}
          title="Нет записей"
          description="Добавьте записи прошедших эфиров"
          actionLabel="Добавить запись"
          onAction={() => setIsAdding(true)}
        />
      ) : (
        <div className="grid gap-4">
          {filteredRecordings.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-32 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                    {item.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Инструктор: {item.instructor}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                      {item.duration && (
                        <>
                          <span>•</span>
                          <span>{item.duration}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {item.views}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingId(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAdding || !!editingItem} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Редактировать запись" : "Добавить запись"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Обновите информацию о записи" : "Заполните данные для новой записи"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <AdminFormField label="Название" required>
              <Input
                value={recordingForm.title}
                onChange={(e) => setRecordingForm({ ...recordingForm, title: e.target.value })}
                placeholder="Введите название записи"
              />
            </AdminFormField>
            <div className="grid grid-cols-2 gap-4">
              <AdminFormField label="Дата" required>
                <Input
                  value={recordingForm.date}
                  onChange={(e) => setRecordingForm({ ...recordingForm, date: e.target.value })}
                  placeholder="01.01.2025"
                />
              </AdminFormField>
              <AdminFormField label="Длительность">
                <Input
                  value={recordingForm.duration}
                  onChange={(e) => setRecordingForm({ ...recordingForm, duration: e.target.value })}
                  placeholder="1ч 30мин"
                />
              </AdminFormField>
            </div>
            <AdminFormField label="Инструктор" required>
              <Input
                value={recordingForm.instructor}
                onChange={(e) => setRecordingForm({ ...recordingForm, instructor: e.target.value })}
                placeholder="Имя инструктора"
              />
            </AdminFormField>
            <AdminFormField label="Описание">
              <Textarea
                value={recordingForm.description}
                onChange={(e) => setRecordingForm({ ...recordingForm, description: e.target.value })}
                placeholder="Описание записи"
                rows={4}
              />
            </AdminFormField>
            <AdminFormField label="Превью (URL)">
              <Input
                value={recordingForm.thumbnail}
                onChange={(e) => setRecordingForm({ ...recordingForm, thumbnail: e.target.value })}
                placeholder="https://..."
              />
            </AdminFormField>
            <AdminFormField label="Ссылка на видео">
              <Input
                value={recordingForm.video_url}
                onChange={(e) => setRecordingForm({ ...recordingForm, video_url: e.target.value })}
                placeholder="https://..."
              />
            </AdminFormField>
            <AdminFormField label="Loom видео (ссылка для встраивания)">
              <Input
                value={recordingForm.loom_embed_url}
                onChange={(e) => setRecordingForm({ ...recordingForm, loom_embed_url: e.target.value })}
                placeholder="https://www.loom.com/embed/... или https://www.loom.com/share/..."
              />
            </AdminFormField>
            <AdminFormField label="Просмотры">
              <Input
                type="number"
                value={recordingForm.views}
                onChange={(e) => setRecordingForm({ ...recordingForm, views: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </AdminFormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Отмена
            </Button>
            <Button
              onClick={editingItem ? handleUpdate : handleAdd}
              className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
            >
              {editingItem ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Запись будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
