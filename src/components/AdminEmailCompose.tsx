import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ArrowLeft, Mail, Send, Users, Package, Waves } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../api/client";

type EmailSegment = "all" | "product" | "cohort";

type AdminEmailComposeProps = {
  onBack: () => void;
};

interface Product {
  id: number;
  name: string;
}

interface Cohort {
  id: number;
  name: string;
  product_id: number;
}

export function AdminEmailCompose({ onBack }: AdminEmailComposeProps) {
  const [segment, setSegment] = useState<EmailSegment>("all");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [recipientCount, setRecipientCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);

  useEffect(() => {
    loadProducts();
    loadCohorts();
    updateRecipientCount();
  }, []);

  useEffect(() => {
    updateRecipientCount();
  }, [segment, selectedProduct, selectedCohort]);

  const loadProducts = async () => {
    try {
      const data = await apiClient.getProducts();
      setProducts(data);
    } catch (error: any) {
      console.error("Failed to load products:", error);
      toast.error("Не удалось загрузить продукты");
    }
  };

  const loadCohorts = async () => {
    try {
      const data = await apiClient.getCohorts();
      setCohorts(data);
    } catch (error: any) {
      console.error("Failed to load cohorts:", error);
      toast.error("Не удалось загрузить потоки");
    }
  };

  const updateRecipientCount = async () => {
    try {
      setLoading(true);
      const data = await apiClient.previewEmailSegment({
        segment_type: segment,
        segment_product_id: segment === 'product' && selectedProduct !== null ? selectedProduct : undefined,
        segment_cohort_id: segment === 'cohort' && selectedCohort !== null ? selectedCohort : undefined,
      });
      setRecipientCount(data.recipient_count);
    } catch (error: any) {
      console.error("Failed to preview segment:", error);
      setRecipientCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Filter cohorts by selected product
  const availableCohorts = selectedProduct
    ? cohorts.filter((c) => c.product_id === selectedProduct)
    : cohorts;

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error("Введите тему письма");
      return;
    }

    if (!message.trim()) {
      toast.error("Введите текст письма");
      return;
    }

    if (segment === "product" && !selectedProduct) {
      toast.error("Выберите продукт");
      return;
    }

    if (segment === "cohort" && !selectedCohort) {
      toast.error("Выберите поток");
      return;
    }

    if (recipientCount === 0) {
      toast.error("Нет получателей для отправки");
      return;
    }

    try {
      setSending(true);

      // Build HTML content with optional image
      let htmlContent = "";
      if (imageUrl) {
        htmlContent += `<div style="text-align: center; margin-bottom: 20px;"><img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto;" /></div>`;
      }
      htmlContent += message.replace(/\n/g, '<br>');

      // Create campaign
      const campaign = await apiClient.createEmailCampaign({
        name: `${subject} - ${new Date().toLocaleDateString('ru-RU')}`,
        type: 'news',
        subject,
        html_content: htmlContent,
        text_content: message,
        template_id: null,
      });

      // Update campaign with segment info
      await apiClient.updateEmailCampaign(campaign.id, {
        segment_type: segment,
        segment_product_id: segment === 'product' ? selectedProduct : null,
        segment_cohort_id: segment === 'cohort' ? selectedCohort : null,
      });

      // Send campaign
      const result = await apiClient.sendEmailCampaign(campaign.id, false);

      toast.success(`Письмо отправлено! Успешно: ${result.sent}, Ошибок: ${result.failed}`);
      onBack();
    } catch (error: any) {
      toast.error(error.message || "Не удалось отправить письмо");
      console.error("Failed to send email:", error);
    } finally {
      setSending(false);
    }
  };

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
          Назад к рассылкам
        </Button>

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center shadow-lg">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="font-black text-5xl">Отправить письмо</h1>
            <p className="text-gray-500 text-lg mt-1">
              Выберите сегмент и отправьте рассылку пользователям
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <Card className="p-8 border-2 shadow-lg">
        <div className="space-y-8">
          {/* Segment Selection */}
          <div>
            <Label className="text-xl mb-4 block font-bold">
              Выберите получателей
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setSegment("all");
                  setSelectedProduct(null);
                  setSelectedCohort(null);
                }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  segment === "all"
                    ? "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-400 shadow-lg"
                    : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                }`}
              >
                <Users
                  className={`h-10 w-10 mx-auto mb-3 ${
                    segment === "all" ? "text-purple-600" : "text-gray-400"
                  }`}
                />
                <p className="font-bold text-lg mb-1">Все пользователи</p>
                <p className="text-sm text-gray-600">Отправить всем</p>
              </button>

              <button
                onClick={() => {
                  setSegment("product");
                  setSelectedCohort(null);
                }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  segment === "product"
                    ? "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-400 shadow-lg"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <Package
                  className={`h-10 w-10 mx-auto mb-3 ${
                    segment === "product" ? "text-blue-600" : "text-gray-400"
                  }`}
                />
                <p className="font-bold text-lg mb-1">По продукту</p>
                <p className="text-sm text-gray-600">Выбрать продукт</p>
              </button>

              <button
                onClick={() => setSegment("cohort")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  segment === "cohort"
                    ? "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-400 shadow-lg"
                    : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                }`}
              >
                <Waves
                  className={`h-10 w-10 mx-auto mb-3 ${
                    segment === "cohort" ? "text-pink-600" : "text-gray-400"
                  }`}
                />
                <p className="font-bold text-lg mb-1">По потоку</p>
                <p className="text-sm text-gray-600">Выбрать поток</p>
              </button>
            </div>
          </div>

          {/* Product Selection */}
          {segment === "product" && (
            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <Label className="text-lg mb-3 block font-bold">
                Выберите продукт
              </Label>
              <Select
                value={selectedProduct?.toString()}
                onValueChange={(value: string) => setSelectedProduct(parseInt(value))}
              >
                <SelectTrigger className="h-12 text-base bg-white">
                  <SelectValue placeholder="Выберите продукт" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Cohort Selection */}
          {segment === "cohort" && (
            <div className="bg-pink-50 rounded-xl p-6 border-2 border-pink-200">
              <Label className="text-lg mb-3 block font-bold">
                Выберите поток
              </Label>
              {segment === "cohort" && !selectedProduct && (
                <div className="mb-4">
                  <Label className="text-sm mb-2 block">Сначала выберите продукт (опционально)</Label>
                  <Select
                    value={selectedProduct?.toString() || "all"}
                    onValueChange={(value: string) => setSelectedProduct(value === "all" ? null : parseInt(value))}
                  >
                    <SelectTrigger className="h-12 text-base bg-white">
                      <SelectValue placeholder="Все продукты" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все продукты</SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Select
                value={selectedCohort?.toString() || ""}
                onValueChange={(value: string) => setSelectedCohort(parseInt(value))}
              >
                <SelectTrigger className="h-12 text-base bg-white">
                  <SelectValue placeholder="Выберите поток" />
                </SelectTrigger>
                <SelectContent>
                  {availableCohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id.toString()}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recipients Count */}
          {!loading && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-purple-600" />
                  <span className="font-bold text-gray-700">
                    Количество получателей:
                  </span>
                </div>
                <Badge className="bg-purple-500 text-white text-lg px-4 py-2">
                  {recipientCount} чел.
                </Badge>
              </div>
            </div>
          )}

          {/* Subject */}
          <div>
            <Label className="text-lg mb-3 block font-bold">
              Тема письма *
            </Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Введите тему письма"
              className="h-14 text-base"
            />
          </div>

          {/* Preheader */}
          <div>
            <Label className="text-lg mb-3 block font-bold">
              Предварительный заголовок (прехедер)
            </Label>
            <Input
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              placeholder="Краткое описание для превью письма"
              className="h-14 text-base"
            />
            <p className="text-sm text-gray-500 mt-2">
              📱 Отображается в почтовом клиенте рядом с темой письма. Оптимально: 40-50 символов
            </p>
          </div>

          {/* Image URL */}
          <div>
            <Label className="text-lg mb-3 block font-bold">
              URL изображения
            </Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="h-14 text-base"
            />
            <p className="text-sm text-gray-500 mt-2">
              🖼️ Изображение будет вставлено в начало письма
            </p>
            {imageUrl && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <p className="text-sm text-gray-600 mb-2 font-semibold">Превью изображения:</p>
                <img
                  src={imageUrl}
                  alt="Превью"
                  className="max-w-full h-auto rounded-lg border border-gray-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const errorMsg = e.currentTarget.nextElementSibling as HTMLElement;
                    if (errorMsg) errorMsg.style.display = 'block';
                  }}
                />
                <p className="text-sm text-red-500 mt-2 hidden">
                  ⚠️ Не удалось загрузить изображение. Проверьте URL.
                </p>
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <Label className="text-lg mb-3 block font-bold">
              Текст письма *
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите текст письма..."
              className="min-h-[300px] text-base resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              💡 Вы можете использовать HTML для форматирования текста
            </p>
          </div>

          {/* Email Preview */}
          {(subject || preheader || message) && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
              <Label className="text-lg mb-4 block font-bold">
                📧 Превью письма
              </Label>
              <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
                {/* Email Header Preview */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Как увидят получатели:</p>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900">{subject || "Тема письма"}</p>
                    {preheader && (
                      <p className="text-sm text-gray-600">{preheader}</p>
                    )}
                  </div>
                </div>

                {/* Email Body Preview */}
                <div>
                  <p className="text-xs text-gray-500 mb-3">Содержание письма:</p>
                  {imageUrl && (
                    <div className="mb-4">
                      <img
                        src={imageUrl}
                        alt="Превью изображения в письме"
                        className="max-w-full h-auto rounded border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {message && (
                    <div
                      className="text-sm text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, '<br>') }}
                    />
                  )}
                  {!message && (
                    <p className="text-sm text-gray-400 italic">Текст письма появится здесь...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
            <Button
              onClick={handleSend}
              size="lg"
              disabled={recipientCount === 0 || sending}
              className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 shadow-lg hover:shadow-xl transition-all px-8"
            >
              <Send className="h-5 w-5 mr-2" />
              {sending ? "Отправка..." : "Отправить письмо"}
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              className="px-8 border-2"
              disabled={sending}
            >
              Отмена
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
