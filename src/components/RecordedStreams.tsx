import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Play, Clock, Bookmark, Eye } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useApp, type Recording } from "../contexts/AppContext";
import { toast } from "sonner";
import { RecordingDetail } from "./RecordingDetail";

interface RecordedStreamsProps {
  selectedItemId?: string | null;
}

export function RecordedStreams({ selectedItemId }: RecordedStreamsProps) {
  const navigate = useNavigate();
  const { recordings, addToFavorites, removeFromFavorites, isFavorite } = useApp();
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  // Auto-select recording from URL parameter
  useEffect(() => {
    if (selectedItemId) {
      const recording = recordings.find(r => String(r.id) === selectedItemId);
      if (recording) {
        setSelectedRecording(recording);
      }
    } else {
      // Clear selection when no ID in URL
      setSelectedRecording(null);
    }
  }, [selectedItemId, recordings]);

  const handleToggleFavorite = (recording: Recording, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite(recording.id)) {
      removeFromFavorites(recording.id);
      toast.success("Удалено из избранного");
    } else {
      addToFavorites({
        id: recording.id,
        type: "recording",
        title: recording.title,
        description: recording.description,
        date: recording.date,
        addedAt: new Date().toISOString(),
      });
      toast.success("Добавлено в избранное");
    }
  };

  // If a recording is selected, show detail view
  if (selectedRecording) {
    return (
      <RecordingDetail
        recording={selectedRecording}
        onBack={() => navigate('/recordings')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {recordings.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 text-lg">
            Пока нет доступных записей
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recordings.map((recording) => {
            return (
            <Card
              key={recording.id}
              className="overflow-hidden border-gray-200/60 bg-white/60 backdrop-blur-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/recordings/${recording.id}`)}
            >
              {recording.thumbnail && (
                <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  <ImageWithFallback
                    src={recording.thumbnail}
                    alt={recording.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Градиент для лучшей видимости кнопки */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Центральная розовая кнопка Play */}
                  {recording.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full h-20 w-20 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:from-pink-500 group-hover:to-rose-500 transition-all duration-300">
                        <Play className="h-10 w-10 ml-1 fill-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Оверлей при наведении */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-2">
                      {recording.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {recording.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: React.MouseEvent) => handleToggleFavorite(recording, e)}
                    className={isFavorite(recording.id) ? "text-pink-500" : "text-gray-400"}
                  >
                    <Bookmark
                      className={`h-5 w-5 ${
                        isFavorite(recording.id) ? "fill-pink-500" : ""
                      }`}
                    />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                  {recording.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{recording.duration}</span>
                    </div>
                  )}
                  {(recording.view_count !== undefined && parseInt(String(recording.view_count)) > 0) && (
                    <>
                      {recording.duration && <span>•</span>}
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{recording.view_count} просмотров</span>
                      </div>
                    </>
                  )}
                </div>

                {recording.instructor && (
                  <div className="mb-4">
                    <Badge className="bg-gradient-to-r from-pink-100 to-rose-100 text-pink-600">
                      {recording.instructor}
                    </Badge>
                  </div>
                )}

                <div className="flex gap-2">
                  {recording.videoUrl && (
                    <Button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        window.open(recording.videoUrl, "_blank");
                      }}
                      className="flex-1 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 font-extrabold"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Смотреть запись
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
          })}
        </div>
      )}
    </div>
  );
}