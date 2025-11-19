import { useState } from "react";
import { useApp, Note } from "../contexts/AppContext";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
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
import {
  FileText,
  Plus,
  Trash2,
  Link as LinkIcon,
  X,
  Bookmark,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface NotesProps {
  onNavigateToItem?: (type: string) => void;
}

export function Notes({ onNavigateToItem }: NotesProps) {
  const { notes, addNote, updateNote, deleteNote, addToFavorites, isFavorite, removeFromFavorites } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [fullText, setFullText] = useState("");
  const [animatingFavorite, setAnimatingFavorite] = useState<string | null>(null);

  // Извлекаем title из первой строки, content из остального
  const extractTitleAndContent = (text: string) => {
    const lines = text.split('\n');
    const title = lines[0]?.trim() || "Новая заметка";
    const content = lines.slice(1).join('\n').trim();
    return { title, content: content || lines[0] }; // Если нет второй строки, используем первую как контент
  };

  // Форматирование даты с "Сегодня/Вчера/Позавчера"
  const formatNoteDate = (dateString: string) => {
    const noteDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const noteDateMidnight = new Date(noteDate);
    noteDateMidnight.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - noteDateMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Сегодня";
    if (diffDays === 1) return "Вчера";
    if (diffDays === 2) return "Позавчера";
    
    return noteDate.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: noteDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  const handleCreateNote = () => {
    if (!fullText.trim()) return;
    const { title, content } = extractTitleAndContent(fullText);
    addNote({ title, content });
    setFullText("");
    setIsCreating(false);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !fullText.trim()) return;
    const { title, content } = extractTitleAndContent(fullText);
    updateNote(editingNote.id, { title, content });
    setEditingNote(null);
    setFullText("");
  };

  const handleEditClick = (note: Note) => {
    setEditingNote(note);
    // Объединяем title и content обратно в один текст
    setFullText(note.title + '\n' + note.content);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingNote(null);
    setFullText("");
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    setNoteToDelete(null);
  };

  const toggleNoteFavorite = (note: Note) => {
    setAnimatingFavorite(note.id);
    if (isFavorite(note.id)) {
      removeFromFavorites(note.id);
    } else {
      addToFavorites({
        id: note.id,
        type: "instruction",
        title: note.title,
        description: note.content,
        addedAt: new Date().toISOString(),
      });
    }
    setTimeout(() => setAnimatingFavorite(null), 300);
  };

  const handleNavigateToLinkedItem = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    if (note.linkedItem && onNavigateToItem) {
      onNavigateToItem(note.linkedItem.type);
      toast.success(`Переход к: ${note.linkedItem.title}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {(isCreating || editingNote) && (
        <Card className="p-6 border-gray-200/60 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-black text-2xl text-gray-900">
                {editingNote ? "Редактировать заметку" : "Новая заметка"}
              </h3>
              <p className="text-sm font-semibold text-gray-500 mt-1">
                Первая строка станет заголовком
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Textarea
                value={fullText}
                onChange={(e) => setFullText(e.target.value)}
                placeholder="Название заметки&#10;Основной текст начинается здесь..."
                className="min-h-[280px] border-gray-200 focus:border-pink-300 focus:ring-pink-300 resize-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="h-12 px-6"
              >
                Отмена
              </Button>
              <Button
                onClick={editingNote ? handleUpdateNote : handleCreateNote}
                disabled={!fullText.trim()}
                className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold h-12 px-8 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                {editingNote ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Note Button */}
      {!isCreating && !editingNote && (
        <Card className="p-6 border-gray-200/60 bg-white/60 backdrop-blur-sm">
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold h-16 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
          >
            <Plus className="h-6 w-6 mr-3" />
            Создать заметку
          </Button>
        </Card>
      )}

      {/* Notes Grid */}
      {notes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <Card
              key={note.id}
              className="p-5 border-gray-200/60 bg-gradient-to-br from-white/80 to-gray-50/50 backdrop-blur-sm hover:shadow-lg transition-all group overflow-hidden cursor-pointer"
              onClick={() => handleEditClick(note)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-2xl text-gray-900 mb-1 break-words line-clamp-1">
                    {note.title}
                  </h3>
                  <div className="text-xs font-semibold text-gray-500 mb-2">
                    {formatNoteDate(note.createdAt)}
                  </div>
                </div>
                <div 
                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleNoteFavorite(note)}
                    className={`h-8 w-8 ${
                      isFavorite(note.id)
                        ? "text-pink-500 hover:text-pink-600 hover:bg-pink-50"
                        : "hover:bg-pink-50 hover:text-pink-500"
                    }`}
                  >
                    <AnimatePresence>
                      {animatingFavorite === note.id && (
                        <motion.div
                          key="favorite-animation"
                          initial={{ scale: 1 }}
                          animate={{ scale: 1.2 }}
                          transition={{ duration: 0.3 }}
                          exit={{ scale: 1 }}
                        >
                          <Bookmark
                            className={`h-4 w-4 ${
                              isFavorite(note.id) ? "fill-current" : ""
                            }`}
                          />
                        </motion.div>
                      )}
                      {animatingFavorite !== note.id && (
                        <Bookmark
                          className={`h-4 w-4 ${
                            isFavorite(note.id) ? "fill-current" : ""
                          }`}
                        />
                      )}
                    </AnimatePresence>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setNoteToDelete(note.id)}
                    className="h-8 w-8 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-gray-600 line-clamp-2 whitespace-pre-wrap break-words text-sm">
                {note.content}
              </p>

              {note.linkedItem && (
                <div className="pt-4 border-t border-gray-200/60 mt-3">
                  <Badge
                    variant="secondary"
                    onClick={(e) => handleNavigateToLinkedItem(note, e)}
                    className="bg-pink-100 text-pink-600 hover:bg-pink-200 hover:text-pink-700 max-w-full inline-flex items-center cursor-pointer transition-all duration-200"
                  >
                    <LinkIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Связано: {note.linkedItem.title}</span>
                    <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                  </Badge>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        !isCreating && !editingNote && (
          <Card className="p-12 border-gray-200/60 bg-white/60 backdrop-blur-sm text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="font-black text-2xl text-gray-900 mb-2">
              У вас пока нет заметок
            </p>
            <p className="text-gray-600 mb-6">
              Создавайте заметки для важной информации и идей
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold h-14 px-8 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Создать первую заметку
            </Button>
          </Card>
        )
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={noteToDelete !== null}
        onOpenChange={() => setNoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-2xl">
              Удалить заметку?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Эта заметка будет удалена навсегда. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => noteToDelete && handleDelete(noteToDelete)}
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