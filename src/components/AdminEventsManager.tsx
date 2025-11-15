import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Plus, Pencil, Trash2, Calendar, Search, Clock, MapPin } from "lucide-react";
import { AdminFormWrapper } from "./AdminFormWrapper";
import { AdminFormField } from "./AdminFormField";
import { AdminEmptyState } from "./AdminEmptyState";
import { apiClient } from "../api/client";
import { toast } from "sonner";

interface Event {
  id: number;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export function AdminEventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<Event | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_date: new Date().toISOString().split('T')[0],
    event_time: "",
    location: "",
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getEvents();
      setEvents(data);
    } catch (error: any) {
      toast.error("Не удалось загрузить события");
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEventForm({
      title: "",
      description: "",
      event_date: new Date().toISOString().split('T')[0],
      event_time: "",
      location: "",
    });
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleAdd = async () => {
    if (!eventForm.title || !eventForm.event_date) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const newItem = await apiClient.createEvent(eventForm);
      setEvents([newItem, ...events]);
      resetForm();
      toast.success("Событие добавлено");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить событие");
      console.error("Failed to create event:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    if (!eventForm.title || !eventForm.event_date) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const updated = await apiClient.updateEvent(editingItem.id, eventForm);
      setEvents(events.map((item) => (item.id === editingItem.id ? updated : item)));
      resetForm();
      toast.success("Событие обновлено");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить событие");
      console.error("Failed to update event:", error);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await apiClient.deleteEvent(deletingId);
      setEvents(events.filter((item) => item.id !== deletingId));
      setDeletingId(null);
      toast.success("Событие удалено");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить событие");
      console.error("Failed to delete event:", error);
    }
  };

  const startEdit = (item: Event) => {
    setEditingItem(item);
    setEventForm({
      title: item.title,
      description: item.description || "",
      event_date: item.event_date,
      event_time: item.event_time || "",
      location: item.location || "",
    });
    setIsAdding(false);
  };

  const filteredEvents = events.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">Управление событиями</h2>
          <p className="text-gray-500 mt-2">Создавайте и редактируйте события календаря</p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          size="lg"
          className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Добавить событие
        </Button>
      </div>

      {events.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск событий..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <AdminEmptyState
          icon={<Calendar className="h-10 w-10 text-gray-400" />}
          title="Нет событий"
          description="Добавьте события в календарь"
          actionLabel="Добавить событие"
          onAction={() => setIsAdding(true)}
        />
      ) : (
        <div className="grid gap-6">
          {filteredEvents.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-4">{item.title}</h3>
                  {item.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.event_date)}
                    </span>
                    {item.event_time && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.event_time}
                        </span>
                      </>
                    )}
                    {item.location && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 ml-6">
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
            <DialogTitle>{editingItem ? "Редактировать событие" : "Добавить событие"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Обновите информацию о событии" : "Заполните данные для нового события"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <AdminFormField label="Название" required>
              <Input
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Введите название события"
              />
            </AdminFormField>
            <AdminFormField label="Описание">
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Опишите событие"
                rows={4}
              />
            </AdminFormField>
            <div className="grid grid-cols-2 gap-6">
              <AdminFormField label="Дата" required>
                <Input
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                />
              </AdminFormField>
              <AdminFormField label="Время">
                <Input
                  type="time"
                  value={eventForm.event_time}
                  onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                />
              </AdminFormField>
            </div>
            <AdminFormField label="Место проведения">
              <Input
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="Место проведения"
              />
            </AdminFormField>
          </div>
          <DialogFooter className="gap-3">
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
            <AlertDialogTitle>Удалить событие?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Событие будет удалено навсегда.
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
