import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, Clock, Video, Bookmark, Eye } from "lucide-react";
import { EventQuestions } from "./EventQuestions";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";
import { apiClient } from "../api/client";

export function EventsCalendar() {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const { events, addToFavorites, removeFromFavorites, isFavorite, auth } = useApp();

  // Get user gender for colors
  const gender = auth.isAuthenticated
    ? (localStorage.getItem("userGender") as "male" | "female" | null)
    : null;

  // Check if location is a URL
  const isUrl = (str: string | undefined) => {
    if (!str) return false;
    return str.startsWith('http://') || str.startsWith('https://');
  };

  const handleToggleFavorite = (event: any) => {
    if (isFavorite(event.id)) {
      removeFromFavorites(event.id);
      toast.success("Удалено из избранного");
    } else {
      addToFavorites({
        id: event.id,
        type: "event",
        title: event.title,
        description: event.description,
        date: event.date,
        addedAt: new Date().toISOString(),
      });
      toast.success("Добавлено в избранное");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long"
      });
    } catch {
      return dateStr;
    }
  };


  // Группируем события по дате
  const now = new Date();
  const upcomingEvents = events.filter(e => {
    try {
      const eventDate = new Date(e.date);
      return eventDate >= now;
    } catch {
      return true; // если ошибка парсинга - показываем как upcoming
    }
  });
  const pastEvents = events.filter(e => {
    try {
      const eventDate = new Date(e.date);
      return eventDate < now;
    } catch {
      return false;
    }
  });

  return (
    <>
      <div className="space-y-6">
        {upcomingEvents.length > 0 && (
          <div className="space-y-4">
            {upcomingEvents.map((event) => {
              return (
                <Card
                  key={event.id}
                  className="p-5 border-gray-200/60 bg-white/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col gap-4">
                    {/* Дата и время - наверху */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-pink-600" />
                          <span className="text-gray-900 font-semibold">{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-pink-600" />
                          <span className="text-gray-900 font-semibold">{event.time}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(event)}
                        className={isFavorite(event.id) ? "text-pink-500" : "text-gray-400"}
                      >
                        <Bookmark className={`h-5 w-5 ${isFavorite(event.id) ? "fill-pink-500" : ""}`} />
                      </Button>
                    </div>
                    
                    {/* Заголовок */}
                    <h3 className="text-gray-900 font-bold text-2xl">
                      {event.title}
                    </h3>
                    
                    {/* Location - показываем "Онлайн" если это ссылка, иначе адрес */}
                    {event.location && (
                      <p className="text-gray-600 text-sm">
                        📍 {isUrl(event.location) ? 'Онлайн' : event.location}
                      </p>
                    )}

                    {/* Кнопка подключиться - показываем если location это ссылка */}
                    <div className="flex gap-3">
                      {isUrl(event.location) && (
                        <Button
                          onClick={async () => {
                            if (auth.isAuthenticated) {
                              try {
                                await apiClient.recordEventView(parseInt(event.id));
                              } catch (error) {
                                console.error('Failed to record event view:', error);
                              }
                            }
                            window.open(event.location, "_blank");
                          }}
                          className={`flex-1 ${gender === "male" ? "bg-gradient-to-r from-lime-400 to-green-400 hover:from-lime-500 hover:to-green-500 hover:shadow-[0_0_30px_rgba(132,204,22,0.7)]" : "bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 hover:shadow-[0_0_30px_rgba(251,113,133,0.7)]"} text-white border-0 font-extrabold h-12 px-6 shadow-lg transition-all duration-200`}
                        >
                          <Video className="h-5 w-5 mr-2" />
                          Подключиться
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {pastEvents.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-black text-2xl text-gray-500">Прошедшие события</h2>
            {pastEvents.map((event) => (
              <Card
                key={event.id}
                className="p-5 border-gray-200/60 bg-white/40 backdrop-blur-sm opacity-75"
              >
                <div className="flex flex-col gap-3">
                  <h3 className="text-gray-700 font-black text-xl">
                    {event.title}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{event.view_count ?? 0} просмотров</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {upcomingEvents.length === 0 && pastEvents.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg">
              Пока нет запланированных событий
            </p>
          </Card>
        )}
      </div>

      {/* Questions Dialog */}
      {selectedEvent && (
        <EventQuestions
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}