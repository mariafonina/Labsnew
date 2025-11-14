import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Plus, Pencil, Trash2, Newspaper, Search, Tag } from "lucide-react";
import { AdminFormWrapper } from "./AdminFormWrapper";
import { AdminFormField } from "./AdminFormField";
import { AdminEmptyState } from "./AdminEmptyState";
import { apiClient } from "../api/client";
import { toast } from "sonner";

interface NewsItem {
  id: number;
  title: string;
  content: string;
  author: string;
  author_avatar?: string;
  date: string;
  category: string;
  image?: string;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

export function AdminNewsManager() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [newsForm, setNewsForm] = useState({
    title: "",
    content: "",
    author: "",
    author_avatar: "",
    category: "",
    image: "",
    date: "Сегодня",
    is_new: true,
  });

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getNews();
      setNewsItems(data);
    } catch (error: any) {
      toast.error("Не удалось загрузить новости");
      console.error("Failed to load news:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewsForm({
      title: "",
      content: "",
      author: "",
      author_avatar: "",
      category: "",
      image: "",
      date: "Сегодня",
      is_new: true,
    });
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleAdd = async () => {
    if (!newsForm.title || !newsForm.content || !newsForm.author || !newsForm.category) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const newItem = await apiClient.createNews(newsForm);
      setNewsItems([newItem, ...newsItems]);
      resetForm();
      toast.success("Новость добавлена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить новость");
      console.error("Failed to create news:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    if (!newsForm.title || !newsForm.content || !newsForm.author || !newsForm.category) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const updated = await apiClient.updateNews(editingItem.id, newsForm);
      setNewsItems(newsItems.map((item) => (item.id === editingItem.id ? updated : item)));
      resetForm();
      toast.success("Новость обновлена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить новость");
      console.error("Failed to update news:", error);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await apiClient.deleteNews(deletingId);
      setNewsItems(newsItems.filter((item) => item.id !== deletingId));
      setDeletingId(null);
      toast.success("Новость удалена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить новость");
      console.error("Failed to delete news:", error);
    }
  };

  const startEdit = (item: NewsItem) => {
    setEditingItem(item);
    setNewsForm({
      title: item.title,
      content: item.content,
      author: item.author,
      author_avatar: item.author_avatar || "",
      category: item.category,
      image: item.image || "",
      date: item.date,
      is_new: item.is_new,
    });
    setIsAdding(false);
  };

  const categories = Array.from(new Set(newsItems.map((item) => item.category)));
  const filteredNews = newsItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
          <h2 className="text-3xl font-black">Управление новостями</h2>
          <p className="text-gray-500 mt-1">Создавайте и редактируйте новости</p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          size="lg"
          className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Добавить новость
        </Button>
      </div>

      {newsItems.length > 0 && (
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск новостей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              onClick={() => setCategoryFilter("all")}
            >
              Все
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? "default" : "outline"}
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}

      {filteredNews.length === 0 ? (
        <AdminEmptyState
          icon={<Newspaper className="h-10 w-10 text-gray-400" />}
          title="Нет новостей"
          description="Создайте первую новость для вашей платформы"
          actionLabel="Добавить новость"
          onAction={() => setIsAdding(true)}
        />
      ) : (
        <div className="grid gap-4">
          {filteredNews.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-xl">{item.title}</h3>
                    {item.is_new && (
                      <span className="px-2 py-1 bg-pink-100 text-pink-600 text-xs font-bold rounded">
                        НОВОЕ
                      </span>
                    )}
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {item.category}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3 line-clamp-2">{item.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Автор: {item.author}</span>
                    <span>•</span>
                    <span>{item.date}</span>
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
            <DialogTitle>{editingItem ? "Редактировать новость" : "Добавить новость"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Обновите информацию о новости" : "Заполните данные для новой новости"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <AdminFormField label="Заголовок" required>
              <Input
                value={newsForm.title}
                onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                placeholder="Введите заголовок"
              />
            </AdminFormField>
            <AdminFormField label="Содержание" required>
              <Textarea
                value={newsForm.content}
                onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                placeholder="Введите текст новости"
                rows={6}
              />
            </AdminFormField>
            <div className="grid grid-cols-2 gap-4">
              <AdminFormField label="Автор" required>
                <Input
                  value={newsForm.author}
                  onChange={(e) => setNewsForm({ ...newsForm, author: e.target.value })}
                  placeholder="Имя автора"
                />
              </AdminFormField>
              <AdminFormField label="Категория" required>
                <Input
                  value={newsForm.category}
                  onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                  placeholder="Категория"
                />
              </AdminFormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <AdminFormField label="Дата">
                <Input
                  value={newsForm.date}
                  onChange={(e) => setNewsForm({ ...newsForm, date: e.target.value })}
                  placeholder="Сегодня"
                />
              </AdminFormField>
              <AdminFormField label="Аватар автора">
                <Input
                  value={newsForm.author_avatar}
                  onChange={(e) => setNewsForm({ ...newsForm, author_avatar: e.target.value })}
                  placeholder="URL аватара"
                />
              </AdminFormField>
            </div>
            <AdminFormField label="Изображение">
              <Input
                value={newsForm.image}
                onChange={(e) => setNewsForm({ ...newsForm, image: e.target.value })}
                placeholder="URL изображения"
              />
            </AdminFormField>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_new"
                checked={newsForm.is_new}
                onChange={(e) => setNewsForm({ ...newsForm, is_new: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_new" className="text-sm font-medium">
                Отметить как новое
              </label>
            </div>
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
            <AlertDialogTitle>Удалить новость?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Новость будет удалена навсегда.
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
