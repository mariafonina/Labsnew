import { useState } from "react";
import { MessageCircle, ThumbsUp, Send } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner@2.0.3";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";

interface EventQuestionsProps {
  eventId: string;
  eventTitle: string;
  eventType?: "event" | "instruction" | "recording" | "faq";
  open: boolean;
  onClose: () => void;
}

export function EventQuestions({ eventId, eventTitle, eventType = "event", open, onClose }: EventQuestionsProps) {
  const { addComment, getCommentsByEvent, toggleCommentLike, isLiked, auth } = useApp();
  const [newQuestion, setNewQuestion] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); // В реальном приложении это будет из auth

  // Get user gender for colors
  const gender = auth.isAuthenticated 
    ? (localStorage.getItem("userGender") as "male" | "female" | null)
    : null;

  const allComments = getCommentsByEvent(eventId);
  
  // Разделяем на основные вопросы и ответы
  const mainQuestions = allComments.filter(c => !c.parentId);
  const replies = allComments.filter(c => c.parentId);

  const getRepliesForComment = (commentId: string) => {
    return replies.filter(r => r.parentId === commentId);
  };

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) return;

    addComment({
      eventId,
      eventType: eventType,
      eventTitle: eventTitle,
      authorName: "Александр",
      authorRole: "user",
      content: newQuestion,
    }, eventTitle, eventType);

    setNewQuestion("");
    toast.success("Вопрос отправлен!");
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyText.trim()) return;

    addComment({
      eventId,
      eventType: "event",
      eventTitle: eventTitle,
      authorName: isAdmin ? "Администратор" : "Александр",
      authorRole: isAdmin ? "admin" : "user",
      content: replyText,
      parentId,
    }, eventTitle, "event");

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0 gap-0 bg-white">
        <DialogHeader className="p-6 pb-4 border-b border-gray-200">
          <div className="flex items-start justify-between pr-8">
            <div className="flex-1">
              <DialogTitle className="font-black text-2xl text-gray-900 mb-1">
                Вопросы к эфиру
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base mt-2">
                {eventTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto p-6 space-y-6" style={{ maxHeight: "calc(80vh - 200px)" }}>
          {/* Admin Toggle (для демонстрации) */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="admin-mode"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
              />
              <label htmlFor="admin-mode" className="text-sm text-gray-700 font-bold">
                Режим администратора (для демонстрации)
              </label>
            </div>
          </Card>

          {/* Questions List */}
          {mainQuestions.length === 0 ? (
            <Card className="p-12 text-center border-gray-200/60">
              <div className="max-w-sm mx-auto">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-extrabold text-xl text-gray-900 mb-2">
                  Пока нет вопросов
                </h3>
                <p className="text-gray-600">
                  Будьте первым, кто задаст вопрос к этому эфиру!
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {mainQuestions.map((question) => {
                const questionReplies = getRepliesForComment(question.id);
                const isReplying = replyingTo === question.id;

                return (
                  <Card key={question.id} id={`question-${question.id}`} className="p-5 border-gray-200/60 bg-white scroll-mt-24">
                    {/* Main Question */}
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className={`text-white text-sm font-extrabold ${
                          question.authorRole === "admin" 
                            ? "bg-gradient-to-br from-purple-400 to-indigo-400" 
                            : "bg-gradient-to-br from-pink-400 to-rose-400"
                        }`}>
                          {question.authorName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-extrabold text-gray-900">
                            {question.authorName}
                          </span>
                          {question.authorRole === "admin" && (
                            <Badge className="bg-gradient-to-r from-purple-400 to-indigo-400 text-white text-xs px-2 py-0.5">
                              Админ
                            </Badge>
                          )}
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
                            <ThumbsUp className={`h-4 w-4 ${isLiked(question.id) ? "fill-pink-500" : ""}`} />
                            {question.likes > 0 && <span className="font-bold">{question.likes}</span>}
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

                          {questionReplies.length > 0 && (
                            <span className="text-sm text-gray-500 ml-2">
                              {questionReplies.length} {questionReplies.length === 1 ? "ответ" : "ответа"}
                            </span>
                          )}
                        </div>

                        {/* Reply Form */}
                        {isReplying && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Напишите ответ..."
                              className="mb-3 resize-none border-gray-300 focus:border-pink-400 focus:ring-pink-400"
                              rows={3}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText("");
                                }}
                              >
                                Отмена
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSubmitReply(question.id)}
                                className={`${gender === "male" ? "bg-gradient-to-r from-lime-400 to-green-400 hover:from-lime-500 hover:to-green-500 hover:shadow-[0_0_20px_rgba(132,204,22,0.6)]" : "bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 hover:shadow-[0_0_20px_rgba(251,113,133,0.6)]"} text-white font-extrabold transition-all duration-200`}
                                disabled={!replyText.trim()}
                              >
                                <Send className="h-4 w-4 mr-1.5" />
                                Отправить
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Replies */}
                        {questionReplies.length > 0 && (
                          <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200">
                            {questionReplies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarFallback className={`text-white text-xs font-extrabold ${
                                    reply.authorRole === "admin" 
                                      ? "bg-gradient-to-br from-purple-400 to-indigo-400" 
                                      : "bg-gradient-to-br from-pink-400 to-rose-400"
                                  }`}>
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
                                    <ThumbsUp className={`h-3.5 w-3.5 ${isLiked(reply.id) ? "fill-pink-500" : ""}`} />
                                    {reply.likes > 0 && <span className="text-xs font-bold">{reply.likes}</span>}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* New Question Form */}
        <div className="p-6 pt-4 border-t border-gray-200 bg-gray-50">
          <h4 className="font-extrabold text-gray-900 mb-3">Задать вопрос</h4>
          <Textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Напишите свой вопрос к эфиру..."
            className="mb-3 resize-none border-gray-300 focus:border-pink-400 focus:ring-pink-400 bg-white"
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitQuestion}
              className={`${gender === "male" ? "bg-gradient-to-r from-lime-400 to-green-400 hover:from-lime-500 hover:to-green-500 hover:shadow-[0_0_30px_rgba(132,204,22,0.7)]" : "bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 hover:shadow-[0_0_30px_rgba(251,113,133,0.7)]"} text-white font-extrabold h-12 px-6 transition-all duration-200`}
              disabled={!newQuestion.trim()}
            >
              <Send className="h-5 w-5 mr-2" />
              Отправить вопрос
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}