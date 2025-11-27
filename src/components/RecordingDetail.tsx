import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ArrowLeft, Bookmark, ThumbsUp, Send, Download } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";
import { LoomEmbed } from "./LoomEmbed";
import type { Recording } from "../contexts/AppContext";
import { validateAndNormalizeLoomUrl } from "../utils/loom-validator";
import { apiClient } from "../api/client";

interface RecordingDetailProps {
  recording: Recording;
  onBack: () => void;
}

export function RecordingDetail({ recording, onBack }: RecordingDetailProps) {
  const { 
    addToFavorites, 
    removeFromFavorites, 
    isFavorite,
    addComment,
    getCommentsByEvent,
    toggleCommentLike,
    isLiked,
    addNote,
    auth
  } = useApp();

  const [questionText, setQuestionText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const comments = getCommentsByEvent(recording.id);
  const questions = comments.filter(c => !c.parentId);

  // Записываем просмотр записи при открытии страницы
  useEffect(() => {
    const recordView = async () => {
      if (auth.isAuthenticated) {
        try {
          await apiClient.recordRecordingView(parseInt(recording.id));
        } catch (error) {
          console.error('Failed to record view:', error);
        }
      }
    };
    recordView();
  }, [recording.id, auth.isAuthenticated]);

  const handleToggleFavorite = () => {
    if (isFavorite(recording.id)) {
      removeFromFavorites(recording.id);
      toast.success("«Удалено из избранного»");
    } else {
      addToFavorites({
        id: recording.id,
        type: "recording",
        title: recording.title,
        description: recording.description,
        date: recording.date,
        addedAt: new Date().toISOString(),
      });
      toast.success("«Добавлено в избранное»");
    }
  };

  const handleSubmitQuestion = async () => {
    if (!questionText.trim()) {
      toast.error("«Введите текст вопроса»");
      return;
    }

    try {
      await addComment({
        eventId: String(recording.id),
        authorName: "Александр",
        authorRole: "user",
        content: questionText,
      }, recording.title, "recording");

      toast.success("«Вопрос отправлен»");
      setQuestionText("");
    } catch (error) {
      toast.error("«Не удалось отправить вопрос»");
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim()) {
      toast.error("«Введите текст ответа»");
      return;
    }

    try {
      await addComment({
        eventId: String(recording.id),
        parentId,
        authorName: auth.isAdmin ? "Анна Смирнова" : "Александр",
        authorRole: auth.isAdmin ? "admin" : "user",
        content: replyText,
      }, recording.title, "recording");

      toast.success("«Ответ отправлен»");
      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      toast.error("«Не удалось отправить ответ»");
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      toast.error("«Введите текст заметки»");
      return;
    }

    try {
      await addNote({
        title: `Заметка к: ${recording.title}`,
        content: noteText,
        linkedItem: {
          id: String(recording.id),
          type: "recording",
          title: recording.title,
        description: recording.description,
        date: recording.date,
        addedAt: new Date().toISOString(),
      },
      });

      toast.success("«Заметка сохранена»");
      setNoteText("");
    } catch (error) {
      toast.error("«Не удалось сохранить заметку»");
    }
  };

  const handleDownloadSummary = () => {
    // В реальном приложении здесь была бы загрузка файла
    toast.success("«Конспект скачивается...»");
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return "«только что»";
      } else if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);
        return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} назад`;
      } else if (diffInHours < 48) {
        return "«вчера»";
      } else {
        return date.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long"
        });
      }
    } catch {
      return dateStr;
    }
  };

  const normalizedLoomUrl = recording.loom_embed_url 
    ? validateAndNormalizeLoomUrl(recording.loom_embed_url)
    : recording.videoUrl 
      ? validateAndNormalizeLoomUrl(recording.videoUrl)
      : null;

  const hasLoomVideo = !!normalizedLoomUrl;
  const hasRegularVideo = recording.videoUrl && !normalizedLoomUrl;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2 text-gray-700 hover:text-gray-900 hover:scale-105 transition-transform"
        >
          <ArrowLeft className="h-5 w-5" />
          Назад к списку
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleFavorite}
          className={`hover:scale-110 transition-all ${isFavorite(recording.id) ? "text-pink-500" : "text-gray-400"}`}
        >
          <Bookmark className={`h-6 w-6 ${isFavorite(recording.id) ? "fill-pink-500" : ""}`} />
        </Button>
      </div>

      {/* Title */}
      <h1 className="font-black text-4xl text-gray-900 mb-4">{recording.title}</h1>
      
      {/* Meta Info */}
      <div className="flex flex-wrap gap-4 text-gray-600 mb-8">
        {recording.date && (
          <span className="text-lg">{new Date(recording.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</span>
        )}
        {recording.duration && (
          <>
            <span>•</span>
            <span className="text-lg">{recording.duration}</span>
          </>
        )}
        {recording.instructor && (
          <>
            <span>•</span>
            <span className="text-lg font-semibold">{recording.instructor}</span>
          </>
        )}
      </div>

      {/* Loom Video Embed */}
      {hasLoomVideo && normalizedLoomUrl && (
        <div className="mb-10">
          <LoomEmbed url={normalizedLoomUrl} />
        </div>
      )}

      {/* Regular Video */}
      {hasRegularVideo && (
        <div className="mb-10">
          <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-100">
            <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={recording.videoUrl}
                frameBorder="0"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Download Button */}
      <div className="mb-10">
        <Button
          onClick={handleDownloadSummary}
          className="bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500 font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all h-12 px-8"
        >
          <Download className="h-5 w-5 mr-2" />
          Скачать конспект
        </Button>
      </div>

      {/* Description */}
      {recording.description && (
        <div className="mb-10">
          <Card className="p-8 md:p-10 bg-white/80 backdrop-blur-sm border-gray-200/60 shadow-lg">
            <p className="text-gray-700 text-lg leading-relaxed">{recording.description}</p>
          </Card>
        </div>
      )}

      {/* Questions Section */}
      <div className="mb-10">
        <h2 className="font-black text-3xl text-gray-900 mb-6">Задать вопрос</h2>
        
        <Card className="p-6 mb-6 bg-gradient-to-br from-pink-50/80 to-rose-50/80 border-2 border-pink-200/60 backdrop-blur-sm shadow-lg">
          <Textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="«Ваш вопрос к эфиру...»"
            className="mb-4 min-h-[100px] bg-white border-gray-200 focus:border-pink-300 focus:ring-pink-300"
          />
          <Button
            onClick={handleSubmitQuestion}
            className="bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500 font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all h-12 px-6"
          >
            <Send className="h-4 w-4 mr-2" />
            Отправить вопрос
          </Button>
        </Card>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card className="p-12 text-center bg-white/60 backdrop-blur-sm border-gray-200/60">
              <p className="text-gray-500 text-lg">Вопросов пока нет. Будьте первым!</p>
            </Card>
          ) : (
            questions.map((question) => {
              const replies = comments.filter((c) => c.parentId === question.id);

              return (
                <Card key={question.id} className="p-6 bg-white/80 backdrop-blur-sm border-gray-200/60 shadow-md hover:shadow-lg transition-all">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-400 text-white font-black">
                        {getInitials(question.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-black text-gray-900">{question.authorName}</span>
                        <span className="text-sm text-gray-500">{formatDate(question.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 mb-3 leading-relaxed">{question.content}</p>
                      
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCommentLike(question.id)}
                          className={`gap-2 hover:scale-105 transition-all ${isLiked(question.id) ? 'text-pink-500' : 'text-gray-500'}`}
                        >
                          <ThumbsUp className={`h-4 w-4 ${isLiked(question.id) ? 'fill-pink-500' : ''}`} />
                          {question.likes > 0 && question.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(replyingTo === question.id ? null : question.id)}
                          className="text-pink-500 hover:text-pink-600 hover:scale-105 transition-all"
                        >
                          Ответить
                        </Button>
                      </div>

                      {/* Reply Form */}
                      {replyingTo === question.id && (
                        <div className="mt-4 pl-4 border-l-4 border-pink-300">
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="«Ваш ответ...»"
                            className="mb-3 min-h-[80px] border-gray-200 focus:border-pink-300 focus:ring-pink-300"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSubmitReply(question.id)}
                              className="bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500 font-black hover:scale-105 active:scale-95 transition-all"
                              size="sm"
                            >
                              <Send className="h-3 w-3 mr-2" />
                              Отправить
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                              className="hover:scale-105 transition-all"
                            >
                              Отмена
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {replies.length > 0 && (
                        <div className="mt-4 space-y-4 pl-4 border-l-4 border-pink-200">
                          {replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-400 text-white text-xs font-black">
                                  {getInitials(reply.authorName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-black text-sm text-gray-900">{reply.authorName}</span>
                                  {reply.authorRole === "admin" && (
                                    <span className="text-xs bg-gradient-to-r from-pink-400 to-rose-400 text-white px-2 py-0.5 rounded-full font-black">
                                      Преподаватель
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Note Section */}
      <div className="mb-8">
        <h2 className="font-black text-3xl text-gray-900 mb-6">Сохранить заметку</h2>
        <Card className="p-8 bg-white border-2 border-gray-200 shadow-2xl">
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Создайте заметку к этому эфиру. Она будет сохранена в вашем разделе «Заметки».
          </p>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="«Ваши мысли, выводы, важные моменты...»"
            className="mb-6 min-h-[140px] bg-white border-gray-300 placeholder:text-gray-400 focus:border-gray-900 focus:ring-gray-900"
          />
          <Button
            onClick={handleSaveNote}
            className="bg-black text-white hover:bg-gray-800 font-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all h-12 px-8"
          >
            Сохранить заметку
          </Button>
        </Card>
      </div>
    </div>
  );
}