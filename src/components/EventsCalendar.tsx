import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, Clock, Video, Bookmark } from "lucide-react";
import { EventQuestions } from "./EventQuestions";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";
import { apiClient } from "../api/client";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  type?: string;
  instructor?: string;
  link?: string;
}

export function EventsCalendar() {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const { getCommentsByEvent, addToFavorites, removeFromFavorites, isFavorite, auth } = useApp();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await apiClient.getEvents();
      setEvents(data.map((item: any) => {
        const eventDate = new Date(item.event_date);
        const now = new Date();
        return {
          id: String(item.id),
          title: item.title,
          description: item.description || '',
          date: item.event_date,
          time: item.event_time || '',
          location: item.location || '',
          type: eventDate >= now ? 'upcoming' : 'past',
          instructor: '', // Not available in DB
          link: '' // Not available in DB
        };
      }));
    } catch (error) {
      console.error('Failed to load events:', error);
      toast.error('Не удалось загрузить события');
    }
  };

  // Get user gender for colors
  const gender = auth.isAuthenticated 
    ? (localStorage.getItem("userGender") as "male" | "female" | null)
    : null;

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


  // Группируем события по типу
  const upcomingEvents = events.filter(e => e.type === "upcoming");
  const pastEvents = events.filter(e => e.type === "past");

  return (
    <>
      <div className="space-y-6">
        {upcomingEvents.length > 0 && (
          <div className="space-y-4">
            {upcomingEvents.map((event) => {
              const questionsCount = getCommentsByEvent(event.id).filter(c => !c.parentId).length;

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
                    
                    {/* Location */}
                    {event.location && (
                      <p className="text-gray-600 text-sm">
                        📍 {event.location}
                      </p>
                    )}
                    
                    {/* Кнопка подключиться */}
                    <div className="flex gap-3">
                      {event.link && (
                        <Button
                          onClick={() => window.open(event.link, "_blank")}
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