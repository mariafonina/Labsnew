import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { CheckCircle2, XCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "../api/client";

interface BatchProgressTrackerProps {
  batchId: string;
  totalEmails: number;
  onComplete?: () => void;
}

interface BatchStatus {
  batch_id: string;
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  progress_percent: number;
}

export function BatchProgressTracker({
  batchId,
  totalEmails,
  onComplete,
}: BatchProgressTrackerProps) {
  const [status, setStatus] = useState<BatchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) return;

    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const batchStatus = await apiClient.getBatchStatus(batchId);
        setStatus(batchStatus);

        // Check if completed
        const completed = batchStatus.sent + batchStatus.failed;
        if (completed >= batchStatus.total && onComplete) {
          clearInterval(intervalId);
          setTimeout(() => onComplete(), 2000); // Delay before callback
        }
      } catch (err: any) {
        console.error("Failed to fetch batch status:", err);
        setError(err.message || "Не удалось загрузить статус");
        clearInterval(intervalId);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 2 seconds
    intervalId = setInterval(fetchStatus, 2000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [batchId, onComplete]);

  if (error) {
    return (
      <Card className="p-6 border-2 border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="p-6 border-2 border-gray-200">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <p className="text-gray-600">Загрузка статуса...</p>
        </div>
      </Card>
    );
  }

  const isComplete = status.sent + status.failed >= status.total;

  return (
    <Card className="p-6 border-2 border-purple-200 bg-purple-50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            )}
            <div>
              <h3 className="font-black text-lg text-purple-900">
                {isComplete ? "Отправка завершена" : "Отправка писем..."}
              </h3>
              <p className="text-sm text-purple-700">
                {status.sent + status.failed} из {status.total} обработано
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-purple-900">
              {status.progress_percent}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={status.progress_percent} className="h-3" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">В очереди</p>
              <p className="font-bold text-gray-700">{status.pending}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            <div>
              <p className="text-xs text-gray-500">Обработка</p>
              <p className="font-bold text-blue-700">{status.processing}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Отправлено</p>
              <p className="font-bold text-green-700">{status.sent}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Ошибки</p>
              <p className="font-bold text-red-700">{status.failed}</p>
            </div>
          </div>
        </div>

        {/* Completion message */}
        {isComplete && (
          <div className="pt-2 border-t border-purple-200">
            <p className="text-sm text-purple-700">
              {status.failed > 0
                ? `Отправка завершена с ${status.failed} ошибками`
                : "Все письма успешно отправлены!"}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
