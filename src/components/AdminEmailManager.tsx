import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import {
  Mail,
  Plus,
  Eye,
  Users,
  MousePointerClick,
  MailOpen,
  Send,
  Calendar,
  ChevronRight,
  Search,
  Trash2,
  RefreshCw,
  Key,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { AdminFormField } from "./AdminFormField";
import { AdminEmptyState } from "./AdminEmptyState";
import { AdminEmailCompose } from "./AdminEmailCompose";
import { AdminEmailSendPasswords } from "./AdminEmailSendPasswords";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface EmailCampaign {
  id: number;
  name: string;
  type: string;
  subject: string | null;
  html_content: string | null;
  text_content: string | null;
  template_id: string | null;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  clicked_count: number;
  segment_type: string;
  segment_product_id: number | null;
  segment_cohort_id: number | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignStats {
  campaign: EmailCampaign;
  stats: {
    total_sent: number;
    delivered_count: number;
    failed_count: number;
    opened_count: number;
    clicked_count: number;
    total_opens: number;
    total_clicks: number;
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    click_to_open_rate: number;
  };
}

interface QueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  total: number;
}

interface FailedEmail {
  id: number;
  email_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  attempts: number;
  max_attempts: number;
  created_at: string;
  last_attempt_at: string;
  error_message: string | null;
  batch_id: string | null;
}

export function AdminEmailManager() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<EmailCampaign | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingCampaignStats, setViewingCampaignStats] = useState<CampaignStats | null>(null);
  const [showingSendPasswords, setShowingSendPasswords] = useState(false);
  const [showingCompose, setShowingCompose] = useState(false);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [failedEmails, setFailedEmails] = useState<FailedEmail[]>([]);
  const [showFailedEmails, setShowFailedEmails] = useState(false);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const [campaignForm, setCampaignForm] = useState({
    name: "",
    type: "news",
    subject: "",
    html_content: "",
    text_content: "",
    template_id: "",
  });

  useEffect(() => {
    loadCampaigns();
    loadQueueData();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getEmailCampaigns();
      setCampaigns(data);
    } catch (error: any) {
      toast.error("Не удалось загрузить кампании");
      console.error("Failed to load campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadQueueData = async () => {
    try {
      const [stats, failed] = await Promise.all([
        apiClient.getEmailQueueStats(),
        apiClient.getEmailQueueFailed()
      ]);
      setQueueStats(stats);
      setFailedEmails(failed);
    } catch (error: any) {
      console.error("Failed to load queue data:", error);
    }
  };

  const handleRetryEmail = async (emailId: number) => {
    try {
      setRetryingId(emailId);
      await apiClient.retryFailedEmail(emailId);
      toast.success("Письмо поставлено в очередь на повторную отправку");
      await loadQueueData();
    } catch (error: any) {
      toast.error(error.message || "Не удалось повторить отправку");
    } finally {
      setRetryingId(null);
    }
  };

  const resetForm = () => {
    setCampaignForm({
      name: "",
      type: "news",
      subject: "",
      html_content: "",
      text_content: "",
      template_id: "",
    });
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleAdd = async () => {
    if (!campaignForm.name || !campaignForm.type) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const newItem = await apiClient.createEmailCampaign(campaignForm);
      setCampaigns([newItem, ...campaigns]);
      resetForm();
      toast.success("Кампания создана");
    } catch (error: any) {
      toast.error(error.message || "Не удалось создать кампанию");
      console.error("Failed to create campaign:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    if (!campaignForm.name || !campaignForm.type) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const updated = await apiClient.updateEmailCampaign(editingItem.id, campaignForm);
      setCampaigns(campaigns.map((item) => (item.id === editingItem.id ? updated : item)));
      resetForm();
      toast.success("Кампания обновлена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить кампанию");
      console.error("Failed to update campaign:", error);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await apiClient.deleteEmailCampaign(deletingId);
      setCampaigns(campaigns.filter((item) => item.id !== deletingId));
      setDeletingId(null);
      toast.success("Кампания удалена");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить кампанию");
      console.error("Failed to delete campaign:", error);
    }
  };

  const handleSend = async (campaignId: number, testMode: boolean = false) => {
    try {
      const result = await apiClient.sendEmailCampaign(campaignId, testMode);
      toast.success(`Отправлено: ${result.sent}, Ошибок: ${result.failed}`);
      await loadCampaigns();
    } catch (error: any) {
      toast.error(error.message || "Не удалось отправить кампанию");
      console.error("Failed to send campaign:", error);
    }
  };

  const handleViewStats = async (campaignId: number) => {
    try {
      const stats = await apiClient.getEmailCampaignStats(campaignId);
      setViewingCampaignStats(stats);
    } catch (error: any) {
      toast.error("Не удалось загрузить статистику");
      console.error("Failed to load stats:", error);
    }
  };

  const handleRefreshStats = async (campaignId: number) => {
    try {
      await apiClient.refreshEmailStats(campaignId);
      toast.success("Статистика обновлена");
      await handleViewStats(campaignId);
    } catch (error: any) {
      toast.error("Не удалось обновить статистику");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPerformanceBadge = (rate: number, type: 'open' | 'click') => {
    const threshold = type === 'open' ? { good: 40, medium: 20 } : { good: 30, medium: 15 };

    if (rate >= threshold.good) {
      return 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]';
    } else if (rate >= threshold.medium) {
      return 'bg-gray-400 text-white shadow-[0_0_20px_rgba(156,163,175,0.5)]';
    } else {
      return 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]';
    }
  };

  const filteredCampaigns = campaigns.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate overall stats
  const sentCampaigns = campaigns.filter(c => c.status === 'sent');
  const totalSent = sentCampaigns.reduce((acc, c) => acc + c.recipients_count, 0);
  const totalDelivered = sentCampaigns.reduce((acc, c) => acc + c.sent_count, 0);
  const totalOpened = sentCampaigns.reduce((acc, c) => acc + c.opened_count, 0);
  const totalClicked = sentCampaigns.reduce((acc, c) => acc + c.clicked_count, 0);

  const averageOpenRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : '0';
  const averageClickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0';

  // If showing compose view
  if (showingCompose) {
    return <AdminEmailCompose onBack={() => {
      setShowingCompose(false);
      loadCampaigns();
    }} />;
  }

  // If showing send passwords view
  if (showingSendPasswords) {
    return <AdminEmailSendPasswords onBack={() => setShowingSendPasswords(false)} />;
  }

  // If viewing detailed stats
  if (viewingCampaignStats) {
    const { campaign, stats } = viewingCampaignStats;

    return (
      <div className="space-y-8">
        <div>
          <Button
            variant="ghost"
            onClick={() => setViewingCampaignStats(null)}
            className="mb-4 -ml-2 hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Назад к списку рассылок
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="font-black text-5xl mb-3">{campaign.name}</h1>
              <div className="flex items-center gap-4 text-gray-500">
                {campaign.sent_at && (
                  <>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(campaign.sent_at)}</span>
                    </div>
                    <span>•</span>
                    <span>{formatTime(campaign.sent_at)}</span>
                    <span>•</span>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{campaign.recipients_count} получателей</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleRefreshStats(campaign.id)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Обновить статистику
            </Button>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Открываемость */}
          <Card className="p-8 border-2 bg-gray-50">
            <div className="flex items-center justify-between mb-6">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-gray-100">
                <MailOpen className="h-7 w-7 text-gray-400" />
              </div>
              <Badge className={`text-xl px-4 py-2 ${getPerformanceBadge(stats.open_rate, 'open')}`}>
                {stats.open_rate.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-gray-600 mb-2 text-lg">Открываемость</p>
            <p className="text-5xl font-black text-gray-900 mb-3">
              {stats.opened_count}
            </p>
            <p className="text-sm text-gray-500 pt-3 border-t border-gray-200">
              Из {stats.delivered_count} доставленных • Всего открытий: {stats.total_opens}
            </p>
          </Card>

          {/* Кликабельность */}
          <Card className="p-8 border-2 bg-gray-50">
            <div className="flex items-center justify-between mb-6">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-gray-100">
                <MousePointerClick className="h-7 w-7 text-gray-400" />
              </div>
              <Badge className={`text-xl px-4 py-2 ${getPerformanceBadge(stats.click_to_open_rate, 'click')}`}>
                {stats.click_to_open_rate.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-gray-600 mb-2 text-lg">Кликабельность</p>
            <p className="text-5xl font-black text-gray-900 mb-3">
              {stats.clicked_count}
            </p>
            <p className="text-sm text-gray-500 pt-3 border-t border-gray-200">
              Из {stats.opened_count} открытых • Всего кликов: {stats.total_clicks}
            </p>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Card className="p-8 border-2">
          <h3 className="font-black text-2xl mb-6">Детальная статистика</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Send className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-semibold">Отправлено</span>
              </div>
              <span className="text-2xl font-black">{stats.total_sent}</span>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <MailOpen className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-semibold">Доставлено</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black mr-3">{stats.delivered_count}</span>
                <Badge className="bg-green-100 text-green-700">
                  {stats.delivery_rate.toFixed(1)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="font-semibold">Открыто</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black mr-3">{stats.opened_count}</span>
                <Badge className="bg-yellow-100 text-yellow-700">
                  {stats.open_rate.toFixed(1)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <MousePointerClick className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-semibold">Переходов</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black mr-3">{stats.clicked_count}</span>
                <Badge className="bg-purple-100 text-purple-700">
                  {stats.click_rate.toFixed(1)}%
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-red-600" />
                </div>
                <span className="font-semibold">Ошибки доставки</span>
              </div>
              <span className="text-2xl font-black">{stats.failed_count}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-black text-5xl mb-2">Почта</h1>
          <p className="text-gray-500 text-lg">
            Управление рассылками и статистика • {campaigns.length}{" "}
            {campaigns.length === 1 ? "рассылка" : "рассылок"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowingSendPasswords(true)}
            size="lg"
            variant="outline"
            className="border-2 hover:bg-amber-50 hover:border-amber-400 transition-all"
          >
            <Key className="h-5 w-5 mr-2" />
            Отправить пароли
          </Button>
          <Button
            onClick={() => setShowingCompose(true)}
            size="lg"
            className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-5 w-5 mr-2" />
            Создать рассылку
          </Button>
        </div>
      </div>

      {/* Email Queue Status - Show if there are pending, processing or failed emails */}
      {queueStats && (queueStats.pending > 0 || queueStats.processing > 0 || queueStats.failed > 0) && (
        <Card className={`p-6 border-2 ${queueStats.failed > 0 ? 'border-red-300 bg-red-50' : queueStats.pending > 0 || queueStats.processing > 0 ? 'border-amber-300 bg-amber-50' : 'border-green-300 bg-green-50'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${queueStats.failed > 0 ? 'bg-red-100' : queueStats.pending > 0 || queueStats.processing > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
                {queueStats.failed > 0 ? (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                ) : queueStats.processing > 0 ? (
                  <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
                ) : queueStats.pending > 0 ? (
                  <Clock className="h-6 w-6 text-amber-600" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Очередь отправки писем</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  {queueStats.pending > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Ожидают: <strong>{queueStats.pending}</strong></span>
                    </div>
                  )}
                  {queueStats.processing > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      <span>Отправляются: <strong>{queueStats.processing}</strong></span>
                    </div>
                  )}
                  {queueStats.failed > 0 && (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>С ошибками: <strong className="text-red-600">{queueStats.failed}</strong></span>
                    </div>
                  )}
                  {queueStats.sent > 0 && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Отправлено: <strong>{queueStats.sent}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadQueueData}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Обновить
              </Button>
              {queueStats.failed > 0 && (
                <Button
                  variant={showFailedEmails ? "secondary" : "destructive"}
                  size="sm"
                  onClick={() => setShowFailedEmails(!showFailedEmails)}
                  className="gap-2"
                >
                  {showFailedEmails ? 'Скрыть ошибки' : 'Показать ошибки'}
                </Button>
              )}
            </div>
          </div>

          {/* Failed Emails List */}
          {showFailedEmails && failedEmails.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Письма с ошибками отправки
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {failedEmails.map((email) => (
                  <div key={email.id} className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{email.recipient_email}</span>
                          <Badge variant="outline" className="text-xs">
                            {email.email_type === 'initial_password' ? 'Пароль' : 
                             email.email_type === 'campaign' ? 'Рассылка' :
                             email.email_type === 'credential' ? 'Доступ' : email.email_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-2">{email.subject}</p>
                        {email.error_message && (
                          <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
                            <strong>Ошибка:</strong> {email.error_message}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>Попыток: {email.attempts}/{email.max_attempts}</span>
                          {email.last_attempt_at && (
                            <span>Последняя: {new Date(email.last_attempt_at).toLocaleString('ru-RU')}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetryEmail(email.id)}
                        disabled={retryingId === email.id}
                        className="gap-2 shrink-0"
                      >
                        {retryingId === email.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        Повторить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Overall Stats - Only show if there are sent campaigns */}
      {sentCampaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Средняя открываемость */}
          <Card className="p-8 border-2 bg-gray-50">
            <div className="flex items-center justify-between mb-6">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-gray-100">
                <MailOpen className="h-7 w-7 text-gray-400" />
              </div>
              <Badge className={`text-xl px-4 py-2 ${getPerformanceBadge(parseFloat(averageOpenRate), 'open')}`}>
                {averageOpenRate}%
              </Badge>
            </div>
            <p className="text-gray-600 mb-2 text-lg">Средняя открываемость</p>
            <p className="text-5xl font-black text-gray-900 mb-3">{totalOpened}</p>
            <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200">
              <span>Отправлено: {totalSent}</span>
              <span>Доставлено: {totalDelivered}</span>
            </div>
          </Card>

          {/* Средняя кликабельность */}
          <Card className="p-8 border-2 bg-gray-50">
            <div className="flex items-center justify-between mb-6">
              <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-gray-100">
                <MousePointerClick className="h-7 w-7 text-gray-400" />
              </div>
              <Badge className={`text-xl px-4 py-2 ${getPerformanceBadge(parseFloat(averageClickRate), 'click')}`}>
                {averageClickRate}%
              </Badge>
            </div>
            <p className="text-gray-600 mb-2 text-lg">Средняя кликабельность</p>
            <p className="text-5xl font-black text-gray-900 mb-3">{totalClicked}</p>
            <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200">
              <span>Открыто: {totalOpened}</span>
              <span>Рассылок: {sentCampaigns.length}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Поиск кампаний..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 bg-white/50 border-gray-300 focus:border-purple-400"
        />
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Загрузка...</div>
      ) : filteredCampaigns.length === 0 ? (
        <AdminEmptyState
          icon={<Mail className="h-10 w-10 text-gray-400" />}
          title="Email-кампании"
          description={searchQuery ? "Кампании не найдены" : "Нет созданных кампаний"}
          actionLabel="Создать кампанию"
          onAction={() => setShowingCompose(true)}
        />
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => {
            const openRate = campaign.sent_count > 0
              ? ((campaign.opened_count / campaign.sent_count) * 100).toFixed(0)
              : '0';
            const clickRate = campaign.opened_count > 0
              ? ((campaign.clicked_count / campaign.opened_count) * 100).toFixed(0)
              : '0';

            return (
              <Card
                key={campaign.id}
                className="p-6 border-2 hover:shadow-xl hover:border-purple-300 hover:bg-purple-50/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`${
                        campaign.status === 'sent' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'sending' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.status === 'sent' ? 'Отправлено' :
                         campaign.status === 'sending' ? 'Отправка' : 'Черновик'}
                      </Badge>
                      {campaign.sent_at && (
                        <span className="text-sm text-gray-500">
                          {formatDate(campaign.sent_at)} в {formatTime(campaign.sent_at)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-xl mb-2 truncate group-hover:text-purple-700 transition-colors">
                      {campaign.name}
                    </h3>
                    {campaign.subject && (
                      <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        {campaign.recipients_count} получателей
                      </span>
                    </div>
                  </div>

                  {campaign.status === 'sent' ? (
                    <div className="flex items-center gap-6">
                      {/* Delivery */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Send className="h-4 w-4 text-gray-500" />
                          <p className="text-sm text-gray-600">Доставлено</p>
                        </div>
                        <p className="text-2xl font-black">{campaign.sent_count}</p>
                      </div>

                      {/* Open Rate */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <MailOpen className="h-4 w-4 text-green-600" />
                          <p className="text-sm text-gray-600">Открыто</p>
                        </div>
                        <div className="flex items-baseline justify-center gap-1">
                          <p className="text-2xl font-black">{campaign.opened_count}</p>
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            {openRate}%
                          </Badge>
                        </div>
                      </div>

                      {/* Click Rate */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <MousePointerClick className="h-4 w-4 text-purple-600" />
                          <p className="text-sm text-gray-600">Переходов</p>
                        </div>
                        <div className="flex items-baseline justify-center gap-1">
                          <p className="text-2xl font-black">{campaign.clicked_count}</p>
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            {clickRate}%
                          </Badge>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <Button
                        onClick={() => handleViewStats(campaign.id)}
                        variant="ghost"
                        size="sm"
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-purple-500 transition-all p-0"
                      >
                        <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      {campaign.status === 'draft' && (
                        <Button
                          onClick={() => handleSend(campaign.id, false)}
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Отправить
                        </Button>
                      )}
                      <Button
                        onClick={() => setDeletingId(campaign.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isAdding || editingItem !== null} onOpenChange={(open: boolean) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Редактировать кампанию" : "Создать кампанию"}</DialogTitle>
            <DialogDescription>
              Заполните информацию о email-кампании
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <AdminFormField label="Название кампании" required>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="Например: Новостная рассылка №1"
              />
            </AdminFormField>

            <AdminFormField label="Тип рассылки" required>
              <Select
                value={campaignForm.type}
                onValueChange={(value: string) => setCampaignForm({ ...campaignForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">Новости</SelectItem>
                  <SelectItem value="marketing">Маркетинг</SelectItem>
                  <SelectItem value="transactional">Транзакционные</SelectItem>
                  <SelectItem value="credentials">Данные для входа</SelectItem>
                </SelectContent>
              </Select>
            </AdminFormField>

            <AdminFormField
              label="Template ID (из Notisend)"
            >
              <Input
                value={campaignForm.template_id}
                onChange={(e) => setCampaignForm({ ...campaignForm, template_id: e.target.value })}
                placeholder="template_12345"
              />
            </AdminFormField>

            {!campaignForm.template_id && (
              <>
                <AdminFormField label="Тема письма">
                  <Input
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    placeholder="Тема письма"
                  />
                </AdminFormField>

                <AdminFormField label="HTML контент">
                  <Textarea
                    value={campaignForm.html_content}
                    onChange={(e) => setCampaignForm({ ...campaignForm, html_content: e.target.value })}
                    placeholder="<h1>Привет!</h1><p>Контент письма...</p>"
                    rows={8}
                  />
                </AdminFormField>

                <AdminFormField label="Текстовый контент (опционально)">
                  <Textarea
                    value={campaignForm.text_content}
                    onChange={(e) => setCampaignForm({ ...campaignForm, text_content: e.target.value })}
                    placeholder="Текстовая версия письма"
                    rows={4}
                  />
                </AdminFormField>
              </>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={resetForm}>
              Отмена
            </Button>
            <Button onClick={editingItem ? handleUpdate : handleAdd} className="bg-purple-500 hover:bg-purple-600">
              {editingItem ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open: boolean) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить кампанию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Кампания и все связанные логи будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
