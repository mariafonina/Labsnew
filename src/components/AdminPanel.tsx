import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  LogOut,
  Newspaper,
  Calendar,
  BookOpen,
  Video,
  HelpCircle,
  MessageCircle,
  Users,
} from "lucide-react";
import { Logo } from "./Logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";
import type { NewsItem, Event, Instruction, Recording, FAQItem } from "../contexts/AppContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminQuestions } from "./AdminQuestions";
import { AdminInstructionsManager } from "./AdminInstructionsManager";
import { AdminUsers } from "./AdminUsers";

// Функция для получения читаемой даты для новостей
const getReadableDate = () => {
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleString('ru-RU', { month: 'long' });
  const year = today.getFullYear();
  
  return `${day} ${month} ${year}`;
};

// Функция для получения даты в формате YYYY-MM-DD
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export function AdminPanel() {
  const {
    auth,
    newsItems,
    events,
    instructions,
    instructionCategories,
    recordings,
    faqItems,
    addNewsItem,
    updateNewsItem,
    deleteNewsItem,
    addEvent,
    updateEvent,
    deleteEvent,
    addInstruction,
    updateInstruction,
    deleteInstruction,
    addInstructionCategory,
    updateInstructionCategory,
    deleteInstructionCategory,
    addRecording,
    updateRecording,
    deleteRecording,
    addFAQItem,
    updateFAQItem,
    deleteFAQItem,
    logout,
  } = useApp();

  const [activeSection, setActiveSection] = useState("news");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; type: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [eventFilter, setEventFilter] = useState<"all" | "upcoming" | "past">("all");

  // News form state
  const [newsForm, setNewsForm] = useState({
    title: "",
    content: "",
    author: "",
    category: "",
    image: "",
    date: "Сегодня",
    isNew: true,
  });

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: getTodayDate(),
    time: "",
    duration: "",
    instructor: "",
    type: "upcoming" as "upcoming" | "past",
    link: "",
  });

  // Instruction form state
  const [instructionForm, setInstructionForm] = useState({
    title: "",
    categoryId: "",
    description: "",
    content: "",
    downloadUrl: "",
    updatedAt: new Date().toISOString().split("T")[0],
  });

  // Instruction Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  // Recording form state
  const [recordingForm, setRecordingForm] = useState({
    title: "",
    date: "",
    duration: "",
    instructor: "",
    thumbnail: "",
    description: "",
    videoUrl: "",
    views: 0,
  });

  // FAQ form state
  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    category: "",
    helpful: 0,
  });

  if (!auth.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md text-center">
          <h2 className="font-black text-2xl mb-4">Доступ запрещён</h2>
          <p className="text-gray-600">
            У вас нет прав для доступа к административной панели.
          </p>
        </Card>
      </div>
    );
  }

  const handleAddNews = () => {
    if (!newsForm.title || !newsForm.content || !newsForm.author) {
      toast.error("Заполните обязательные поля");
      return;
    }
    // Автоматически подставляем текущую дату
    addNewsItem({
      ...newsForm,
      date: getReadableDate(),
    });
    setNewsForm({
      title: "",
      content: "",
      author: "",
      category: "",
      image: "",
      date: "Сегодня",
      isNew: true,
    });
    setIsAdding(false);
    toast.success("Новость добавлена");
  };

  const handleUpdateNews = () => {
    if (editingItem) {
      updateNewsItem(editingItem.id, newsForm);
      setEditingItem(null);
      setNewsForm({
        title: "",
        content: "",
        author: "",
        category: "",
        image: "",
        date: "Сегодня",
        isNew: true,
      });
      toast.success("Новость обновлена");
    }
  };

  const handleAddEvent = () => {
    if (!eventForm.title || !eventForm.time) {
      toast.error("Заполните обязательные поля");
      return;
    }
    // Автоматически подставляем дату, если не указана
    addEvent({
      ...eventForm,
      date: eventForm.date || getTodayDate(),
    });
    setEventForm({
      title: "",
      description: "",
      date: getTodayDate(),
      time: "",
      duration: "",
      instructor: "",
      type: "upcoming",
      link: "",
    });
    setIsAdding(false);
    toast.success("Событие добавлено");
  };

  const handleUpdateEvent = () => {
    if (editingItem) {
      updateEvent(editingItem.id, eventForm);
      setEditingItem(null);
      setEventForm({
        title: "",
        description: "",
        date: getTodayDate(),
        time: "",
        duration: "",
        instructor: "",
        type: "upcoming",
        link: "",
      });
      toast.success("Событие обновлено");
    }
  };

  const handleAddInstruction = () => {
    if (!instructionForm.title || !instructionForm.categoryId) {
      toast.error("Заполните обязательные поля");
      return;
    }
    addInstruction(instructionForm);
    setInstructionForm({
      title: "",
      categoryId: "",
      description: "",
      content: "",
      downloadUrl: "",
      updatedAt: new Date().toISOString().split("T")[0],
    });
    setIsAdding(false);
    toast.success("Инструкция добавлена");
  };

  const handleUpdateInstruction = () => {
    if (editingItem) {
      updateInstruction(editingItem.id, instructionForm);
      setEditingItem(null);
      setInstructionForm({
        title: "",
        categoryId: "",
        description: "",
        content: "",
        downloadUrl: "",
        updatedAt: new Date().toISOString().split("T")[0],
      });
      toast.success("Инструкция обновлена");
    }
  };

  const handleAddCategory = () => {
    if (!categoryForm.name) {
      toast.error("Введите название категории");
      return;
    }
    addInstructionCategory(categoryForm);
    setCategoryForm({
      name: "",
      description: "",
    });
    setIsAdding(false);
    toast.success("Категория добавлена");
  };

  const handleUpdateCategory = () => {
    if (editingItem) {
      updateInstructionCategory(editingItem.id, categoryForm);
      setEditingItem(null);
      setCategoryForm({
        name: "",
        description: "",
      });
      toast.success("Категория обновлена");
    }
  };

  const handleAddRecording = () => {
    if (!recordingForm.title || !recordingForm.date) {
      toast.error("Заполните обязательные поля");
      return;
    }
    addRecording(recordingForm);
    setRecordingForm({
      title: "",
      date: "",
      duration: "",
      instructor: "",
      thumbnail: "",
      description: "",
      videoUrl: "",
      views: 0,
    });
    setIsAdding(false);
    toast.success("Запись добавлена");
  };

  const handleUpdateRecording = () => {
    if (editingItem) {
      updateRecording(editingItem.id, recordingForm);
      setEditingItem(null);
      setRecordingForm({
        title: "",
        date: "",
        duration: "",
        instructor: "",
        thumbnail: "",
        description: "",
        videoUrl: "",
        views: 0,
      });
      toast.success("Запись обновлена");
    }
  };

  const handleAddFAQ = () => {
    if (!faqForm.question || !faqForm.answer) {
      toast.error("Заполните обязательные поля");
      return;
    }
    addFAQItem(faqForm);
    setFaqForm({
      question: "",
      answer: "",
      category: "",
      helpful: 0,
    });
    setIsAdding(false);
    toast.success("Вопрос добавлен");
  };

  const handleUpdateFAQ = () => {
    if (editingItem) {
      updateFAQItem(editingItem.id, faqForm);
      setEditingItem(null);
      setFaqForm({
        question: "",
        answer: "",
        category: "",
        helpful: 0,
      });
      toast.success("Вопрос обновлён");
    }
  };

  const handleDelete = () => {
    if (!deletingItem) return;

    switch (deletingItem.type) {
      case "news":
        deleteNewsItem(deletingItem.id);
        break;
      case "event":
        deleteEvent(deletingItem.id);
        break;
      case "instruction":
        deleteInstruction(deletingItem.id);
        break;
      case "category":
        deleteInstructionCategory(deletingItem.id);
        break;
      case "recording":
        deleteRecording(deletingItem.id);
        break;
      case "faq":
        deleteFAQItem(deletingItem.id);
        break;
    }

    setDeletingItem(null);
    toast.success("Удалено успешно");
  };

  const startEdit = (item: any, type: string) => {
    setEditingItem({ ...item, type });
    setIsAdding(false);

    switch (type) {
      case "news":
        setNewsForm({
          title: item.title || "",
          content: item.content || "",
          author: item.author || "",
          category: item.category || "",
          image: item.image || "",
          date: item.date || "Сегодня",
          isNew: item.isNew ?? true,
        });
        break;
      case "event":
        setEventForm({
          title: item.title || "",
          description: item.description || "",
          date: item.date || "",
          time: item.time || "",
          duration: item.duration || "",
          instructor: item.instructor || "",
          type: item.type || "upcoming",
          link: item.link || "",
        });
        break;
      case "instruction":
        setInstructionForm({
          title: item.title || "",
          categoryId: item.categoryId || "",
          description: item.description || "",
          content: item.content || "",
          downloadUrl: item.downloadUrl || "",
          updatedAt: item.updatedAt || new Date().toISOString().split("T")[0],
        });
        break;
      case "category":
        setCategoryForm({
          name: item.name || "",
          description: item.description || "",
        });
        break;
      case "recording":
        setRecordingForm({
          title: item.title || "",
          date: item.date || "",
          duration: item.duration || "",
          instructor: item.instructor || "",
          thumbnail: item.thumbnail || "",
          description: item.description || "",
          videoUrl: item.videoUrl || "",
          views: item.views || 0,
        });
        break;
      case "faq":
        setFaqForm({
          question: item.question || "",
          answer: item.answer || "",
          category: item.category || "",
          helpful: item.helpful || 0,
        });
        break;
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setIsAdding(false);
    setNewsForm({
      title: "",
      content: "",
      author: "",
      category: "",
      image: "",
      date: "Сегодня",
      isNew: true,
    });
    setEventForm({
      title: "",
      description: "",
      date: getTodayDate(),
      time: "",
      duration: "",
      instructor: "",
      type: "upcoming",
      link: "",
    });
    setInstructionForm({
      title: "",
      categoryId: "",
      description: "",
      content: "",
      downloadUrl: "",
      updatedAt: new Date().toISOString().split("T")[0],
    });
    setCategoryForm({
      name: "",
      description: "",
    });
    setRecordingForm({
      title: "",
      date: "",
      duration: "",
      instructor: "",
      thumbnail: "",
      description: "",
      videoUrl: "",
    });
    setFaqForm({
      question: "",
      answer: "",
      category: "",
    });
  };

  const { comments } = useApp();
  
  // Подсчёт непрочитанных вопросов от пользователей
  const userQuestionsCount = comments.filter(
    (c) => !c.parentId && c.authorRole === "user"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={(section) => {
            setActiveSection(section);
            cancelEdit();
          }}
          onLogout={logout}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/60 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <Logo size="md" onClick={() => {
            setActiveSection("news");
            cancelEdit();
          }} />
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-10 px-8 lg:px-12 overflow-y-auto bg-gray-50 lg:mt-0 mt-16 pb-32 lg:pb-10">
        <div className="max-w-6xl mx-auto">
          {activeSection === "questions" ? (
            <AdminQuestions />
          ) : activeSection === "users" ? (
            <AdminUsers />
          ) : (
            <>
              {/* NEWS MANAGEMENT */}
              {activeSection === "news" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h1 className="font-black text-3xl lg:text-5xl mb-2">Новости</h1>
                      <p className="text-gray-500 text-sm lg:text-lg">
                        Управление новостной лентой • {newsItems.length} {newsItems.length === 1 ? 'новость' : 'новостей'}
                      </p>
                    </div>
                    {!isAdding && !editingItem && (
                      <Button
                        onClick={() => setIsAdding(true)}
                        size="lg"
                        className="hidden lg:flex bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 shadow-lg hover:shadow-xl transition-all"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Добавить новость
                      </Button>
                    )}
                  </div>

                  {(isAdding || (editingItem && editingItem.type === "news")) && (
                    <Card className="p-4 lg:p-8 shadow-lg border-2">
                      <div className="mb-4 lg:mb-6 pb-4 lg:pb-6 border-b border-gray-200">
                        <h3 className="font-black text-2xl lg:text-3xl">
                          {editingItem ? "Редактировать новость" : "Новая новость"}
                        </h3>
                        <p className="text-gray-500 mt-2 text-sm lg:text-base">
                          {editingItem 
                            ? "Заполните все обязательные поля отмеченные звёздочкой *"
                            : "Дата публикации будет установлена автоматически. Обязательные поля отмечены звёздочкой *"
                          }
                        </p>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <Label className="text-base mb-2 block">Заголовок *</Label>
                          <Input
                            value={newsForm.title}
                            onChange={(e) =>
                              setNewsForm({ ...newsForm, title: e.target.value })
                            }
                            placeholder="Введите заголовок новости"
                            className="h-12 text-base"
                          />
                        </div>
                        <div>
                          <Label className="text-base mb-2 block">Содержание *</Label>
                          <Textarea
                            value={newsForm.content}
                            onChange={(e) =>
                              setNewsForm({ ...newsForm, content: e.target.value })
                            }
                            placeholder="Введите текст новости"
                            rows={12}
                            className="text-base min-h-[300px]"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-base mb-2 block">Автор *</Label>
                            <Input
                              value={newsForm.author}
                              onChange={(e) =>
                                setNewsForm({ ...newsForm, author: e.target.value })
                              }
                              placeholder="Имя автора"
                              className="h-12 text-base"
                            />
                          </div>
                          <div>
                            <Label className="text-base mb-2 block">Категория</Label>
                            <Input
                              value={newsForm.category}
                              onChange={(e) =>
                                setNewsForm({ ...newsForm, category: e.target.value })
                              }
                              placeholder="Категория новости"
                              className="h-12 text-base"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-base mb-2 block">URL изображения</Label>
                          <Input
                            value={newsForm.image}
                            onChange={(e) =>
                              setNewsForm({ ...newsForm, image: e.target.value })
                            }
                            placeholder="https://example.com/image.jpg"
                            className="h-12 text-base"
                          />
                          {!editingItem && (
                            <p className="text-sm text-gray-500 mt-2">
                              📅 Дата публикации будет установлена автоматически: {getReadableDate()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col lg:flex-row gap-3 pt-4">
                          <Button
                            onClick={editingItem ? handleUpdateNews : handleAddNews}
                            size="lg"
                            className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 lg:px-8 shadow-md w-full lg:w-auto"
                          >
                            <Save className="h-5 w-5 mr-2" />
                            {editingItem ? "Сохранить изменения" : "Добавить новость"}
                          </Button>
                          <Button onClick={cancelEdit} variant="outline" size="lg" className="lg:px-8 w-full lg:w-auto">
                            <X className="h-5 w-5 mr-2" />
                            Отмена
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="space-y-4">
                    {newsItems.length === 0 ? (
                      <Card className="p-8 lg:p-12 text-center border-2 border-dashed border-gray-300">
                        <div className="max-w-sm mx-auto">
                          <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Plus className="h-8 w-8 lg:h-10 lg:w-10 text-gray-400" />
                          </div>
                          <h3 className="font-black text-xl lg:text-2xl text-gray-900 mb-2">
                            Нет новостей
                          </h3>
                          <p className="text-gray-500 mb-6 text-sm lg:text-base">
                            Начните с создания первой новости для вашего курса
                          </p>
                          <Button
                            onClick={() => setIsAdding(true)}
                            size="lg"
                            className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Создать новость
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      newsItems.map((item) => (
                        <Card key={item.id} className="p-4 lg:p-6 hover:shadow-md transition-shadow border">
                          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-6">
                            <div className="flex-1 min-w-0 w-full lg:w-auto">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="font-black text-lg lg:text-xl truncate">{item.title}</h3>
                                {item.isNew && (
                                  <Badge className="bg-gradient-to-r from-pink-400 to-rose-400 text-white shrink-0">Новое</Badge>
                                )}
                              </div>
                              <p className="text-gray-700 mb-4 text-sm lg:text-base">{item.content}</p>
                              <div className="flex flex-wrap gap-2 lg:gap-3 text-xs lg:text-sm text-gray-500">
                                <span className="font-medium">{item.author}</span>
                                <span>•</span>
                                <span>{item.date}</span>
                                {item.category && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0 w-full lg:w-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(item, "news")}
                                className="hover:bg-gray-100 flex-1 lg:flex-none"
                              >
                                <Edit2 className="h-4 w-4 lg:mr-2" />
                                <span className="hidden lg:inline">Изменить</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setDeletingItem({ id: item.id, type: "news" })
                                }
                                className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* EVENTS MANAGEMENT */}
              {activeSection === "events" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h1 className="font-black text-3xl lg:text-5xl mb-2">События</h1>
                      <p className="text-gray-500 text-sm lg:text-lg">
                        Управление календарём эфиров • {events.length} {events.length === 1 ? 'событие' : 'событий'}
                      </p>
                    </div>
                    {!isAdding && !editingItem && (
                      <Button
                        onClick={() => setIsAdding(true)}
                        size="lg"
                        className="hidden lg:flex bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 shadow-lg hover:shadow-xl transition-all"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Добавить событие
                      </Button>
                    )}
                  </div>

                  {/* Фильтрация событий */}
                  {!isAdding && !editingItem && events.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                      <span className="text-sm font-semibold text-gray-600">Фильтр:</span>
                      <Button
                        onClick={() => setEventFilter("all")}
                        variant={eventFilter === "all" ? "default" : "outline"}
                        size="sm"
                        className={eventFilter === "all" 
                          ? "bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white shadow-md" 
                          : ""}
                      >
                        Все ({events.length})
                      </Button>
                      <Button
                        onClick={() => setEventFilter("upcoming")}
                        variant={eventFilter === "upcoming" ? "default" : "outline"}
                        size="sm"
                        className={eventFilter === "upcoming" 
                          ? "bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white shadow-md" 
                          : ""}
                      >
                        Предстоящие ({events.filter(e => e.type === "upcoming").length})
                      </Button>
                      <Button
                        onClick={() => setEventFilter("past")}
                        variant={eventFilter === "past" ? "default" : "outline"}
                        size="sm"
                        className={eventFilter === "past" 
                          ? "bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white shadow-md" 
                          : ""}
                      >
                        Прошедшие ({events.filter(e => e.type === "past").length})
                      </Button>
                    </div>
                  )}

                  {(isAdding || (editingItem && editingItem.type === "event")) && (
                    <Card className="p-4 lg:p-8 shadow-lg border-2">
                      <div className="mb-4 lg:mb-6 pb-4 lg:pb-6 border-b border-gray-200">
                        <h3 className="font-black text-2xl lg:text-3xl">
                          {editingItem ? "Редактировать событие" : "Новое событие"}
                        </h3>
                        <p className="text-gray-500 mt-2 text-sm lg:text-base">
                          {editingItem 
                            ? "Заполните все обязательные поля отмеченные звёздочкой *"
                            : "Дата будет установлена автоматически на сегодня, если не указана другая. Обязательные поля отмечены звёздочкой *"
                          }
                        </p>
                      </div>
                      <div className="space-y-6">
                        {/* Основная информация */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-1 bg-gradient-to-b from-pink-400 to-rose-400 rounded-full" />
                            <h4 className="font-black text-base lg:text-lg">Основная информация</h4>
                          </div>
                          <div>
                            <Label className="text-base mb-2 block">Название *</Label>
                            <Input
                              value={eventForm.title}
                              onChange={(e) =>
                                setEventForm({ ...eventForm, title: e.target.value })
                              }
                              placeholder="Введите название события"
                              className="h-12 text-base"
                            />
                          </div>
                          <div>
                            <Label className="text-base mb-2 block">Описание</Label>
                            <Textarea
                              value={eventForm.description}
                              onChange={(e) =>
                                setEventForm({
                                  ...eventForm,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Опишите событие"
                              rows={6}
                              className="text-base min-h-[150px]"
                            />
                          </div>
                        </div>
                        {/* Дата и время */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-1 bg-gradient-to-b from-pink-400 to-rose-400 rounded-full" />
                            <h4 className="font-black text-base lg:text-lg">Дата и время</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                            <div>
                              <Label className="text-base mb-2 block">Дата</Label>
                              <Input
                                type="date"
                                value={eventForm.date}
                                onChange={(e) =>
                                  setEventForm({ ...eventForm, date: e.target.value })
                                }
                                placeholder={getTodayDate()}
                                className="h-12 text-base"
                              />
                              {!editingItem && (
                                <p className="text-xs lg:text-sm text-gray-500 mt-1">
                                  📅 По умолчанию: сегодня
                                </p>
                              )}
                            </div>
                            <div>
                              <Label className="text-base mb-2 block">Время *</Label>
                              <Input
                                type="time"
                                value={eventForm.time}
                                onChange={(e) =>
                                  setEventForm({ ...eventForm, time: e.target.value })
                                }
                                placeholder="19:00"
                                className="h-12 text-base"
                              />
                            </div>
                            <div>
                              <Label className="text-base mb-2 block">Длительность</Label>
                              <Input
                                value={eventForm.duration}
                                onChange={(e) =>
                                  setEventForm({
                                    ...eventForm,
                                    duration: e.target.value,
                                  })
                                }
                                placeholder="2 часа"
                                className="h-12 text-base"
                              />
                            </div>
                          </div>
                        </div>
                        {/* Дополнительная информация */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-1 bg-gradient-to-b from-pink-400 to-rose-400 rounded-full" />
                            <h4 className="font-black text-base lg:text-lg">Дополнительная информация</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                            <div>
                              <Label className="text-base mb-2 block">Преподаватель</Label>
                              <Input
                                value={eventForm.instructor}
                                onChange={(e) =>
                                  setEventForm({
                                    ...eventForm,
                                    instructor: e.target.value,
                                  })
                                }
                                placeholder="Имя преподавателя"
                                className="h-12 text-base"
                              />
                            </div>
                            <div>
                              <Label className="text-base mb-2 block">Тип</Label>
                              <Select
                                value={eventForm.type}
                                onValueChange={(value: "upcoming" | "past") =>
                                  setEventForm({ ...eventForm, type: value })
                                }
                              >
                                <SelectTrigger className="h-12 text-base">
                                  <SelectValue placeholder="Выберите тип" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="upcoming">Предстоящее</SelectItem>
                                  <SelectItem value="past">Прошедшее</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label className="text-base mb-2 block">Ссылка на эфир</Label>
                            <Input
                              type="url"
                              value={eventForm.link}
                              onChange={(e) =>
                                setEventForm({ ...eventForm, link: e.target.value })
                              }
                              placeholder="https://zoom.us/..."
                              className="h-12 text-base"
                            />
                            <p className="text-xs lg:text-sm text-gray-500 mt-1">
                              🔗 Ссылка для подключения к эфиру (Zoom, Google Meet и т.д.)
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-3 pt-4">
                          <Button
                            onClick={editingItem ? handleUpdateEvent : handleAddEvent}
                            size="lg"
                            className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 lg:px-8 shadow-md w-full lg:w-auto"
                          >
                            <Save className="h-5 w-5 mr-2" />
                            {editingItem ? "Сохранить изменения" : "Добавить событие"}
                          </Button>
                          <Button onClick={cancelEdit} variant="outline" size="lg" className="lg:px-8 w-full lg:w-auto">
                            <X className="h-5 w-5 mr-2" />
                            Отмена
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="space-y-4">
                    {events.length === 0 ? (
                      <Card className="p-8 lg:p-12 text-center border-2 border-dashed border-gray-300">
                        <div className="max-w-sm mx-auto">
                          <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Calendar className="h-8 w-8 lg:h-10 lg:w-10 text-gray-400" />
                          </div>
                          <h3 className="font-black text-xl lg:text-2xl text-gray-900 mb-2">
                            ��ет событий
                          </h3>
                          <p className="text-gray-500 mb-6 text-sm lg:text-base">
                            Создайте первое событие для календаря эфиров
                          </p>
                          <Button
                            onClick={() => setIsAdding(true)}
                            size="lg"
                            className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Создать событие
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <>
                        {events.filter(event => eventFilter === "all" || event.type === eventFilter).length === 0 ? (
                          <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                            <div className="max-w-sm mx-auto">
                              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Calendar className="h-8 w-8 text-gray-400" />
                              </div>
                              <h3 className="font-black text-xl text-gray-900 mb-2">
                                Событий не найдено
                              </h3>
                              <p className="text-gray-500 mb-4 text-sm">
                                {eventFilter === "upcoming" && "Нет предстоящих событий"}
                                {eventFilter === "past" && "Нет прошедших событий"}
                              </p>
                              <Button
                                onClick={() => setEventFilter("all")}
                                variant="outline"
                                size="sm"
                              >
                                Показать все
                              </Button>
                            </div>
                          </Card>
                        ) : (
                          events
                            .filter(event => eventFilter === "all" || event.type === eventFilter)
                            .map((item) => (
                        <Card key={item.id} className="p-4 lg:p-6 hover:shadow-md transition-shadow border">
                          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-6">
                            <div className="flex-1 min-w-0 w-full lg:w-auto">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-black text-lg lg:text-xl mb-2">
                                    {item.title}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <Badge 
                                      className={`${
                                        item.type === "upcoming"
                                          ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white"
                                          : "bg-gray-200 text-gray-700"
                                      }`}
                                    >
                                      {item.type === "upcoming" ? "Предстоящее" : "Прошедшее"}
                                    </Badge>
                                    {item.link && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        🔗 Есть ссылка
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {item.description && (
                                <p className="text-gray-700 mb-4 text-sm lg:text-base">{item.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2 lg:gap-3 text-xs lg:text-sm text-gray-500">
                                <span className="font-semibold text-gray-700">📅 {item.date}</span>
                                <span>•</span>
                                <span className="font-semibold text-gray-700">🕐 {item.time}</span>
                                {item.duration && (
                                  <>
                                    <span>•</span>
                                    <span>⏱️ {item.duration}</span>
                                  </>
                                )}
                                {item.instructor && (
                                  <>
                                    <span>•</span>
                                    <span>👨‍🏫 {item.instructor}</span>
                                  </>
                                )}
                              </div>
                              {item.link && (
                                <div className="mt-3">
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors"
                                  >
                                    🔗 Открыть ссылку на эфир
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0 w-full lg:w-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(item, "event")}
                                className="hover:bg-gray-100 flex-1 lg:flex-none"
                              >
                                <Edit2 className="h-4 w-4 lg:mr-2" />
                                <span className="hidden lg:inline">Изменить</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setDeletingItem({ id: item.id, type: "event" })
                                }
                                className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                            ))
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* INSTRUCTIONS MANAGEMENT */}
              {activeSection === "instructions" && (
                <AdminInstructionsManager />
              )}

              {/* RECORDINGS MANAGEMENT */}
              {activeSection === "recordings" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h1 className="font-black text-3xl lg:text-5xl mb-2">Записи эфиров</h1>
                      <p className="text-gray-500 text-sm lg:text-lg">
                        Управление записями эфиров • {recordings.length} {recordings.length === 1 ? 'запись' : 'записей'}
                      </p>
                    </div>
                    {!isAdding && !editingItem && (
                      <Button
                        onClick={() => setIsAdding(true)}
                        size="lg"
                        className="hidden lg:flex bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 shadow-lg hover:shadow-xl transition-all"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Добавить запись
                      </Button>
                    )}
                  </div>

                  {(isAdding || (editingItem && editingItem.type === "recording")) && (
                    <Card className="p-4 lg:p-8 shadow-lg border-2">
                      <div className="mb-4 lg:mb-6 pb-4 lg:pb-6 border-b border-gray-200">
                        <h3 className="font-black text-2xl lg:text-3xl">
                          {editingItem ? "Редактировать запись" : "Новая запись"}
                        </h3>
                        <p className="text-gray-500 mt-2 text-sm lg:text-base">Заполните все обязательные поля отмеченные звёздочкой *</p>
                      </div>
                      <div className="space-y-6">
                        {/* Основная информация */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-1 bg-gradient-to-b from-pink-400 to-rose-400 rounded-full" />
                            <h4 className="font-black text-base lg:text-lg">Основная информация</h4>
                          </div>
                          <div>
                            <Label className="text-base mb-2 block">Название *</Label>
                            <Input
                              value={recordingForm.title}
                              onChange={(e) =>
                                setRecordingForm({
                                  ...recordingForm,
                                  title: e.target.value,
                                })
                              }
                              placeholder="Введите название записи"
                              className="h-12 text-base"
                            />
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                            <div>
                              <Label className="text-base mb-2 block">Дата *</Label>
                              <Input
                                type="date"
                                value={recordingForm.date}
                                onChange={(e) =>
                                  setRecordingForm({
                                    ...recordingForm,
                                    date: e.target.value,
                                  })
                                }
                                className="h-12 text-base"
                              />
                            </div>
                            <div>
                              <Label className="text-base mb-2 block">Длительность</Label>
                              <Input
                                value={recordingForm.duration}
                                onChange={(e) =>
                                  setRecordingForm({
                                    ...recordingForm,
                                    duration: e.target.value,
                                  })
                                }
                                placeholder="1:45:00"
                                className="h-12 text-base"
                              />
                            </div>
                            <div>
                              <Label className="text-base mb-2 block">Преподаватель</Label>
                              <Input
                                value={recordingForm.instructor}
                                onChange={(e) =>
                                  setRecordingForm({
                                    ...recordingForm,
                                    instructor: e.target.value,
                                  })
                                }
                                placeholder="Имя преподавателя"
                                className="h-12 text-base"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-base mb-2 block">Описание</Label>
                            <Textarea
                              value={recordingForm.description}
                              onChange={(e) =>
                                setRecordingForm({
                                  ...recordingForm,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Введите описание записи эфира"
                              rows={8}
                              className="text-base min-h-[200px]"
                            />
                          </div>
                        </div>
                        
                        {/* Медиа-контент */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-1 bg-gradient-to-b from-pink-400 to-rose-400 rounded-full" />
                            <h4 className="font-black text-base lg:text-lg">Медиа-контент</h4>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                            <div>
                              <Label className="text-base mb-2 block">URL видео</Label>
                              <Input
                                value={recordingForm.videoUrl}
                                onChange={(e) =>
                                  setRecordingForm({
                                    ...recordingForm,
                                    videoUrl: e.target.value,
                                  })
                                }
                                placeholder="https://youtube.com/watch?v=..."
                                className="h-12 text-base"
                              />
                              <p className="text-xs lg:text-sm text-gray-500 mt-1">
                                🎥 Ссылка на видеозапись эфира
                              </p>
                            </div>
                            <div>
                              <Label className="text-base mb-2 block">URL превью</Label>
                              <Input
                                value={recordingForm.thumbnail}
                                onChange={(e) =>
                                  setRecordingForm({
                                    ...recordingForm,
                                    thumbnail: e.target.value,
                                  })
                                }
                                placeholder="https://example.com/thumbnail.jpg"
                                className="h-12 text-base"
                              />
                              <p className="text-xs lg:text-sm text-gray-500 mt-1">
                                🖼️ Изображение превью для карточки
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row gap-3 pt-4">
                          <Button
                            onClick={
                              editingItem ? handleUpdateRecording : handleAddRecording
                            }
                            size="lg"
                            className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 shadow-md w-full lg:w-auto"
                          >
                            <Save className="h-5 w-5 mr-2" />
                            {editingItem ? "Сохранить изменения" : "Добавить запись"}
                          </Button>
                          <Button onClick={cancelEdit} variant="outline" size="lg" className="w-full lg:w-auto">
                            <X className="h-5 w-5 mr-2" />
                            Отмена
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="space-y-4">
                    {recordings.length === 0 ? (
                      <Card className="p-12 text-center border-2 border-dashed border-gray-300">
                        <div className="max-w-sm mx-auto">
                          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Plus className="h-10 w-10 text-gray-400" />
                          </div>
                          <h3 className="font-black text-2xl text-gray-900 mb-2">
                            Нет записей
                          </h3>
                          <p className="text-gray-500 mb-6">
                            Добавьте первую запись эфира
                          </p>
                          <Button
                            onClick={() => setIsAdding(true)}
                            size="lg"
                            className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Создать запись
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      recordings.map((item) => (
                      <Card key={item.id} className="p-4 lg:p-6 hover:shadow-md transition-shadow border">
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-6">
                          <div className="flex-1 min-w-0 w-full lg:w-auto">
                            <h3 className="font-black text-lg lg:text-xl mb-2 lg:mb-3">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-sm lg:text-base text-gray-700 mb-3 lg:mb-4 whitespace-pre-wrap line-clamp-3 lg:line-clamp-none">{item.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs lg:text-sm text-gray-500">
                              <span className="font-semibold">📅 {item.date}</span>
                              {item.duration && (
                                <>
                                  <span>•</span>
                                  <span>⏱️ {item.duration}</span>
                                </>
                              )}
                              {item.instructor && (
                                <>
                                  <span>•</span>
                                  <span>👤 {item.instructor}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>👁️ {item.views} просмотров</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0 w-full lg:w-auto">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(item, "recording")}
                              className="hover:bg-gray-100 flex-1 lg:flex-none"
                            >
                              <Edit2 className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                              <span className="hidden lg:inline">Изменить</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDeletingItem({ id: item.id, type: "recording" })
                              }
                              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            >
                              <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* FAQ MANAGEMENT */}
              {activeSection === "faq" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h1 className="font-black text-3xl lg:text-5xl mb-2">FAQ</h1>
                      <p className="text-gray-500 text-sm lg:text-lg">
                        Управление часто задаваемыми вопросами • {faqItems.length} {faqItems.length === 1 ? 'вопрос' : 'вопросов'}
                      </p>
                    </div>
                    {!isAdding && !editingItem && (
                      <Button
                        onClick={() => setIsAdding(true)}
                        size="lg"
                        className="hidden lg:flex bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 shadow-lg hover:shadow-xl transition-all"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Добавить вопрос
                      </Button>
                    )}
                  </div>

                  {(isAdding || (editingItem && editingItem.type === "faq")) && (
                    <Card className="p-4 lg:p-8 shadow-lg border-2">
                      <div className="mb-4 lg:mb-6 pb-4 lg:pb-6 border-b border-gray-200">
                        <h3 className="font-black text-2xl lg:text-3xl">
                          {editingItem ? "Редактировать вопрос" : "Новый вопрос"}
                        </h3>
                        <p className="text-gray-500 mt-2 text-sm lg:text-base">Заполните все обязательные поля отмеченные звёздочкой *</p>
                      </div>
                      <div className="space-y-6">
                        {/* Основное содержание */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-1 bg-gradient-to-b from-pink-400 to-rose-400 rounded-full" />
                            <h4 className="font-black text-base lg:text-lg">Основное содержание</h4>
                          </div>
                          <div>
                            <Label className="text-base mb-2 block">Вопрос *</Label>
                            <Input
                              value={faqForm.question}
                              onChange={(e) =>
                                setFaqForm({ ...faqForm, question: e.target.value })
                              }
                              placeholder="Введите часто задаваемый вопрос"
                              className="h-12 text-base"
                            />
                            <p className="text-xs lg:text-sm text-gray-500 mt-1">
                              ❓ Формулируйте вопрос так, как его задают ученики
                            </p>
                          </div>
                          <div>
                            <Label className="text-base mb-2 block">Ответ *</Label>
                            <Textarea
                              value={faqForm.answer}
                              onChange={(e) =>
                                setFaqForm({ ...faqForm, answer: e.target.value })
                              }
                              placeholder="Введите подробный ответ на вопрос"
                              rows={10}
                              className="text-base min-h-[250px]"
                            />
                            <p className="text-xs lg:text-sm text-gray-500 mt-1">
                              💡 Давайте максимально развёрнутый и понятный ответ
                            </p>
                          </div>
                        </div>
                        
                        {/* Категоризация */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-1 bg-gradient-to-b from-pink-400 to-rose-400 rounded-full" />
                            <h4 className="font-black text-base lg:text-lg">Категоризация</h4>
                          </div>
                          <div>
                            <Label className="text-base mb-2 block">Категория</Label>
                            <Input
                              value={faqForm.category}
                              onChange={(e) =>
                                setFaqForm({ ...faqForm, category: e.target.value })
                              }
                              placeholder="Введите категорию вопроса"
                              className="h-12 text-base"
                            />
                            <p className="text-xs lg:text-sm text-gray-500 mt-1">
                              🏷️ Примеры: «Общие вопросы», «Эфиры и записи», «Техническая поддержка»
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row gap-3 pt-4">
                          <Button
                            onClick={editingItem ? handleUpdateFAQ : handleAddFAQ}
                            size="lg"
                            className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 shadow-md w-full lg:w-auto"
                          >
                            <Save className="h-5 w-5 mr-2" />
                            {editingItem ? "Сохранить изменения" : "Добавить вопрос"}
                          </Button>
                          <Button onClick={cancelEdit} variant="outline" size="lg" className="w-full lg:w-auto">
                            <X className="h-5 w-5 mr-2" />
                            Отмена
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="space-y-4">
                    {faqItems.length === 0 ? (
                      <Card className="p-12 text-center border-2 border-dashed border-gray-300">
                        <div className="max-w-sm mx-auto">
                          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Plus className="h-10 w-10 text-gray-400" />
                          </div>
                          <h3 className="font-black text-2xl text-gray-900 mb-2">
                            Нет вопросов
                          </h3>
                          <p className="text-gray-500 mb-6">
                            Добавьте первый часто задаваемый вопрос
                          </p>
                          <Button
                            onClick={() => setIsAdding(true)}
                            size="lg"
                            className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Создать вопрос
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      faqItems.map((item) => (
                      <Card key={item.id} className="p-4 lg:p-6 hover:shadow-md transition-shadow border">
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-6">
                          <div className="flex-1 min-w-0 w-full lg:w-auto">
                            <h3 className="font-black text-lg lg:text-xl mb-2 lg:mb-3">
                              ❓ {item.question}
                            </h3>
                            <p className="text-sm lg:text-base text-gray-700 mb-3 lg:mb-4 whitespace-pre-wrap line-clamp-4 lg:line-clamp-none">{item.answer}</p>
                            <div className="flex flex-wrap gap-2 text-xs lg:text-sm text-gray-500">
                              {item.category && (
                                <>
                                  <Badge variant="outline" className="text-xs font-semibold">🏷️ {item.category}</Badge>
                                  <span>•</span>
                                </>
                              )}
                              <span className="font-semibold">👍 {item.helpful} отметок «Полезно»</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0 w-full lg:w-auto">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(item, "faq")}
                              className="hover:bg-gray-100 flex-1 lg:flex-none"
                            >
                              <Edit2 className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                              <span className="hidden lg:inline">Изменить</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDeletingItem({ id: item.id, type: "faq" })
                              }
                              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            >
                              <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Action Button (FAB) - Mobile только для разделов с контентом */}
      {!isAdding && !editingItem && activeSection !== "questions" && activeSection !== "users" && (
        <button
          onClick={() => setIsAdding(true)}
          className="lg:hidden fixed bottom-24 right-6 h-14 w-14 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-all"
          aria-label="Добавить"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/60 z-50">
        <div className="grid grid-cols-4 h-20">
          {/* Новости */}
          <button
            onClick={() => {
              setActiveSection("news");
              cancelEdit();
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
              activeSection === "news" 
                ? "text-pink-500" 
                : "text-gray-500 active:bg-gray-50"
            }`}
          >
            {activeSection === "news" && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
            )}
            <Newspaper className={`h-6 w-6 ${activeSection === "news" ? "stroke-[2.5px]" : "stroke-2"}`} />
            <span className={`text-xs ${activeSection === "news" ? "font-bold" : "font-medium"}`}>
              Новости
            </span>
          </button>

          {/* События */}
          <button
            onClick={() => {
              setActiveSection("events");
              cancelEdit();
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
              activeSection === "events" 
                ? "text-pink-500" 
                : "text-gray-500 active:bg-gray-50"
            }`}
          >
            {activeSection === "events" && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
            )}
            <Calendar className={`h-6 w-6 ${activeSection === "events" ? "stroke-[2.5px]" : "stroke-2"}`} />
            <span className={`text-xs ${activeSection === "events" ? "font-bold" : "font-medium"}`}>
              События
            </span>
          </button>

          {/* Инструкции */}
          <button
            onClick={() => {
              setActiveSection("instructions");
              cancelEdit();
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
              activeSection === "instructions" 
                ? "text-pink-500" 
                : "text-gray-500 active:bg-gray-50"
            }`}
          >
            {activeSection === "instructions" && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
            )}
            <BookOpen className={`h-6 w-6 ${activeSection === "instructions" ? "stroke-[2.5px]" : "stroke-2"}`} />
            <span className={`text-xs ${activeSection === "instructions" ? "font-bold" : "font-medium"}`}>
              База
            </span>
          </button>

          {/* Ещё */}
          <button
            onClick={() => {
              setActiveSection("recordings");
              cancelEdit();
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
              ["recordings", "faq", "questions", "users"].includes(activeSection)
                ? "text-pink-500" 
                : "text-gray-500 active:bg-gray-50"
            }`}
          >
            {["recordings", "faq", "questions", "users"].includes(activeSection) && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-b-full" />
            )}
            <Video className={`h-6 w-6 ${["recordings", "faq", "questions", "users"].includes(activeSection) ? "stroke-[2.5px]" : "stroke-2"}`} />
            <span className={`text-xs ${["recordings", "faq", "questions", "users"].includes(activeSection) ? "font-bold" : "font-medium"}`}>
              Ещё
            </span>
          </button>
        </div>

        {/* Submenu для "Ещё" */}
        {["recordings", "faq", "questions", "users"].includes(activeSection) && (
          <div className="border-t border-gray-200/60 bg-white/98 backdrop-blur-xl">
            <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto">
              <button
                onClick={() => {
                  setActiveSection("recordings");
                  cancelEdit();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  activeSection === "recordings"
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black shadow-lg"
                    : "text-gray-600 font-semibold active:bg-gray-100"
                }`}
              >
                <Video className="h-4 w-4" />
                <span className="text-sm">Записи</span>
              </button>
              <button
                onClick={() => {
                  setActiveSection("faq");
                  cancelEdit();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  activeSection === "faq"
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black shadow-lg"
                    : "text-gray-600 font-semibold active:bg-gray-100"
                }`}
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm">FAQ</span>
              </button>
              <button
                onClick={() => {
                  setActiveSection("questions");
                  cancelEdit();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  activeSection === "questions"
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black shadow-lg"
                    : "text-gray-600 font-semibold active:bg-gray-100"
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">Вопросы</span>
                {userQuestionsCount > 0 && (
                  <Badge className="bg-pink-500 text-white text-xs">
                    {userQuestionsCount}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveSection("users");
                  cancelEdit();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  activeSection === "users"
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black shadow-lg"
                    : "text-gray-600 font-semibold active:bg-gray-100"
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="text-sm">Пользователи</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingItem}
        onOpenChange={() => setDeletingItem(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Подтвердите удаление</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600">
              Вы уверены, что хотите удалить этот элемент? Это действие нельзя
              отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="h-11 px-6">Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 h-11 px-6"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
