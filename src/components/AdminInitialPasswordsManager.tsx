import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Mail, Users, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "../api/client";
import { toast } from "sonner";

export function AdminInitialPasswordsManager() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    sent: number;
    failed: number;
    total: number;
    message: string;
  } | null>(null);

  const handleSendInitialPasswords = async () => {
    if (!confirm('Вы уверены что хотите отправить ссылки на создание пароля всем пользователям? Это отправит email на все адреса в базе данных.')) {
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await apiClient.sendInitialPasswords();
      setResult(response);
      toast.success(response.message);
    } catch (error: any) {
      console.error('Failed to send initial passwords:', error);
      toast.error(error.message || 'Ошибка при отправке писем');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-pink-500" />
          <CardTitle>Рассылка ссылок для создания паролей</CardTitle>
        </div>
        <CardDescription>
          Отправить email со ссылками на создание паролей всем пользователям в базе данных.
          Каждый пользователь получит персональную ссылку действительную в течение 7 дней.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <h4 className="font-semibold text-sm">Результаты рассылки</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-gray-500">Всего</div>
                  <div className="font-bold text-lg">{result.total}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-gray-500">В очереди</div>
                  <div className="font-bold text-lg text-green-600">{result.queued}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-amber-500" />
                <div>
                  <div className="text-gray-500">Пропущено</div>
                  <div className="font-bold text-lg text-amber-600">{result.skipped}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSendInitialPasswords}
            disabled={sending}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Отправка писем...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Отправить ссылки всем пользователям
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Отправка выполняется последовательно для каждого пользователя.
            Это может занять несколько минут.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
