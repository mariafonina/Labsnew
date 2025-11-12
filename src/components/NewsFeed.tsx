import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { Heart, Bookmark, MessageCircle, ArrowRight, Bell } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { apiClient } from "../api/client";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  date: string;
  category: string;
  image?: string;
  isNew: boolean;
}

interface NewsFeedProps {
  onNavigateToQuestion?: (eventId: string, eventType: "event" | "instruction" | "recording", questionId: string) => void;
}

export function NewsFeed({ onNavigateToQuestion }: NewsFeedProps) {
  const { addToFavorites, removeFromFavorites, isFavorite, toggleLike, isLiked, notifications, markNotificationAsRead } = useApp();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [animatingLike, setAnimatingLike] = useState<string | null>(null);
  const [animatingFavorite, setAnimatingFavorite] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const data = await apiClient.getNews();
      setNewsItems(data.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        content: item.content,
        author: item.author,
        authorAvatar: item.author_avatar,
        date: item.date,
        category: item.category,
        image: item.image,
        isNew: item.is_new
      })));
    } catch (error) {
      console.error('Failed to load news:', error);
      toast.error('Не удалось загрузить новости');
    }
  };
  
  const handleToggleFavorite = (item: NewsItem) => {
    setAnimatingFavorite(item.id);
    setTimeout(() => setAnimatingFavorite(null), 600);
    
    if (isFavorite(item.id)) {
      removeFromFavorites(item.id);
      toast.success("Удалено из избранного", {
        duration: 2000,
      });
    } else {
      addToFavorites({
        id: item.id,
        type: "news",
        title: item.title,
        description: item.content,
        date: item.date,
        addedAt: new Date().toISOString(),
      });
      toast.success("✨ Добавлено в избранное", {
        duration: 2000,
      });
    }
  };

  const handleToggleLike = (id: string) => {
    setAnimatingLike(id);
    setTimeout(() => setAnimatingLike(null), 600);
    toggleLike(id);
    
    if (!isLiked(id)) {
      toast.success("❤️ Понравилось", {
        duration: 1500,
      });
    }
  };

  const handleViewAnswer = (notificationId: string, eventId: string, eventType: "event" | "instruction" | "recording", questionId: string) => {
    markNotificationAsRead(notificationId);
    if (onNavigateToQuestion) {
      onNavigateToQuestion(eventId, eventType, questionId);
    }
  };

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "только что";
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays === 1) return "вчера";
    if (diffDays < 7) return `${diffDays} дня назад`;
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  // Показываем уведомления первыми
  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {unreadNotifications.map((notification) => (
        <Card
          key={notification.id}
          className="overflow-hidden hover:shadow-lg transition-all duration-300 border-pink-300 bg-gradient-to-r from-pink-50/80 to-rose-50/80 backdrop-blur-sm"
        >
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500">
                    <Bell className="h-3 w-3 mr-1" />
                    Новое уведомление
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatNotificationDate(notification.createdAt)}
                  </span>
                </div>
                
                <h3 className="mb-2 text-gray-900 font-bold text-xl">
                  На ваш вопрос ответили
                </h3>
                
                <p className="text-gray-600 mb-2">
                  <span className="font-semibold">{notification.answerAuthor}</span> ответил на ваш вопрос в материале <span className="font-semibold">"{notification.eventTitle}"</span>
                </p>
                
                <div className="bg-white/80 rounded-lg p-3 mb-4 border border-gray-200">
                  <p className="text-gray-700 text-sm italic">
                    "{notification.answerPreview}{notification.answerPreview.length >= 100 ? "..." : ""}"
                  </p>
                </div>

                <Button
                  onClick={() => handleViewAnswer(
                    notification.id,
                    notification.eventId,
                    notification.eventType,
                    notification.questionId
                  )}
                  className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Посмотреть ответ
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Regular News */}
      {newsItems.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Card
            className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-gray-200/60 bg-white/60 backdrop-blur-sm group"
          >
            <div className="p-6">
              {/* Текст — главное */}
              <p className="text-gray-900 leading-relaxed mb-6 text-lg">{item.content}</p>
              
              {/* Фото */}
              {item.image && (
                <div className="relative aspect-video overflow-hidden rounded-xl mb-4">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              )}
              
              {/* Метаинформация */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200/60">
                <div className="flex items-center gap-1">
                  <motion.div
                    animate={animatingLike === item.id ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, -10, 10, -10, 0]
                    } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleLike(item.id)}
                      className={`hover:bg-pink-50 hover:scale-110 transition-all duration-200 active:scale-95 h-11 w-11 ${
                        isLiked(item.id) ? "text-pink-500" : "text-gray-400"
                      }`}
                    >
                      <Heart
                        className={`h-6 w-6 transition-all duration-200 ${
                          isLiked(item.id) ? "fill-pink-500" : ""
                        }`}
                      />
                    </Button>
                  </motion.div>
                  <motion.div
                    animate={animatingFavorite === item.id ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, -15, 15, -15, 0]
                    } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFavorite(item)}
                      className={`hover:bg-pink-50 hover:scale-110 transition-all duration-200 active:scale-95 h-11 w-11 ${
                        isFavorite(item.id) ? "text-pink-500" : "text-gray-400"
                      }`}
                    >
                      <Bookmark
                        className={`h-6 w-6 transition-all duration-200 ${
                          isFavorite(item.id) ? "fill-pink-500" : ""
                        }`}
                      />
                    </Button>
                  </motion.div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{item.date}</span>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all hover:scale-105">
                    {item.category}
                  </Badge>
                  {item.isNew && (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge className="bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500">
                        Новое
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}