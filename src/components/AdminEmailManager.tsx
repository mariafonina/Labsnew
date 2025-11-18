import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Plus, Send, Trash2, Mail, Search, Eye, Pencil } from "lucide-react";
import { AdminFormField } from "./AdminFormField";
import { AdminEmptyState } from "./AdminEmptyState";
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
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

interface EmailLog {
  id: number;
  campaign_id: number;
  recipient_email: string;
  status: string;
  notisend_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export function AdminEmailManager() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<EmailCampaign | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingCampaign, setViewingCampaign] = useState<{ campaign: EmailCampaign; logs: EmailLog[] } | null>(null);

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
      loadCampaigns();
    } catch (error: any) {
      toast.error(error.message || "Не удалось отправить кампанию");
      console.error("Failed to send campaign:", error);
    }
  };

  const handleViewDetails = async (campaignId: number) => {
    try {
      const details = await apiClient.getEmailCampaignDetails(campaignId);
      setViewingCampaign(details);
    } catch (error: any) {
      toast.error("Не удалось загрузить детали кампании");
      console.error("Failed to load campaign details:", error);
    }
  };

  const startEdit = (item: EmailCampaign) => {
    setEditingItem(item);
    setCampaignForm({
      name: item.name,
      type: item.type,
      subject: item.subject || "",
      html_content: item.html_content || "",
      text_content: item.text_content || "",
      template_id: item.template_id || "",
    });
    setIsAdding(false);
  };

  const filteredCampaigns = campaigns.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Поиск кампаний..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-white border-2 border-gray-200 focus:border-pink-400 rounded-lg h-12"
          />
        </div>

        <Button
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-[#fb64b6] to-[#ff637e] hover:opacity-90 text-white gap-2 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] rounded-lg h-12 px-6"
        >
          <Plus className="w-5 h-5" />
          Создать кампанию
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-labs-text-secondary">Загрузка...</div>
      ) : filteredCampaigns.length === 0 ? (
        <AdminEmptyState
          icon={<Mail className="h-10 w-10 text-gray-400" />}
          title="Email-кампании"
          description={searchQuery ? "Кампании не найдены" : "Нет созданных кампаний"}
          actionLabel="Создать кампанию"
          onAction={() => setIsAdding(true)}
        />
      ) : (
        <div className="grid gap-6">
          {filteredCampaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="p-6 border-2 border-[rgba(0,0,0,0.1)] rounded-[14px] hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-pink-500" />
                    <h3 className="text-lg font-semibold text-neutral-950">{campaign.name}</h3>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      campaign.status === 'sent' ? 'bg-green-100 text-green-700' :
                      campaign.status === 'sending' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {campaign.status === 'sent' ? 'Отправлено' : 
                       campaign.status === 'sending' ? 'Отправка' : 'Черновик'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-[#6a7282]">Тип:</span>
                      <span className="ml-2 text-neutral-950 font-medium">{campaign.type}</span>
                    </div>
                    <div>
                      <span className="text-[#6a7282]">Получателей:</span>
                      <span className="ml-2 text-neutral-950 font-medium">{campaign.recipients_count}</span>
                    </div>
                    <div>
                      <span className="text-[#6a7282]">Отправлено:</span>
                      <span className="ml-2 text-green-600 font-medium">{campaign.sent_count}</span>
                    </div>
                    <div>
                      <span className="text-[#6a7282]">Ошибок:</span>
                      <span className="ml-2 text-red-600 font-medium">{campaign.failed_count}</span>
                    </div>
                  </div>

                  {campaign.subject && (
                    <div className="text-sm">
                      <span className="text-[#6a7282]">Тема:</span>
                      <span className="ml-2 text-neutral-950">{campaign.subject}</span>
                    </div>
                  )}

                  {campaign.template_id && (
                    <div className="text-sm">
                      <span className="text-[#6a7282]">Template ID:</span>
                      <span className="ml-2 text-pink-500 font-mono">{campaign.template_id}</span>
                    </div>
                  )}
                </div>

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
                    onClick={() => startEdit(campaign)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => handleViewDetails(campaign.id)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Детали
                  </Button>

                  <Button
                    onClick={() => setDeletingId(campaign.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAdding || editingItem !== null} onOpenChange={(open: boolean) => !open && resetForm()}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-0">
          <div className="p-[34px] space-y-8">
            <DialogHeader className="pb-0">
              <DialogTitle className="text-[48px] leading-[48px] tracking-[0.3516px] font-black text-neutral-950">
                {editingItem ? "Редактировать кампанию" : "Создать кампанию"}
              </DialogTitle>
              <DialogDescription className="text-[18px] leading-[28px] tracking-[-0.4395px] text-[#6a7282] mt-2">
                {editingItem ? "Измените информацию о email-кампании" : "Заполните информацию о email-кампании"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              <AdminFormField label="Название кампании" required>
                <Input
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="Например: Новостная рассылка №1"
                  className="h-14 border-2 rounded-lg"
                />
              </AdminFormField>

              <AdminFormField label="Тип рассылки" required>
                <Select
                  value={campaignForm.type}
                  onValueChange={(value: string) => setCampaignForm({ ...campaignForm, type: value })}
                >
                  <SelectTrigger className="h-14 border-2 rounded-lg">
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
                helpText="Если указан, письмо будет отправлено по шаблону из Notisend"
              >
                <Input
                  value={campaignForm.template_id}
                  onChange={(e) => setCampaignForm({ ...campaignForm, template_id: e.target.value })}
                  placeholder="template_12345"
                  className="h-14 border-2 rounded-lg"
                />
              </AdminFormField>

              {!campaignForm.template_id && (
                <>
                  <AdminFormField label="Тема письма" required>
                    <Input
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                      placeholder="Введите тему письма"
                      className="h-14 border-2 rounded-lg bg-[#f3f3f5] border-transparent"
                    />
                  </AdminFormField>

                  <AdminFormField label="HTML контент" required>
                    <Textarea
                      value={campaignForm.html_content}
                      onChange={(e) => setCampaignForm({ ...campaignForm, html_content: e.target.value })}
                      placeholder="Введите текст письма..."
                      rows={12}
                      className="border-2 rounded-lg bg-[#f3f3f5] border-transparent min-h-[300px]"
                    />
                    <p className="text-sm text-[#6a7282] mt-2">
                      💡 Вы можете использовать HTML для форматирования текста
                    </p>
                  </AdminFormField>

                  <AdminFormField label="Текстовый контент (опционально)">
                    <Textarea
                      value={campaignForm.text_content}
                      onChange={(e) => setCampaignForm({ ...campaignForm, text_content: e.target.value })}
                      placeholder="Текстовая версия письма"
                      rows={4}
                      className="border-2 rounded-lg bg-[#f3f3f5] border-transparent"
                    />
                  </AdminFormField>
                </>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="flex-1 h-12 border-2 border-[rgba(0,0,0,0.1)] rounded-lg"
              >
                Отмена
              </Button>
              <Button 
                onClick={editingItem ? handleUpdate : handleAdd} 
                className="flex-1 h-12 bg-gradient-to-r from-[#fb64b6] to-[#ff637e] hover:opacity-90 text-white rounded-lg shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
              >
                {editingItem ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewingCampaign !== null} onOpenChange={(open: boolean) => !open && setViewingCampaign(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали кампании: {viewingCampaign?.campaign.name}</DialogTitle>
          </DialogHeader>

          {viewingCampaign && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-labs-text-secondary">Всего</div>
                  <div className="text-2xl font-bold">{viewingCampaign.campaign.recipients_count}</div>
                </div>
                <div>
                  <div className="text-sm text-labs-text-secondary">Отправлено</div>
                  <div className="text-2xl font-bold text-green-600">{viewingCampaign.campaign.sent_count}</div>
                </div>
                <div>
                  <div className="text-sm text-labs-text-secondary">Ошибок</div>
                  <div className="text-2xl font-bold text-red-600">{viewingCampaign.campaign.failed_count}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Логи отправки</h4>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {viewingCampaign.logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded border ${
                        log.status === 'sent' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{log.recipient_email}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.status === 'sent' ? 'Отправлено' : 'Ошибка'}
                        </span>
                      </div>
                      {log.error_message && (
                        <div className="text-xs text-red-600 mt-1">{log.error_message}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
