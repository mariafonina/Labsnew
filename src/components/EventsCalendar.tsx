import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Calendar, Clock, Video, MessageCircle, Bookmark } from "lucide-react";
import { EventQuestions } from "./EventQuestions";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";

export function EventsCalendar() {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const { getCommentsByEvent, events, addToFavorites, removeFromFavorites, isFavorite, auth } = useApp();

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

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
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
                    
                    {/* Спикер */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-400 text-white text-xs font-extrabold">
                          {getInitials(event.instructor)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-gray-700 font-semibold text-sm">
                        {event.instructor}
                      </span>
                    </div>
                    
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