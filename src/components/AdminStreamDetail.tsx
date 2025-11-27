import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  HelpCircle,
  BookOpen,
  Newspaper,
  Calendar,
  Video,
} from "lucide-react";
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
import { AdminFormWrapper } from "./AdminFormWrapper";
import { AdminFormField } from "./AdminFormField";
import { apiClient } from "../api/client";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

interface Instruction {
  id: number;
  title: string;
  content: string;
  category?: string;
}

interface NewsPost {
  id: number;
  title: string;
  content: string;
  date: string;
  author?: string;
  image?: string;
}

interface Event {
  id: number;
  title: string;
  event_date: string;
  event_time?: string;
  description?: string;
  location?: string;
}

interface Recording {
  id: number;
  title: string;
  video_url?: string;
  loom_embed_url?: string;
  duration?: string;
  date: string;
  instructor?: string;
  description?: string;
}

interface StreamMaterials {
  faqs: FAQ[];
  instructions: Instruction[];
  news: NewsPost[];
  schedule: Event[];
  recordings: Recording[];
}

interface AdminStreamDetailProps {
  cohortId: number;
  cohortName: string;
  productName: string;
  onBack: () => void;
}

export function AdminStreamDetail({ cohortId, cohortName, productName, onBack }: AdminStreamDetailProps) {
  const [materials, setMaterials] = useState<StreamMaterials>({
    faqs: [],
    instructions: [],
    news: [],
    schedule: [],
    recordings: [],
  });

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("news");

  // FAQ states
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [isAddingFAQ, setIsAddingFAQ] = useState(false);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", category: "" });

  // Instructions states
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null);
  const [isAddingInstruction, setIsAddingInstruction] = useState(false);
  const [instructionForm, setInstructionForm] = useState({ title: "", content: "", category: "" });

  // News states
  const [editingNews, setEditingNews] = useState<NewsPost | null>(null);
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [newsForm, setNewsForm] = useState({ title: "", content: "" });

  // Event states
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", event_date: "", event_time: "", description: "", location: "" });

  // Recording states
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);
  const [isAddingRecording, setIsAddingRecording] = useState(false);
  const [recordingForm, setRecordingForm] = useState({ title: "", video_url: "", loom_embed_url: "", duration: "", date: "", instructor: "", description: "" });

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingType, setDeletingType] = useState<string>("");

  useEffect(() => {
    loadMaterials();
  }, [cohortId]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<StreamMaterials>(`/admin/cohort-materials/${cohortId}`);
      setMaterials(data);
    } catch (error: any) {
      toast.error("Не удалось загрузить материалы");
      console.error("Failed to load materials:", error);
    } finally {
      setLoading(false);
    }
  };

  // FAQ handlers
  const handleAddFAQ = async () => {
    if (!faqForm.question || !faqForm.answer) {
      toast.error("Заполните вопрос и ответ");
      return;
    }

    try {
      await apiClient.post(`/admin/cohort-materials/${cohortId}/faq`, faqForm);
      await loadMaterials();
      setFaqForm({ question: "", answer: "", category: "" });
      setIsAddingFAQ(false);
      toast.success("Вопрос добавлен");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить вопрос");
    }
  };

  const handleUpdateFAQ = async () => {
    if (!editingFAQ || !faqForm.question || !faqForm.answer) {
      toast.error("Заполните вопрос и ответ");
      return;
    }

    try {
      await apiClient.put(`/admin/cohort-materials/${cohortId}/faq/${editingFAQ.id}`, faqForm);
      await loadMaterials();
      setEditingFAQ(null);
      setFaqForm({ question: "", answer: "", category: "" });
      toast.success("Вопрос обновлён");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить вопрос");
    }
  };

  const handleDeleteFAQ = async (id: number) => {
    try {
      await apiClient.delete(`/admin/cohort-materials/${cohortId}/faq/${id}`);
      await loadMaterials();
      setDeletingId(null);
      toast.success("Вопрос удалён");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить вопрос");
    }
  };

  // Instruction handlers
  const handleAddInstruction = async () => {
    if (!instructionForm.title || !instructionForm.content) {
      toast.error("Заполните название и содержание");
      return;
    }

    try {
      await apiClient.post(`/admin/cohort-materials/${cohortId}/instructions`, instructionForm);
      await loadMaterials();
      setInstructionForm({ title: "", content: "", category: "" });
      setIsAddingInstruction(false);
      toast.success("Статья добавлена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить статью");
    }
  };

  const handleUpdateInstruction = async () => {
    if (!editingInstruction || !instructionForm.title || !instructionForm.content) {
      toast.error("Заполните название и содержание");
      return;
    }

    try {
      await apiClient.put(`/admin/cohort-materials/${cohortId}/instructions/${editingInstruction.id}`, instructionForm);
      await loadMaterials();
      setEditingInstruction(null);
      setInstructionForm({ title: "", content: "", category: "" });
      toast.success("Статья обновлена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить статью");
    }
  };

  const handleDeleteInstruction = async (id: number) => {
    try {
      await apiClient.delete(`/admin/cohort-materials/${cohortId}/instructions/${id}`);
      await loadMaterials();
      setDeletingId(null);
      toast.success("Статья удалена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить статью");
    }
  };

  // News handlers
  const handleAddNews = async () => {
    if (!newsForm.title || !newsForm.content) {
      toast.error("Заполните название и содержание");
      return;
    }

    try {
      await apiClient.post(`/admin/cohort-materials/${cohortId}/news`, newsForm);
      await loadMaterials();
      setNewsForm({ title: "", content: "" });
      setIsAddingNews(false);
      toast.success("Новость добавлена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить новость");
    }
  };

  const handleUpdateNews = async () => {
    if (!editingNews || !newsForm.title || !newsForm.content) {
      toast.error("Заполните название и содержание");
      return;
    }

    try {
      await apiClient.put(`/admin/cohort-materials/${cohortId}/news/${editingNews.id}`, newsForm);
      await loadMaterials();
      setEditingNews(null);
      setNewsForm({ title: "", content: "" });
      toast.success("Новость обновлена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить новость");
    }
  };

  const handleDeleteNews = async (id: number) => {
    try {
      await apiClient.delete(`/admin/cohort-materials/${cohortId}/news/${id}`);
      await loadMaterials();
      setDeletingId(null);
      toast.success("Новость удалена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить новость");
    }
  };

  // Event handlers
  const handleAddEvent = async () => {
    if (!eventForm.title || !eventForm.event_date) {
      toast.error("Заполните название и дату");
      return;
    }

    try {
      await apiClient.post(`/admin/cohort-materials/${cohortId}/events`, eventForm);
      await loadMaterials();
      setEventForm({ title: "", event_date: "", event_time: "", description: "", location: "" });
      setIsAddingEvent(false);
      toast.success("Событие добавлено");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить событие");
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !eventForm.title || !eventForm.event_date) {
      toast.error("Заполните название и дату");
      return;
    }

    try {
      await apiClient.put(`/admin/cohort-materials/${cohortId}/events/${editingEvent.id}`, eventForm);
      await loadMaterials();
      setEditingEvent(null);
      setEventForm({ title: "", event_date: "", event_time: "", description: "", location: "" });
      toast.success("Событие обновлено");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить событие");
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await apiClient.delete(`/admin/cohort-materials/${cohortId}/events/${id}`);
      await loadMaterials();
      setDeletingId(null);
      toast.success("Событие удалено");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить событие");
    }
  };

  // Recording handlers
  const handleAddRecording = async () => {
    if (!recordingForm.title || !recordingForm.date || !recordingForm.instructor) {
      toast.error("Заполните название, дату и преподавателя");
      return;
    }

    try {
      await apiClient.post(`/admin/cohort-materials/${cohortId}/recordings`, recordingForm);
      await loadMaterials();
      setRecordingForm({ title: "", video_url: "", loom_embed_url: "", duration: "", date: "", instructor: "", description: "" });
      setIsAddingRecording(false);
      toast.success("Запись добавлена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить запись");
    }
  };

  const handleUpdateRecording = async () => {
    if (!editingRecording || !recordingForm.title || !recordingForm.date || !recordingForm.instructor) {
      toast.error("Заполните название, дату и преподавателя");
      return;
    }

    try {
      await apiClient.put(`/admin/cohort-materials/${cohortId}/recordings/${editingRecording.id}`, recordingForm);
      await loadMaterials();
      setEditingRecording(null);
      setRecordingForm({ title: "", video_url: "", loom_embed_url: "", duration: "", date: "", instructor: "", description: "" });
      toast.success("Запись обновлена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить запись");
    }
  };

  const handleDeleteRecording = async (id: number) => {
    try {
      await apiClient.delete(`/admin/cohort-materials/${cohortId}/recordings/${id}`);
      await loadMaterials();
      setDeletingId(null);
      toast.success("Запись удалена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить запись");
    }
  };

  const startEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category || "" });
  };

  const startEditInstruction = (instruction: Instruction) => {
    setEditingInstruction(instruction);
    setInstructionForm({ title: instruction.title, content: instruction.content, category: instruction.category || "" });
  };

  const startEditNews = (post: NewsPost) => {
    setEditingNews(post);
    setNewsForm({ title: post.title, content: post.content });
  };

  const startEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      event_date: event.event_date,
      event_time: event.event_time || "",
      description: event.description || "",
      location: event.location || ""
    });
  };

  const startEditRecording = (recording: Recording) => {
    setEditingRecording(recording);
    setRecordingForm({
      title: recording.title,
      video_url: recording.video_url || "",
      loom_embed_url: recording.loom_embed_url || "",
      duration: recording.duration || "",
      date: recording.date,
      instructor: recording.instructor || "",
      description: recording.description || ""
    });
  };

  const materialSections = [
    { id: "news", label: "Лента новостей", icon: Newspaper, count: materials.news.length, color: "from-pink-400 to-rose-400" },
    { id: "schedule", label: "Расписание", icon: Calendar, count: materials.schedule.length, color: "from-orange-400 to-amber-400" },
    { id: "recordings", label: "Записи эфиров", icon: Video, count: materials.recordings.length, color: "from-green-400 to-emerald-400" },
    { id: "faqs", label: "Вопрос-ответ", icon: HelpCircle, count: materials.faqs.length, color: "from-blue-400 to-cyan-400" },
    { id: "instructions", label: "База знаний", icon: BookOpen, count: materials.instructions.length, color: "from-purple-400 to-indigo-400" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 -ml-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к продукту
        </Button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-black text-5xl">{cohortName}</h1>
              <Badge className="bg-purple-100 text-purple-700 text-lg px-3 py-1">
                {productName}
              </Badge>
            </div>
            <p className="text-gray-500 text-lg">
              Управление материалами потока
            </p>
          </div>
        </div>
      </div>

      {/* Material Sections Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {materialSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                activeSection === section.id ? "ring-2 ring-purple-400 shadow-lg" : ""
              }`}
              onClick={() => setActiveSection(section.id)}
            >
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{section.label}</h3>
              <p className="text-sm text-gray-500">{section.count} {section.count === 1 ? 'элемент' : 'элементов'}</p>
            </Card>
          );
        })}
      </div>

      {/* News Section */}
      {activeSection === "news" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-3xl">Лента новостей</h2>
            <Button
              onClick={() => setIsAddingNews(true)}
              className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить новость
            </Button>
          </div>

          {(isAddingNews || editingNews) && (
            <AdminFormWrapper
              title={editingNews ? "Редактировать новость" : "Новая новость"}
              description="Заполните название и содержание"
              onSubmit={editingNews ? handleUpdateNews : handleAddNews}
              onCancel={() => {
                setIsAddingNews(false);
                setEditingNews(null);
                setNewsForm({ title: "", content: "" });
              }}
              submitText={editingNews ? "Сохранить" : "Опубликовать"}
            >
              <div className="space-y-6">
                <AdminFormField label="Название" required emoji="📄">
                  <Input
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    placeholder="Важное объявление"
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Содержание" required emoji="📝">
                  <Textarea
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    placeholder="Подробное описание..."
                    rows={6}
                  />
                </AdminFormField>
              </div>
            </AdminFormWrapper>
          )}

          {materials.news.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <Newspaper className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="font-black text-2xl text-gray-900 mb-2">Нет новостей</h3>
              <p className="text-gray-500 mb-4">Добавьте первую новость</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.news.map((post) => (
                <Card key={post.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900">{post.title}</h4>
                      <p className="text-sm text-gray-500">{post.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditNews(post)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDeletingId(post.id);
                          setDeletingType("news");
                        }}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-600 line-clamp-3">{post.content}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Section */}
      {activeSection === "schedule" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-3xl">Расписание</h2>
            <Button
              onClick={() => setIsAddingEvent(true)}
              className="bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить событие
            </Button>
          </div>

          {(isAddingEvent || editingEvent) && (
            <AdminFormWrapper
              title={editingEvent ? "Редактировать событие" : "Новое событие"}
              description="Заполните информацию о событии"
              onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent}
              onCancel={() => {
                setIsAddingEvent(false);
                setEditingEvent(null);
                setEventForm({ title: "", event_date: "", event_time: "", description: "", location: "" });
              }}
              submitText={editingEvent ? "Сохранить" : "Опубликовать"}
            >
              <div className="space-y-6">
                <AdminFormField label="Название" required emoji="📄">
                  <Input
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="Вебинар по теме"
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Дата" required emoji="📅">
                  <Input
                    type="date"
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Время" emoji="🕒">
                  <Input
                    type="time"
                    value={eventForm.event_time}
                    onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Место" emoji="📍">
                  <Input
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder="Ссылка на Zoom или адрес"
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Описание" emoji="📝">
                  <Textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    placeholder="Подробное описание события..."
                    rows={4}
                  />
                </AdminFormField>
              </div>
            </AdminFormWrapper>
          )}

          {materials.schedule.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="font-black text-2xl text-gray-900 mb-2">Нет событий</h3>
              <p className="text-gray-500 mb-4">Добавьте первое событие в расписание</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.schedule.map((event) => (
                <Card key={event.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-500">
                        {event.event_date} {event.event_time && `• ${event.event_time}`}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-500">📍 {event.location}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditEvent(event)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDeletingId(event.id);
                          setDeletingType("event");
                        }}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-gray-600 line-clamp-3">{event.description}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recordings Section */}
      {activeSection === "recordings" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-3xl">Записи эфиров</h2>
            <Button
              onClick={() => setIsAddingRecording(true)}
              className="bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить запись
            </Button>
          </div>

          {(isAddingRecording || editingRecording) && (
            <AdminFormWrapper
              title={editingRecording ? "Редактировать запись" : "Новая запись"}
              description="Заполните информацию о записи"
              onSubmit={editingRecording ? handleUpdateRecording : handleAddRecording}
              onCancel={() => {
                setIsAddingRecording(false);
                setEditingRecording(null);
                setRecordingForm({ title: "", video_url: "", loom_embed_url: "", duration: "", date: "", instructor: "", description: "" });
              }}
              submitText={editingRecording ? "Сохранить" : "Опубликовать"}
            >
              <div className="space-y-6">
                <AdminFormField label="Название" required emoji="📄">
                  <Input
                    value={recordingForm.title}
                    onChange={(e) => setRecordingForm({ ...recordingForm, title: e.target.value })}
                    placeholder="Урок 1: Введение"
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Преподаватель" required emoji="👨‍🏫">
                  <Input
                    value={recordingForm.instructor}
                    onChange={(e) => setRecordingForm({ ...recordingForm, instructor: e.target.value })}
                    placeholder="Имя преподавателя"
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Дата" required emoji="📅">
                  <Input
                    type="date"
                    value={recordingForm.date}
                    onChange={(e) => setRecordingForm({ ...recordingForm, date: e.target.value })}
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Длительность" emoji="⏱️">
                  <Input
                    value={recordingForm.duration}
                    onChange={(e) => setRecordingForm({ ...recordingForm, duration: e.target.value })}
                    placeholder="1ч 30мин"
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Loom Embed URL" emoji="🎥">
                  <Input
                    value={recordingForm.loom_embed_url}
                    onChange={(e) => setRecordingForm({ ...recordingForm, loom_embed_url: e.target.value })}
                    placeholder="https://www.loom.com/embed/..."
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Видео URL (альтернатива)" emoji="🔗">
                  <Input
                    value={recordingForm.video_url}
                    onChange={(e) => setRecordingForm({ ...recordingForm, video_url: e.target.value })}
                    placeholder="https://youtube.com/..."
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Описание" emoji="📝">
                  <Textarea
                    value={recordingForm.description}
                    onChange={(e) => setRecordingForm({ ...recordingForm, description: e.target.value })}
                    placeholder="Краткое описание записи..."
                    rows={4}
                  />
                </AdminFormField>
              </div>
            </AdminFormWrapper>
          )}

          {materials.recordings.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="font-black text-2xl text-gray-900 mb-2">Нет записей</h3>
              <p className="text-gray-500 mb-4">Добавьте первую запись эфира</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.recordings.map((recording) => (
                <Card key={recording.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900">{recording.title}</h4>
                      <p className="text-sm text-gray-500">
                        {recording.instructor} • {recording.date}
                      </p>
                      {recording.duration && (
                        <p className="text-sm text-gray-500">⏱️ {recording.duration}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditRecording(recording)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDeletingId(recording.id);
                          setDeletingType("recording");
                        }}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {recording.description && (
                    <p className="text-gray-600 line-clamp-2">{recording.description}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAQ Section */}
      {activeSection === "faqs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-3xl">Вопрос-ответ</h2>
            <Button
              onClick={() => setIsAddingFAQ(true)}
              className="bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить вопрос
            </Button>
          </div>

          {(isAddingFAQ || editingFAQ) && (
            <AdminFormWrapper
              title={editingFAQ ? "Редактировать вопрос" : "Новый вопрос"}
              description="Заполните вопрос и ответ"
              onSubmit={editingFAQ ? handleUpdateFAQ : handleAddFAQ}
              onCancel={() => {
                setIsAddingFAQ(false);
                setEditingFAQ(null);
                setFaqForm({ question: "", answer: "", category: "" });
              }}
              submitText={editingFAQ ? "Сохранить" : "Опубликовать"}
            >
              <div className="space-y-6">
                <AdminFormField label="Категория (опционально)" emoji="🏷️">
                  <Input
                    value={faqForm.category}
                    onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                    placeholder="Оплата, Доступ и т.д."
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Вопрос" required emoji="❓">
                  <Input
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    placeholder="Как получить доступ к курсу?"
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Ответ" required emoji="💬">
                  <Textarea
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    placeholder="Для получения доступа..."
                    rows={4}
                  />
                </AdminFormField>
              </div>
            </AdminFormWrapper>
          )}

          {materials.faqs.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="font-black text-2xl text-gray-900 mb-2">Нет вопросов</h3>
              <p className="text-gray-500 mb-4">Добавьте первый вопрос-ответ</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {materials.faqs.map((faq) => (
                <Card key={faq.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {faq.category && (
                        <Badge className="mb-2 bg-blue-100 text-blue-700">{faq.category}</Badge>
                      )}
                      <h4 className="font-bold text-lg text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditFAQ(faq)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDeletingId(faq.id);
                          setDeletingType("faq");
                        }}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions Section */}
      {activeSection === "instructions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-3xl">База знаний</h2>
            <Button
              onClick={() => setIsAddingInstruction(true)}
              className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить статью
            </Button>
          </div>

          {(isAddingInstruction || editingInstruction) && (
            <AdminFormWrapper
              title={editingInstruction ? "Редактировать статью" : "Новая статья"}
              description="Заполните название и содержание"
              onSubmit={editingInstruction ? handleUpdateInstruction : handleAddInstruction}
              onCancel={() => {
                setIsAddingInstruction(false);
                setEditingInstruction(null);
                setInstructionForm({ title: "", content: "", category: "" });
              }}
              submitText={editingInstruction ? "Сохранить" : "Опубликовать"}
            >
              <div className="space-y-6">
                <AdminFormField label="Категория (опционально)" emoji="🏷️">
                  <Input
                    value={instructionForm.category}
                    onChange={(e) => setInstructionForm({ ...instructionForm, category: e.target.value })}
                    placeholder="Инструкции, Гайды и т.д."
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Название" required emoji="📄">
                  <Input
                    value={instructionForm.title}
                    onChange={(e) => setInstructionForm({ ...instructionForm, title: e.target.value })}
                    placeholder="Как начать работу с платформой"
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Содержание" required emoji="📝">
                  <Textarea
                    value={instructionForm.content}
                    onChange={(e) => setInstructionForm({ ...instructionForm, content: e.target.value })}
                    placeholder="Подробное описание..."
                    rows={6}
                  />
                </AdminFormField>
              </div>
            </AdminFormWrapper>
          )}

          {materials.instructions.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="font-black text-2xl text-gray-900 mb-2">Нет статей</h3>
              <p className="text-gray-500 mb-4">Добавьте первую статью в базу знаний</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.instructions.map((instruction) => (
                <Card key={instruction.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      {instruction.category && (
                        <Badge className="mb-2 bg-purple-100 text-purple-700">{instruction.category}</Badge>
                      )}
                      <h4 className="font-bold text-lg text-gray-900">{instruction.title}</h4>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditInstruction(instruction)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDeletingId(instruction.id);
                          setDeletingType("instruction");
                        }}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-600 line-clamp-3">{instruction.content}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Удалить {
                deletingType === "faq" ? "вопрос" :
                deletingType === "instruction" ? "статью" :
                deletingType === "news" ? "новость" :
                deletingType === "event" ? "событие" :
                "запись"
              }?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  if (deletingType === "faq") {
                    handleDeleteFAQ(deletingId);
                  } else if (deletingType === "instruction") {
                    handleDeleteInstruction(deletingId);
                  } else if (deletingType === "news") {
                    handleDeleteNews(deletingId);
                  } else if (deletingType === "event") {
                    handleDeleteEvent(deletingId);
                  } else if (deletingType === "recording") {
                    handleDeleteRecording(deletingId);
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
