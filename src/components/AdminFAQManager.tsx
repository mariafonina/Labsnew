import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Plus, Pencil, Trash2, HelpCircle, Search, ThumbsUp } from "lucide-react";
import { AdminFormWrapper } from "./AdminFormWrapper";
import { AdminFormField } from "./AdminFormField";
import { AdminEmptyState } from "./AdminEmptyState";
import { apiClient } from "../api/client";
import { toast } from "sonner";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  created_at: string;
  updated_at: string;
}

export function AdminFAQManager() {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    category: "",
    helpful: 0,
  });

  useEffect(() => {
    loadFAQ();
  }, []);

  const loadFAQ = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getFAQ();
      setFaqItems(data);
    } catch (error: any) {
      toast.error("Не удалось загрузить FAQ");
      console.error("Failed to load FAQ:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFaqForm({
      question: "",
      answer: "",
      category: "",
      helpful: 0,
    });
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleAdd = async () => {
    if (!faqForm.question || !faqForm.answer || !faqForm.category) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const newItem = await apiClient.createFAQ(faqForm);
      setFaqItems([...faqItems, newItem]);
      resetForm();
      toast.success("Вопрос добавлен в FAQ");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить вопрос");
      console.error("Failed to create FAQ:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    if (!faqForm.question || !faqForm.answer || !faqForm.category) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const updated = await apiClient.updateFAQ(editingItem.id, faqForm);
      setFaqItems(faqItems.map((item) => (item.id === editingItem.id ? updated : item)));
      resetForm();
      toast.success("Вопрос обновлён");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить вопрос");
      console.error("Failed to update FAQ:", error);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await apiClient.deleteFAQ(deletingId);
      setFaqItems(faqItems.filter((item) => item.id !== deletingId));
      setDeletingId(null);
      toast.success("Вопрос удалён");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить вопрос");
      console.error("Failed to delete FAQ:", error);
    }
  };

  const startEdit = (item: FAQItem) => {
    setEditingItem(item);
    setFaqForm({
      question: item.question,
      answer: item.answer,
      category: item.category,
      helpful: item.helpful,
    });
    setIsAdding(false);
  };

  const categories = Array.from(new Set(faqItems.map((item) => item.category)));
  const filteredFAQ = faqItems.filter((item) => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">Управление FAQ</h2>
          <p className="text-gray-500 mt-2">Добавляйте часто задаваемые вопросы</p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          size="lg"
          className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Добавить вопрос
        </Button>
      </div>

      {faqItems.length > 0 && (
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск по FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
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

      {filteredFAQ.length === 0 ? (
        <AdminEmptyState
          icon={<HelpCircle className="h-10 w-10 text-gray-400" />}
          title="Нет вопросов в FAQ"
          description="Добавьте часто задаваемые вопросы и ответы"
          actionLabel="Добавить вопрос"
          onAction={() => setIsAdding(true)}
        />
      ) : (
        <div className="grid gap-6">
          {filteredFAQ.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      {item.category}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {item.helpful}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-3">{item.question}</h3>
                  <p className="text-gray-600 line-clamp-3">{item.answer}</p>
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
            <DialogTitle>{editingItem ? "Редактировать вопрос" : "Добавить вопрос"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Обновите информацию о вопросе" : "Заполните данные для нового вопроса"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <AdminFormField label="Категория" required>
              <Input
                value={faqForm.category}
                onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                placeholder="Введите категорию"
              />
            </AdminFormField>
            <AdminFormField label="Вопрос" required>
              <Textarea
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                placeholder="Введите вопрос"
                rows={3}
              />
            </AdminFormField>
            <AdminFormField label="Ответ" required>
              <Textarea
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                placeholder="Введите ответ"
                rows={6}
              />
            </AdminFormField>
            <AdminFormField label="Полезность">
              <Input
                type="number"
                value={faqForm.helpful}
                onChange={(e) => setFaqForm({ ...faqForm, helpful: parseInt(e.target.value) || 0 })}
                placeholder="0"
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
            <AlertDialogTitle>Удалить вопрос?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Вопрос будет удалён навсегда.
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
