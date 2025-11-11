import { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { migrateLocalStorageToPostgreSQL, isMigrationNeeded, type MigrationResult } from '../utils/migrate-storage';

export function MigrationBanner() {
  const [isVisible, setIsVisible] = useState(isMigrationNeeded());
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  if (!isVisible) {
    return null;
  }

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateLocalStorageToPostgreSQL();
      setMigrationResult(result);
      
      if (result.success) {
        // Auto-hide banner after 5 seconds if successful
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }
    } catch (err: any) {
      setMigrationResult({
        success: false,
        favoritesCount: 0,
        notesCount: 0,
        commentsCount: 0,
        errors: [err.message],
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDismiss = () => {
    if (window.confirm('Вы уверены? Ваши данные из браузера не будут перенесены в базу данных.')) {
      localStorage.setItem('data_migrated', 'dismissed');
      setIsVisible(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start gap-4">
          {!migrationResult && (
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          {migrationResult?.success && (
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
          )}
          {migrationResult && !migrationResult.success && (
            <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          
          <div className="flex-1">
            {!migrationResult && (
              <>
                <h3 className="text-sm font-medium text-amber-900">
                  Миграция данных
                </h3>
                <p className="mt-1 text-sm text-amber-700">
                  У вас есть данные в браузере (избранное, заметки, комментарии), которые нужно перенести в базу данных. 
                  Это позволит синхронизировать ваши данные между устройствами.
                </p>
              </>
            )}
            
            {migrationResult?.success && (
              <>
                <h3 className="text-sm font-medium text-green-900">
                  Миграция завершена успешно!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Перенесено: {migrationResult.favoritesCount} избранных, {migrationResult.notesCount} заметок, {migrationResult.commentsCount} комментариев.
                </p>
              </>
            )}
            
            {migrationResult && !migrationResult.success && (
              <>
                <h3 className="text-sm font-medium text-red-900">
                  Ошибка миграции
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  <p>Не удалось перенести некоторые данные:</p>
                  <ul className="list-disc list-inside mt-1">
                    {migrationResult.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            {!migrationResult && (
              <>
                <button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isMigrating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isMigrating ? 'Миграция...' : 'Перенести данные'}
                </button>
                <button
                  onClick={handleDismiss}
                  disabled={isMigrating}
                  className="px-4 py-2 bg-white text-amber-900 text-sm font-medium rounded-lg border border-amber-300 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Отклонить
                </button>
              </>
            )}
            
            {migrationResult && (
              <button
                onClick={() => setIsVisible(false)}
                className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Закрыть
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
