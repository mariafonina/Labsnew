import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Users,
  FileText,
  Upload,
  Loader2,
  X,
  Link,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
import { AdminCohortInstructionsManager } from "./AdminCohortInstructionsManager";
import { RichTextEditor } from "./RichTextEditor";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

interface NewsPost {
  id: number;
  title: string;
  content: string;
  date: string;
  author?: string;
  category?: string;
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
  instructor: string;
  thumbnail?: string;
  views: number;
  description?: string;
  notes?: string;
  notes_url?: string;
  created_at: string;
}

interface CohortMember {
  id: number;
  user_id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  enrollment_id?: number;
  pricing_tier_id?: number;
  tier_name?: string;
  tier_price?: number;
  tier_level?: number;
  enrollment_status?: string;
  expires_at?: string;
  joined_at: string;
  actual_amount?: number;
}

interface PricingTier {
  id: number;
  name: string;
  price: number;
  tier_level?: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface StreamMaterials {
  faqs: FAQ[];
  news: NewsPost[];
  schedule: Event[];
  recordings: Recording[];
  instructions: any[];
}

interface AdminStreamDetailProps {
  cohortId: number;
  cohortName: string;
  productName: string;
  productId: number;
  onBack: () => void;
  section?: string;
  action?: string;
  itemId?: string;
}

export function AdminStreamDetail({
  cohortId,
  cohortName,
  productName,
  productId,
  onBack,
  section = "news",
  action,
  itemId
}: AdminStreamDetailProps) {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<StreamMaterials>({
    faqs: [],
    news: [],
    schedule: [],
    recordings: [],
    instructions: [],
  });

  const [loading, setLoading] = useState(true);
  const activeSection = section;

  // FAQ states
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [isAddingFAQ, setIsAddingFAQ] = useState(false);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", category: "" });

  // News states
  const [editingNews, setEditingNews] = useState<NewsPost | null>(null);
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [newsForm, setNewsForm] = useState({ title: "", content: "", category: "", image: "" });
  const [newsImageFile, setNewsImageFile] = useState<File | null>(null);
  const [newsImagePreview, setNewsImagePreview] = useState<string>("");

  // Event states
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({ title: "", event_date: "", event_time: "", description: "", location: "" });

  // Recording states
  const [editingRecording, setEditingRecording] = useState<Recording | null>(null);
  const [isAddingRecording, setIsAddingRecording] = useState(false);
  const [recordingForm, setRecordingForm] = useState({ title: "", video_url: "", loom_embed_url: "", duration: "", date: "", instructor: "", thumbnail: "", description: "", notes: "", notes_url: "" });
  
  // Thumbnail upload states
  const [thumbnailTab, setThumbnailTab] = useState<"upload" | "url">("upload");
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Members states
  const [members, setMembers] = useState<CohortMember[]>([]);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<CohortMember | null>(null);
  const [memberForm, setMemberForm] = useState<{ user_id: number | null; pricing_tier_id: number | null; expires_at: string; actual_amount: string }>({ user_id: null, pricing_tier_id: null, expires_at: "", actual_amount: "" });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingType, setDeletingType] = useState<string>("");

  useEffect(() => {
    loadMaterials();
  }, [cohortId]);

  // Handle URL-based form state
  useEffect(() => {
    if (action === "new") {
      if (activeSection === "news") setIsAddingNews(true);
      else if (activeSection === "schedule") setIsAddingEvent(true);
      else if (activeSection === "recordings") setIsAddingRecording(true);
      else if (activeSection === "faqs") setIsAddingFAQ(true);
      else if (activeSection === "members") {
        setIsAddingMember(true);
        if (allUsers.length === 0) loadAllUsers();
        if (tiers.length === 0) loadTiers();
      }
    } else if (action === "edit" && itemId) {
      const id = Number(itemId);
      if (activeSection === "news") {
        const item = materials.news.find(n => n.id === id);
        if (item) startEditNews(item);
      } else if (activeSection === "schedule") {
        const item = materials.schedule.find(e => e.id === id);
        if (item) startEditEvent(item);
      } else if (activeSection === "recordings") {
        const item = materials.recordings.find(r => r.id === id);
        if (item) startEditRecording(item);
      } else if (activeSection === "faqs") {
        const item = materials.faqs.find(f => f.id === id);
        if (item) startEditFAQ(item);
      } else if (activeSection === "members") {
        const item = members.find(m => m.user_id === id);
        if (item) {
          if (tiers.length === 0) loadTiers();
          startEditMember(item);
        }
      }
    }
  }, [action, itemId, activeSection, materials, members]);

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
      navigate(`/admin/products/${productId}/cohorts/${cohortId}/faqs`);
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
      navigate(`/admin/products/${productId}/cohorts/${cohortId}/faqs`);
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

