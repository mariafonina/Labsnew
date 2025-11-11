import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Code,
  Eye,
  Edit3,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";
import DOMPurify from "dompurify";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Начните вводить текст...",
  minHeight = "400px",
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageTab, setImageTab] = useState<"url" | "unsplash">("url");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newText);

    // Установить курсор после вставленного текста
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + text + value.substring(start);
    onChange(newText);

    setTimeout(() => {
      const newCursorPos = start + text.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatButtons = [
    {
      icon: Bold,
      label: "Жирный",
      action: () => insertText("**", "**", "жирный текст"),
      shortcut: "Ctrl+B",
    },
    {
      icon: Italic,
      label: "Курсив",
      action: () => insertText("*", "*", "курсив"),
      shortcut: "Ctrl+I",
    },
    {
      icon: Heading1,
      label: "Заголовок 1",
      action: () => insertText("# ", "", "Заголовок"),
    },
    {
      icon: Heading2,
      label: "Заголовок 2",
      action: () => insertText("## ", "", "Заголовок"),
    },
    {
      icon: Heading3,
      label: "Заголовок 3",
      action: () => insertText("### ", "", "Заголовок"),
    },
    {
      icon: Quote,
      label: "Цитата",
      action: () => insertText("> ", "", "Цитата"),
    },
    {
      icon: List,
      label: "Список",
      action: () => insertText("- ", "", "Элемент списка"),
    },
    {
      icon: ListOrdered,
      label: "Нумерованный список",
      action: () => insertText("1. ", "", "Элемент списка"),
    },
    {
      icon: Code,
      label: "Код",
      action: () => insertText("`", "`", "код"),
    },
  ];

  const handleInsertImage = () => {
    if (!imageUrl.trim()) {
      toast.error("Введите URL изображения");
      return;
    }

    const markdown = `![${imageAlt || "Изображение"}](${imageUrl})`;
    insertAtCursor(markdown);
    setImageUrl("");
    setImageAlt("");
    setUnsplashQuery("");
    setImageTab("url");
    setShowImageDialog(false);
    toast.success("Изображение добавлено");
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim() || !linkText.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    const markdown = `[${linkText}](${linkUrl})`;
    insertAtCursor(markdown);
    setLinkUrl("");
    setLinkText("");
    setShowLinkDialog(false);
    toast.success("Ссылка добавлена");
  };

  const renderMarkdown = (text: string) => {
    let html = text;

    // Заголовки
    html = html.replace(/^### (.+)$/gm, '<h3 class="font-black text-2xl mt-6 mb-3">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="font-black text-3xl mt-8 mb-4">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="font-black text-4xl mt-8 mb-4">$1</h1>');

    // Жирный текст
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-extrabold">$1</strong>');
    
    // Курсив
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

    // Цитаты
    html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-pink-400 pl-4 py-2 my-4 italic text-gray-700 bg-pink-50">$1</blockquote>');

    // Код
    html = html.replace(/`(.+?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>');

    // Изображения
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 shadow-md" />');

    // Ссылки
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-pink-500 hover:text-pink-600 underline font-semibold">$1</a>');

    // Ненумерованные списки
    html = html.replace(/^- (.+)$/gm, '<li class="ml-6 my-1">$1</li>');
    html = html.replace(/(<li class="ml-6 my-1">.*<\/li>\n?)+/g, '<ul class="list-disc my-4">$&</ul>');

    // Нумерованные списки
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-6 my-1">$1</li>');
    html = html.replace(/(<li class="ml-6 my-1">.*<\/li>\n?)+/g, '<ol class="list-decimal my-4">$&</ol>');

    // Параграфы
    html = html.split('\n\n').map(para => {
      if (para.trim() && !para.startsWith('<')) {
        return `<p class="my-3 leading-relaxed">${para}</p>`;
      }
      return para;
    }).join('\n');

    // Sanitize the generated HTML to prevent XSS attacks
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'em', 'u', 's',
        'blockquote', 'code', 'pre',
        'ul', 'ol', 'li',
        'a', 'img',
        'div', 'span',
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel',
        'src', 'alt',
        'class',
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "edit" | "preview")} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-[250px] grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Редактор
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Превью
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="space-y-4 mt-0">
          {/* Toolbar */}
          <Card className="p-3 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              {formatButtons.map((button) => (
                <Button
                  key={button.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={button.action}
                  className="hover:bg-white hover:border-pink-300"
                  title={button.label + (button.shortcut ? ` (${button.shortcut})` : "")}
                >
                  <button.icon className="h-4 w-4" />
                </Button>
              ))}
              
              <div className="w-px h-8 bg-gray-300 mx-1" />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImageDialog(true)}
                className="hover:bg-white hover:border-pink-300"
                title="Вставить изображение"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLinkDialog(true)}
                className="hover:bg-white hover:border-pink-300"
                title="Вставить ссылку"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Editor */}
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="font-mono text-sm resize-none"
            style={{ minHeight }}
          />

          {/* Markdown Help */}
          <Card className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-100">
            <h4 className="font-black text-sm mb-2">💡 Подсказка по форматированию</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-600">
              <div><code className="bg-white px-1 rounded">**текст**</code> — жирный</div>
              <div><code className="bg-white px-1 rounded">*текст*</code> — курсив</div>
              <div><code className="bg-white px-1 rounded"># текст</code> — заголовок</div>
              <div><code className="bg-white px-1 rounded">&gt; текст</code> — цитата</div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <Card className="p-8 border-2" style={{ minHeight }}>
            {value.trim() ? (
              <div
                className="prose prose-pink max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
              />
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Превью появится здесь</p>
                <p className="text-sm mt-1">Начните вводить текст на вкладке "Редактор"</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вставить изображение</DialogTitle>
            <DialogDescription>
              Добавьте URL изображения и опциональное описание
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={imageTab} onValueChange={(v: string) => setImageTab(v as "url" | "unsplash")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="url">URL изображения</TabsTrigger>
              <TabsTrigger value="unsplash">Поиск Unsplash</TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div>
                <Label htmlFor="image-url" className="text-base mb-2 block">
                  URL изображения *
                </Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="text-base"
                />
              </div>
              
              <div>
                <Label htmlFor="image-alt" className="text-base mb-2 block">
                  Описание (alt text)
                </Label>
                <Input
                  id="image-alt"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Описание изображения"
                  className="text-base"
                />
              </div>

              {imageUrl && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Превью:</p>
                  <img
                    src={imageUrl}
                    alt={imageAlt || "Превью"}
                    className="max-w-full h-auto rounded shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="unsplash" className="space-y-4">
              <div>
                <Label className="text-base mb-2 block">
                  Поиск изображения
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={unsplashQuery}
                    onChange={(e) => setUnsplashQuery(e.target.value)}
                    placeholder="Например: modern office workspace"
                    className="text-base flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      if (!unsplashQuery.trim()) {
                        toast.error("Введите поисковый запрос");
                        return;
                      }
                      toast.info("Поиск изображения...");
                      // Note: In real implementation, use unsplash_tool here
                      // For now, just show a message
                      toast.success("Функция поиска будет доступна при подключении Unsplash API");
                    }}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  💡 Используйте 2-3 ключевых слова на английском для лучших результатов
                </p>
              </div>
              
              <div>
                <Label htmlFor="image-alt-unsplash" className="text-base mb-2 block">
                  Описание (alt text)
                </Label>
                <Input
                  id="image-alt-unsplash"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Описание изображения"
                  className="text-base"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImageDialog(false);
                setImageUrl("");
                setImageAlt("");
                setUnsplashQuery("");
                setImageTab("url");
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleInsertImage}
              className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
              disabled={!imageUrl.trim()}
            >
              Вставить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вставить ссылку</DialogTitle>
            <DialogDescription>
              Добавьте текст ссылки и URL
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="link-text" className="text-base mb-2 block">
                Текст ссылки *
              </Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Нажмите здесь"
                className="text-base"
              />
            </div>
            
            <div>
              <Label htmlFor="link-url" className="text-base mb-2 block">
                URL *
              </Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="text-base"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLinkDialog(false);
                setLinkUrl("");
                setLinkText("");
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleInsertLink}
              className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
            >
              Вставить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
