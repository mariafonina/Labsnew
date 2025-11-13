import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  MessageCircle,
  ThumbsUp,
  Send,
  Calendar,
  BookOpen,
  Video,
  HelpCircle,
  Search,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";

export function AdminQuestions() {
  const { comments, addComment, toggleCommentLike, isLiked, auth, events, instructions, recordings } = useApp();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Получаем все вопросы от пользователей (без ответов от админа)
  const allQuestions = comments.filter((c) => !c.parentId && c.authorRole === "user");

  // Фильтруем вопросы
  const filteredQuestions = allQuestions.filter((question) => {
    const matchesSearch = 
      question.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (question.eventTitle && question.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === "all" || question.eventType === filterType;

    const hasReplies = comments.some((c) => c.parentId === question.id);
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "answered" && hasReplies) ||
      (filterStatus === "unanswered" && !hasReplies);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Сортируем: сначала неотвеченные, потом по дате
  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    const aHasReplies = comments.some((c) => c.parentId === a.id);
    const bHasReplies = comments.some((c) => c.parentId === b.id);
    
    if (!aHasReplies && bHasReplies) return -1;
    if (aHasReplies && !bHasReplies) return 1;
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getRepliesForQuestion = (questionId: string) => {
    return comments.filter((c) => c.parentId === questionId);
  };

  const handleSubmitReply = (question: any) => {
    if (!replyText.trim()) return;

    addComment(
      {
        eventId: question.eventId,
        eventType: question.eventType,
        eventTitle: question.eventTitle,
        authorName: auth.email || "Администратор",
        authorRole: "admin",
        content: replyText,
        parentId: question.id,
      },
      question.eventTitle,
      question.eventType
    );

    setReplyText("");
    setReplyingTo(null);
    toast.success("Ответ отправлен!");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "только что";
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "event":
        return Calendar;
      case "instruction":
        return BookOpen;
      case "recording":
        return Video;
      case "faq":
        return HelpCircle;
      default:
        return MessageCircle;
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case "event":
        return "Событие";
      case "instruction":
        return "Инструкция";
      case "recording":
        return "Запись";
      case "faq":
        return "FAQ";
      default:
        return "Общий вопрос";
    }
  };

  const unansweredCount = allQuestions.filter(
    (q) => !comments.some((c) => c.parentId === q.id)
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-black text-5xl mb-2">Вопросы пользователей</h1>
        <p className="text-gray-500 text-lg">
          Всего вопросов: <span className="font-bold">{allQuestions.length}</span>
          {unansweredCount > 0 && (
            <span className="ml-3 text-pink-500 font-bold">
              • Требуют ответа: {unansweredCount}
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6 shadow-md border-2">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по вопросам, авторам, материалам..."
              className="pl-12 h-12 text-base"
            />
          </div>
          <div className="flex gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px] h-12 text-base">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Все типы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="event">События</SelectItem>
                <SelectItem value="instruction">Инструкции</SelectItem>
                <SelectItem value="recording">Записи</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px] h-12 text-base">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="unanswered">Без ответа</SelectItem>
                <SelectItem value="answered">С ответом</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Questions List */}
      {sortedQuestions.length === 0 ? (
        <Card className="p-16 text-center border-2 border-dashed border-gray-300">
          <div className="max-w-sm mx-auto">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <MessageCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="font-black text-2xl text-gray-900 mb-2">
              {searchQuery || filterType !== "all" || filterStatus !== "all"
                ? "Вопросы не найдены"
                : "Пока нет вопросов"}
            </h3>
            <p className="text-gray-500 text-base">
              {searchQuery || filterType !== "all" || filterStatus !== "all"
                ? "Попробуйте изменить параметры поиска"
                : "Вопросы пользователей появятся здесь"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {sortedQuestions.map((question) => {
            const replies = getRepliesForQuestion(question.id);
            const isReplying = replyingTo === question.id;
            const hasReplies = replies.length > 0;
            const TypeIcon = getTypeIcon(question.eventType);

            return (
              <Card key={question.id} className={`p-7 shadow-md hover:shadow-lg transition-shadow ${!hasReplies ? "border-l-4 border-l-pink-400" : "border"}`}>
                {/* Question Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700">
                      <TypeIcon className="h-3 w-3 mr-1" />
                      {getTypeLabel(question.eventType)}
                    </Badge>
                    {!hasReplies && (
                      <Badge className="bg-gradient-to-r from-pink-400 to-rose-400 text-white">
                        Требует ответа
                      </Badge>
                    )}
                  </div>
                </div>

                {question.eventTitle && (
                  <p className="text-sm text-gray-600 mb-3">
                    Материал: <span className="font-bold">{question.eventTitle}</span>
                  </p>
                )}

                {/* Main Question */}
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-400 text-white font-extrabold">
                      {question.authorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-extrabold text-gray-900">
                        {question.authorName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(question.createdAt)}
                      </span>
                    </div>

                    <p className="text-gray-800 leading-relaxed mb-3">
                      {question.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCommentLike(question.id)}
                        className={`h-8 gap-1.5 ${
                          isLiked(question.id)
                            ? "text-pink-500 hover:text-pink-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <ThumbsUp
                          className={`h-4 w-4 ${isLiked(question.id) ? "fill-pink-500" : ""}`}
                        />
                        {question.likes > 0 && (
                          <span className="font-bold">{question.likes}</span>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(isReplying ? null : question.id)}
                        className="h-8 gap-1.5 text-gray-500 hover:text-gray-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Ответить
                      </Button>

                      {replies.length > 0 && (
                        <span className="text-sm text-gray-500 ml-2">
                          {replies.length} {replies.length === 1 ? "ответ" : "ответа"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reply Form */}
                {isReplying && (
                  <div className="ml-14 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 mb-4">
                    <Label className="text-base font-semibold mb-3 block">Ваш ответ</Label>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Напишите ответ пользователю..."
                      className="mb-4 resize-none border-gray-300 focus:border-pink-400 focus:ring-pink-400 text-base bg-white"
                      rows={5}
                      autoFocus
                    />
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                      >
                        Отмена
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleSubmitReply(question)}
                        className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white px-6 shadow-md"
                        disabled={!replyText.trim()}
                      >
                        <Send className="h-5 w-5 mr-2" />
                        Отправить ответ
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="ml-14 space-y-3 border-l-2 border-gray-200 pl-4">
                    {replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback
                            className={`text-white text-xs font-extrabold ${
                              reply.authorRole === "admin"
                                ? "bg-gradient-to-br from-purple-400 to-indigo-400"
                                : "bg-gradient-to-br from-pink-400 to-rose-400"
                            }`}
                          >
                            {reply.authorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900 text-sm">
                              {reply.authorName}
                            </span>
                            {reply.authorRole === "admin" && (
                              <Badge className="bg-gradient-to-r from-purple-400 to-indigo-400 text-white text-xs px-2 py-0.5">
                                Админ
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {reply.content}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCommentLike(reply.id)}
                            className={`h-7 gap-1.5 mt-1 ${
                              isLiked(reply.id)
                                ? "text-pink-500 hover:text-pink-600"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <ThumbsUp
                              className={`h-3.5 w-3.5 ${
                                isLiked(reply.id) ? "fill-pink-500" : ""
                              }`}
                            />
                            {reply.likes > 0 && (
                              <span className="text-xs font-bold">{reply.likes}</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
