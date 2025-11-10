import { useApp } from "../contexts/AppContext";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Bookmark,
  Trash2,
  Calendar,
  BookOpen,
  Video,
  Newspaper,
  FileText,
} from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

export function Favorites() {
  const { favorites, removeFromFavorites } = useApp();
  const [filter, setFilter] = useState<string>("all");
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const typeIcons = {
    news: Newspaper,
    instruction: BookOpen,
    recording: Video,
    event: Calendar,
  };

  const typeLabels = {
    news: "Новость",
    instruction: "Инструкция",
    recording: "Запись",
    event: "Эфир",
  };

  const filteredFavorites =
    filter === "all"
      ? favorites
      : favorites.filter((item) => item.type === filter);

  const handleDelete = (id: string) => {
    removeFromFavorites(id);
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card className="p-6 border-gray-200/60 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-700">Фильтр:</span>
          <Badge
            variant={filter === "all" ? "default" : "secondary"}
            className={`cursor-pointer transition-all ${
              filter === "all"
                ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setFilter("all")}
          >
            Все ({favorites.length})
          </Badge>
          <Badge
            variant={filter === "news" ? "default" : "secondary"}
            className={`cursor-pointer transition-all ${
              filter === "news"
                ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setFilter("news")}
          >
            Новости ({favorites.filter((f) => f.type === "news").length})
          </Badge>
          <Badge
            variant={filter === "instruction" ? "default" : "secondary"}
            className={`cursor-pointer transition-all ${
              filter === "instruction"
                ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setFilter("instruction")}
          >
            Инструкции (
            {favorites.filter((f) => f.type === "instruction").length})
          </Badge>
          <Badge
            variant={filter === "recording" ? "default" : "secondary"}
            className={`cursor-pointer transition-all ${
              filter === "recording"
                ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setFilter("recording")}
          >
            Записи ({favorites.filter((f) => f.type === "recording").length})
          </Badge>
          <Badge
            variant={filter === "event" ? "default" : "secondary"}
            className={`cursor-pointer transition-all ${
              filter === "event"
                ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setFilter("event")}
          >
            Эфиры ({favorites.filter((f) => f.type === "event").length})
          </Badge>
        </div>
      </Card>

      {/* Favorites List */}
      {filteredFavorites.length > 0 ? (
        <div className="grid gap-4">
          {filteredFavorites.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <Card
                key={item.id}
                className="p-6 border-gray-200/60 bg-white/60 backdrop-blur-sm hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-pink-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <Badge
                          variant="secondary"
                          className="mb-2 bg-pink-100 text-pink-600 font-semibold"
                        >
                          {typeLabels[item.type]}
                        </Badge>
                        <h3 className="font-black text-2xl text-gray-900 mb-2 break-words">
                          {item.title}
                        </h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 hover:bg-red-50 hover:text-red-500"
                        onClick={() => setItemToDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {item.description && (
                      <p className="text-gray-600 mb-3 break-words">{item.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {item.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {item.date}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Bookmark className="h-4 w-4 fill-pink-400 text-pink-400" />
                        Добавлено:{" "}
                        {new Date(item.addedAt).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 border-gray-200/60 bg-white/60 backdrop-blur-sm text-center">
          <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="font-black text-2xl text-gray-900 mb-2">
            {filter === "all"
              ? "У вас пока нет избранного"
              : "Нет элементов этого типа"}
          </p>
          <p className="text-gray-600">
            {filter === "all"
              ? "Отмечайте важные материалы закладкой, чтобы быстро найти их здесь"
              : "Попробуйте выбрать другой фильтр"}
          </p>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={itemToDelete !== null}
        onOpenChange={() => setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-2xl">
              Удалить из избранного?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Этот элемент будет удалён из вашего списка избранного. Это действие
              нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && handleDelete(itemToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}