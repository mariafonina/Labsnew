import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ArrowLeft, KeyRound, AlertTriangle, Package, Send, X } from "lucide-react";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";

export function AdminInitialPasswordsManager() {
  const [sending, setSending] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [selectedCohortIds, setSelectedCohortIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadCohorts(parseInt(selectedProductId));
    } else {
      setCohorts([]);
      setSelectedCohortIds(new Set());
    }
  }, [selectedProductId]);

  const loadProducts = async () => {
    try {
      const data = await apiClient.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadCohorts = async (productId: number) => {
    try {
      const data = await apiClient.getCohorts(productId);
      setCohorts(data);
    } catch (error) {
      console.error('Failed to load cohorts:', error);
    }
  };

  const toggleCohort = (cohortId: number) => {
    setSelectedCohortIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cohortId)) {
        newSet.delete(cohortId);
      } else {
        newSet.add(cohortId);
      }
      return newSet;
    });
  };

  const handleSendInitialPasswords = async () => {
    if (!selectedProductId || selectedCohortIds.size === 0) {
      toast.error("Выберите продукт и хотя бы один поток");
      return;
    }

    if (!confirm('Вы уверены что хотите отправить первичные пароли выбранным потокам?')) {
      return;
    }

    setSending(true);

    try {
      // TODO: Update API to support product and cohort selection
      const response = await apiClient.sendInitialPasswords();
      toast.success(response.message || 'Пароли отправлены');
    } catch (error: any) {
      console.error('Failed to send initial passwords:', error);
      toast.error(error.message || 'Ошибка при отправке писем');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <button className="flex items-center gap-2 text-sm font-medium text-neutral-950 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Назад к списку рассылок
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[14px] bg-amber-100 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-amber-600" />
          </div>
          <div className="px-3 py-1 rounded-lg bg-[#fef3c6] border border-amber-200">
            <span className="text-xs font-medium text-[#bb4d00]">Массовая отправка паролей</span>
          </div>
        </div>
        <h1 className="font-black text-[48px] leading-[48px] tracking-[0.3516px] text-neutral-950">
          Отправить первичные пароли
        </h1>
        <p className="text-[18px] leading-[28px] tracking-[-0.4395px] text-[#6a7282]">
          Выберите продукт и потоки для отправки первичных паролей ученикам
        </p>
      </div>

      <Card className="p-[26px] border-2 border-[#fee685] bg-amber-50 rounded-[14px]">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-[10px] bg-[#fef3c6] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-[18px] leading-[28px] tracking-[-0.4395px] text-[#7b3306] mb-1">
              Важно
            </h3>
            <p className="text-[16px] leading-6 tracking-[-0.3125px] text-[#973c00]">
              Отправка первичных паролей предназначена для новых учеников. Убедитесь, что выбрали правильные потоки. Письма будут отправлены всем ученикам выбранных потоков.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-[34px] border-2 border-[rgba(0,0,0,0.1)] rounded-[14px] flex flex-col gap-14">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="font-black text-[30px] leading-9 tracking-[0.3955px] text-neutral-950 mb-2">
            Параметры отправки
          </h2>
          <p className="text-[16px] leading-6 tracking-[-0.3125px] text-[#6a7282]">
            Выберите продукт и потоки
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-base font-semibold leading-6 tracking-[-0.3125px] text-neutral-950">
              Продукт <span className="text-[#f6339a]">*</span>
            </label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="h-12 border-2 rounded-[14px]">
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

          {selectedProductId && cohorts.length > 0 && (
            <div className="space-y-3">
              {cohorts.map((cohort) => (
                <Card
                  key={cohort.id}
                  className={`p-[18px] border-2 rounded-[14px] cursor-pointer transition-colors ${
                    selectedCohortIds.has(cohort.id)
                      ? 'border-pink-400 bg-pink-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => toggleCohort(cohort.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-[18px] leading-7 tracking-[-0.4395px] text-neutral-950">
                        {cohort.name}
                      </h3>
                      <p className="text-sm leading-5 tracking-[-0.1504px] text-[#6a7282]">
                        {cohort.start_date && cohort.end_date
                          ? `${new Date(cohort.start_date).toLocaleDateString('ru-RU')} - ${new Date(cohort.end_date).toLocaleDateString('ru-RU')}`
                          : 'Даты не указаны'}
                      </p>
                    </div>
                    <Checkbox
                      checked={selectedCohortIds.has(cohort.id)}
                      onCheckedChange={() => toggleCohort(cohort.id)}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSendInitialPasswords}
              disabled={sending || !selectedProductId || selectedCohortIds.size === 0}
              className="flex-1 h-12 bg-gradient-to-r from-[#ad46ff] to-[#615fff] hover:opacity-90 text-white rounded-lg"
            >
              <Send className="w-4 h-4 mr-2" />
              Отправить пароли
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 border border-[rgba(0,0,0,0.1)] rounded-lg"
            >
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