  // News handlers
  const handleAddNews = async () => {
    if (!newsForm.title || !newsForm.content || !newsForm.category) {
      toast.error("Заполните название, содержание и категорию");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", newsForm.title);
      formData.append("content", newsForm.content);
      formData.append("category", newsForm.category);
      if (newsImageFile) {
        formData.append("image", newsImageFile);
      }

      await fetch(`/api/admin/cohort-materials/${cohortId}/news`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      await loadMaterials();
      setNewsForm({ title: "", content: "", category: "", image: "" });
      setNewsImageFile(null);
      setNewsImagePreview("");
      setIsAddingNews(false);
      navigate(`/admin/products/${productId}/cohorts/${cohortId}/news`);
      toast.success("Новость добавлена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить новость");
    }
  };

  const handleUpdateNews = async () => {
    if (!editingNews || !newsForm.title || !newsForm.content || !newsForm.category) {
      toast.error("Заполните название, содержание и категорию");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", newsForm.title);
      formData.append("content", newsForm.content);
      formData.append("category", newsForm.category);
      if (newsImageFile) {
        formData.append("image", newsImageFile);
      }

      await fetch(`/api/admin/cohort-materials/${cohortId}/news/${editingNews.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      await loadMaterials();
      setEditingNews(null);
      setNewsForm({ title: "", content: "", category: "", image: "" });
      setNewsImageFile(null);
      setNewsImagePreview("");
      navigate(`/admin/products/${productId}/cohorts/${cohortId}/news`);
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
      navigate(`/admin/products/${productId}/cohorts/${cohortId}/schedule`);
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
      navigate(`/admin/products/${productId}/cohorts/${cohortId}/schedule`);
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
      setRecordingForm({ title: "", video_url: "", loom_embed_url: "", duration: "", date: "", instructor: "", thumbnail: "", description: "", notes: "", notes_url: "" });
      resetThumbnailUpload();
      setThumbnailTab("upload");
      setIsAddingRecording(false);
      navigate(`/admin/products/${productId}/cohorts/${cohortId}/recordings`);
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
      setRecordingForm({ title: "", video_url: "", loom_embed_url: "", duration: "", date: "", instructor: "", thumbnail: "", description: "", notes: "", notes_url: "" });
      resetThumbnailUpload();
      setThumbnailTab("upload");
      navigate(`/admin/products/${productId}/cohorts/${cohortId}/recordings`);
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

  // Thumbnail upload handlers
  const handleThumbnailFileSelect = async (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Разрешены только изображения (JPEG, PNG, GIF, WebP)");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Файл слишком большой. Максимум 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsThumbnailUploading(true);

    try {
      const result = await apiClient.uploadImageDirect(file, "thumbnails");

      if (!result.success) {
        throw new Error("Upload failed");
      }

      setRecordingForm(prev => ({ ...prev, thumbnail: result.url }));
      toast.success("Обложка загружена");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Не удалось загрузить обложку");
      setThumbnailPreview(null);
    } finally {
      setIsThumbnailUploading(false);
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = "";
      }
    }
  };

  const resetThumbnailUpload = () => {
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
  };

  const startEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category || "" });
  };

  const startEditNews = (post: NewsPost) => {
    setEditingNews(post);
    setNewsForm({
      title: post.title,
      content: post.content,
      category: post.category || "",
      image: post.image || ""
    });
    setNewsImageFile(null);
    setNewsImagePreview(post.image || "");
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
      thumbnail: recording.thumbnail || "",
      description: recording.description || "",
      notes: recording.notes || "",
      notes_url: recording.notes_url || ""
    });
    resetThumbnailUpload();
    setThumbnailTab("upload");
  };

  // Members handlers
  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await apiClient.get<CohortMember[]>(`/admin/cohorts/${cohortId}/members`);
      setMembers(data);
    } catch (error: any) {
      toast.error("Не удалось загрузить участников");
      console.error("Failed to load members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadTiers = async () => {
    try {
      const data = await apiClient.get<PricingTier[]>(`/admin/cohorts/${cohortId}/tiers`);
      setTiers(data);
    } catch (error: any) {
      console.error("Failed to load tiers:", error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await apiClient.get<{ data: User[]; pagination: any }>(`/admin/users?limit=1000`);
      setAllUsers(response.data || []);
    } catch (error: any) {
      console.error("Failed to load users:", error);
      toast.error("Не удалось загрузить пользователей");
    }
  };

  const handleAddMember = async () => {
    if (!memberForm.user_id) {
      toast.error("Выберите пользователя");
      return;
    }
    
    if (!memberForm.pricing_tier_id) {
      toast.error("Выберите тариф");
      return;
    }

    try {
      const parsedAmount = memberForm.actual_amount ? parseFloat(memberForm.actual_amount) : null;
      await apiClient.post(`/admin/cohorts/${cohortId}/members`, {
        user_id: memberForm.user_id,
        pricing_tier_id: memberForm.pricing_tier_id,
        expires_at: memberForm.expires_at || null,
        actual_amount: parsedAmount,
      });
      await loadMembers();
      setMemberForm({ user_id: null, pricing_tier_id: null, expires_at: "", actual_amount: "" });
      setIsAddingMember(false);
      navigate(`/admin/products/${productId}/cohorts/${cohortId}/members`);
      toast.success("Участник добавлен");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить участника");
    }
  };

  const handleUpdateMember = async (userId: number) => {
    try {
      const parsedAmount = memberForm.actual_amount ? parseFloat(memberForm.actual_amount) : null;
      await apiClient.put(`/admin/cohorts/${cohortId}/members/${userId}`, {
        pricing_tier_id: memberForm.pricing_tier_id,
        expires_at: memberForm.expires_at || null,
        actual_amount: parsedAmount,
      });
      await loadMembers();
      setEditingMember(null);
      setMemberForm({ user_id: null, pricing_tier_id: null, expires_at: "", actual_amount: "" });
      navigate(`/admin/products/${productId}/cohorts/${cohortId}/members`);
      toast.success("Участник обновлён");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить участника");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      await apiClient.delete(`/admin/cohorts/${cohortId}/members/${userId}`);
      await loadMembers();
      setDeletingId(null);
      toast.success("Участник удалён");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить участника");
    }
  };

  const startEditMember = (member: CohortMember) => {
    setEditingMember(member);
    setMemberForm({
      user_id: member.user_id,
      pricing_tier_id: member.pricing_tier_id || null,
      expires_at: member.expires_at || "",
      actual_amount: member.actual_amount != null ? member.actual_amount.toString() : "",
    });
  };

  const availableUsers = allUsers.filter(
    (user) => !members.some((member) => member.user_id === user.id)
  );

  const materialSections = [
    { id: "news", label: "Лента новостей", icon: Newspaper, count: materials.news.length, color: "from-pink-400 to-rose-400" },
    { id: "schedule", label: "Расписание", icon: Calendar, count: materials.schedule.length, color: "from-orange-400 to-amber-400" },
    { id: "recordings", label: "Записи эфиров", icon: Video, count: materials.recordings.length, color: "from-green-400 to-emerald-400" },
    { id: "faqs", label: "Вопрос-ответ", icon: HelpCircle, count: materials.faqs.length, color: "from-blue-400 to-cyan-400" },
    { id: "instructions", label: "База знаний", icon: BookOpen, count: materials.instructions.length, color: "from-purple-400 to-indigo-400" },
    { id: "members", label: "Участники", icon: Users, count: members.length, color: "from-teal-400 to-cyan-400" },
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {materialSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.id}
              className={`px-3 py-2.5 cursor-pointer transition-all hover:shadow-md flex items-center gap-2.5 ${
                activeSection === section.id ? "ring-2 ring-purple-400 shadow-lg" : ""
              }`}
              onClick={() => {
                navigate(`/admin/products/${productId}/cohorts/${cohortId}/${section.id}`);
                if (section.id === "members" && members.length === 0) {
                  loadMembers();
                  loadTiers();
                  loadAllUsers();
                }
              }}
            >
              <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-sm">{section.label} <span className="text-gray-500 font-normal">({section.count})</span></span>
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
              onClick={() => navigate(`/admin/products/${productId}/cohorts/${cohortId}/news/new`)}
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
                navigate(`/admin/products/${productId}/cohorts/${cohortId}/news`);
                setIsAddingNews(false);
                setEditingNews(null);
                setNewsForm({ title: "", content: "", category: "", image: "" });
                setNewsImageFile(null);
                setNewsImagePreview("");
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

                <AdminFormField label="Категория" required emoji="🏷️">
                  <Input
                    value={newsForm.category}
                    onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                    placeholder="Новости / Достижения / Обновления"
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Изображение" emoji="🖼️">
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewsImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewsImagePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="h-12"
                    />
                    {newsImagePreview && (
                      <div className="relative">
                        <img
                          src={newsImagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
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
            <div className="space-y-4">
              {materials.news.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-xl transition-all border-gray-200/60 bg-white/60 backdrop-blur-sm">
                  <div className="p-6">
                    {/* Текст — главное */}
                    <p className="text-gray-900 leading-relaxed mb-6 text-lg">{post.content}</p>

                    {/* Фото */}
                    {post.image && (
                      <div className="relative aspect-video overflow-hidden rounded-xl mb-4">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Метаинформация */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/60">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{post.date}</span>
                        {post.category && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                            {post.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/products/${productId}/cohorts/${cohortId}/news/${post.id}/edit`)}
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
                  </div>
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
              onClick={() => navigate(`/admin/products/${productId}/cohorts/${cohortId}/schedule/new`)}
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
                navigate(`/admin/products/${productId}/cohorts/${cohortId}/schedule`);
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
                        onClick={() => navigate(`/admin/products/${productId}/cohorts/${cohortId}/schedule/${event.id}/edit`)}
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
              onClick={() => navigate(`/admin/products/${productId}/cohorts/${cohortId}/recordings/new`)}
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
                navigate(`/admin/products/${productId}/cohorts/${cohortId}/recordings`);
                setIsAddingRecording(false);
                setEditingRecording(null);
                setRecordingForm({ title: "", video_url: "", loom_embed_url: "", duration: "", date: "", instructor: "", thumbnail: "", description: "", notes: "", notes_url: "" });
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

                <AdminFormField label="Обложка" emoji="🖼️">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={thumbnailTab === "upload" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setThumbnailTab("upload")}
                        className={thumbnailTab === "upload" ? "bg-gradient-to-r from-pink-400 to-rose-400" : ""}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Загрузить
                      </Button>
                      <Button
                        type="button"
                        variant={thumbnailTab === "url" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setThumbnailTab("url")}
                        className={thumbnailTab === "url" ? "bg-gradient-to-r from-pink-400 to-rose-400" : ""}
                      >
                        <Link className="h-4 w-4 mr-2" />
                        URL
                      </Button>
                    </div>

                    {thumbnailTab === "upload" ? (
                      <div className="space-y-3">
                        <input
                          ref={thumbnailInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleThumbnailFileSelect(file);
                          }}
                          className="hidden"
                          disabled={isThumbnailUploading}
                        />
                        
                        {isThumbnailUploading ? (
                          <div className="relative">
                            {thumbnailPreview && (
                              <img
                                src={thumbnailPreview}
                                alt="Uploading"
                                className="w-full h-48 object-cover rounded-lg border opacity-50"
                              />
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-lg">
                              <Loader2 className="h-10 w-10 text-pink-500 animate-spin mb-2" />
                              <p className="text-gray-600 font-medium">Загрузка...</p>
                            </div>
                          </div>
                        ) : recordingForm.thumbnail ? (
                          <div className="space-y-3">
                            <div className="relative">
                              <img
                                src={recordingForm.thumbnail}
                                alt="Current thumbnail"
                                className="w-full h-48 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8"
                                onClick={() => {
                                  setRecordingForm({ ...recordingForm, thumbnail: "" });
                                  setThumbnailPreview(null);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => thumbnailInputRef.current?.click()}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Заменить обложку
                            </Button>
                          </div>
                        ) : (
                          <div
                            onClick={() => thumbnailInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-pink-400 transition-colors"
                          >
                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">Нажмите для выбора файла</p>
                            <p className="text-sm text-gray-400 mt-1">JPEG, PNG, GIF, WebP до 5MB</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Input
                          value={recordingForm.thumbnail}
                          onChange={(e) => setRecordingForm({ ...recordingForm, thumbnail: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                          className="h-12"
                        />
                        {recordingForm.thumbnail && (
                          <div className="relative">
                            <img
                              src={recordingForm.thumbnail}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-lg border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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

                <AdminFormField label="Конспект (Markdown)" emoji="📋">
                  <div className="border rounded-lg">
                    <RichTextEditor
                      value={recordingForm.notes}
                      onChange={(value) => setRecordingForm({ ...recordingForm, notes: value })}
                      placeholder="Введите текст конспекта..."
                      minHeight="300px"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Если заполнить конспект, пользователи смогут скачать его в формате Markdown
                  </p>
                </AdminFormField>

                <AdminFormField label="Ссылка на файл конспекта" emoji="🔗">
                  <Input
                    value={recordingForm.notes_url}
                    onChange={(e) => setRecordingForm({ ...recordingForm, notes_url: e.target.value })}
                    placeholder="https://docs.google.com/document/..."
                    className="h-12"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    <Link className="h-4 w-4 inline mr-1" />
                    Ссылка на внешний файл конспекта (Google Docs, Notion и т.д.)
                  </p>
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
                        onClick={() => navigate(`/admin/products/${productId}/cohorts/${cohortId}/recordings/${recording.id}/edit`)}
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
              onClick={() => navigate(`/admin/products/${productId}/cohorts/${cohortId}/faqs/new`)}
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
                navigate(`/admin/products/${productId}/cohorts/${cohortId}/faqs`);
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
                        onClick={() => navigate(`/admin/products/${productId}/cohorts/${cohortId}/faqs/${faq.id}/edit`)}
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
        <AdminCohortInstructionsManager
          cohortId={cohortId}
          productId={productId}
          action={action}
          itemId={itemId}
        />
      )}

      {/* Members Section */}
      {activeSection === "members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-3xl">Участники</h2>
            <Button
              onClick={() => navigate(`/admin/products/${productId}/cohorts/${cohortId}/members/new`)}
              className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить участника
            </Button>
          </div>

          {isAddingMember && (
            <AdminFormWrapper
              title="Добавить участника"
              description="Выберите пользователя и настройте доступ"
              onSubmit={handleAddMember}
              onCancel={() => {
                navigate(`/admin/products/${productId}/cohorts/${cohortId}/members`);
                setIsAddingMember(false);
                setMemberForm({ user_id: null, pricing_tier_id: null, expires_at: "", actual_amount: "" });
              }}
              submitText="Добавить"
            >
              <div className="space-y-6">
                <AdminFormField label="Пользователь" required emoji="👤">
                  <Select
                    value={memberForm.user_id?.toString() || ""}
                    onValueChange={(value: string) => setMemberForm({ ...memberForm, user_id: parseInt(value) })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Выберите пользователя" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name} (${user.email})`
                            : `${user.username} (${user.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AdminFormField>

                <AdminFormField label="Тариф" required emoji="🏷️">
                  <Select
                    value={memberForm.pricing_tier_id?.toString() || ""}
                    onValueChange={(value: string) => setMemberForm({ ...memberForm, pricing_tier_id: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Выберите тариф" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id.toString()}>
                          {tier.name} - {tier.price.toLocaleString("ru-RU")} ₽
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AdminFormField>

                <AdminFormField label="Фактическая сумма оплаты" emoji="💵">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={memberForm.pricing_tier_id ? `Цена тарифа: ${tiers.find(t => t.id === memberForm.pricing_tier_id)?.price?.toLocaleString('ru-RU') || ''} ₽` : 'Сначала выберите тариф'}
                    value={memberForm.actual_amount}
                    onChange={(e) => setMemberForm({ ...memberForm, actual_amount: e.target.value })}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Оставьте пустым для использования цены тарифа
                  </p>
                </AdminFormField>

                <AdminFormField label="Срок действия" emoji="📅">
                  <Input
                    type="date"
                    value={memberForm.expires_at}
                    onChange={(e) => setMemberForm({ ...memberForm, expires_at: e.target.value })}
                    className="h-12"
                  />
                </AdminFormField>
              </div>
            </AdminFormWrapper>
          )}

          {editingMember && (
            <AdminFormWrapper
              title="Редактировать участника"
              description={`${editingMember.first_name && editingMember.last_name ? `${editingMember.first_name} ${editingMember.last_name}` : editingMember.username}`}
              onSubmit={() => handleUpdateMember(editingMember.user_id)}
              onCancel={() => {
                navigate(`/admin/products/${productId}/cohorts/${cohortId}/members`);
                setEditingMember(null);
                setMemberForm({ user_id: null, pricing_tier_id: null, expires_at: "", actual_amount: "" });
              }}
              submitText="Сохранить"
            >
              <div className="space-y-6">
                <AdminFormField label="Тариф" emoji="🏷️">
                  <Select
                    value={memberForm.pricing_tier_id?.toString() || ""}
                    onValueChange={(value: string) => setMemberForm({ ...memberForm, pricing_tier_id: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Выберите тариф" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id.toString()}>
                          {tier.name} - {tier.price.toLocaleString("ru-RU")} ₽
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AdminFormField>

                <AdminFormField label="Срок действия" emoji="📅">
                  <Input
                    type="date"
                    value={memberForm.expires_at}
                    onChange={(e) => setMemberForm({ ...memberForm, expires_at: e.target.value })}
                    className="h-12"
                  />
                </AdminFormField>

                <AdminFormField label="Фактическая сумма оплаты" emoji="💵">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={memberForm.pricing_tier_id ? `Цена тарифа: ${tiers.find(t => t.id === memberForm.pricing_tier_id)?.price?.toLocaleString('ru-RU') || ''} ₽` : 'Введите сумму'}
                    value={memberForm.actual_amount}
                    onChange={(e) => setMemberForm({ ...memberForm, actual_amount: e.target.value })}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Оставьте пустым для использования цены тарифа
                  </p>
                </AdminFormField>
              </div>
            </AdminFormWrapper>
          )}

          {loadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Загрузка участников...</p>
            </div>
          ) : members.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="font-black text-2xl text-gray-900 mb-2">Нет участников</h3>
              <p className="text-gray-500 mb-4">Добавьте первого участника в поток</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Пользователь</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Тариф</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Дата вступления</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Истекает</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.first_name && member.last_name
                                ? `${member.first_name} ${member.last_name}`
                                : member.username}
                            </p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {member.tier_name ? (
                            <Badge className="bg-teal-100 text-teal-700">
                              {member.tier_name}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(member.joined_at).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {member.expires_at
                            ? new Date(member.expires_at).toLocaleDateString("ru-RU")
                            : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/admin/products/${productId}/cohorts/${cohortId}/members/${member.user_id}/edit`)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setDeletingId(member.user_id);
                                setDeletingType("member");
                              }}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
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
                deletingType === "news" ? "новость" :
                deletingType === "event" ? "событие" :
                deletingType === "member" ? "участника" :
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
                  } else if (deletingType === "news") {
                    handleDeleteNews(deletingId);
                  } else if (deletingType === "event") {
                    handleDeleteEvent(deletingId);
                  } else if (deletingType === "recording") {
                    handleDeleteRecording(deletingId);
                  } else if (deletingType === "member") {
                    handleRemoveMember(deletingId);
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
