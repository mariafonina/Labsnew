import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Bookmark, Eye } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { toast } from "sonner";
import { InstructionDetail } from "./InstructionDetail";
import type { Instruction } from "../contexts/AppContext";

// Утилита для рендеринга markdown
function renderMarkdown(text: string) {
  if (!text) return "";
  
  let html = text;

  // Заголовки
  html = html.replace(/^### (.+)$/gm, '<h3 class="font-bold text-xl mt-6 mb-3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="font-bold text-2xl mt-8 mb-4">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="font-black text-3xl mt-8 mb-4">$1</h1>');

  // Жирный текст
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
  
  // Курсив
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

  // Цитаты
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-pink-400 pl-4 py-2 my-4 italic text-gray-700 bg-pink-50 rounded-r">$1</blockquote>');

  // Код
  html = html.replace(/`(.+?)`/g, '<code class="bg-gray-200 px-2 py-1 rounded text-sm font-mono">$1</code>');

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

  return html;
}

export function InstructionsLibrary() {
  const {
    instructions,
    cohortKnowledgeCategories,
    userCohorts,
    selectedCohortId,
    setSelectedCohort,
    addToFavorites,
    removeFromFavorites,
    isFavorite
  } = useApp();

  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null);
  const [completedInstructions, setCompletedInstructions] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem("completedInstructions") || "[]"))
  );

  // Проверяем sessionStorage при загрузке компонента
  useEffect(() => {
    console.log('[InstructionsLibrary useEffect] Checking sessionStorage');
    const selectedId = sessionStorage.getItem('selectedItemId');
    const selectedType = sessionStorage.getItem('selectedItemType');
    console.log('[InstructionsLibrary useEffect] selectedId:', selectedId, 'selectedType:', selectedType);
    console.log('[InstructionsLibrary useEffect] instructions.length:', instructions.length);

    if (selectedId && selectedType === 'instruction') {
      console.log('[InstructionsLibrary useEffect] Looking for instruction with id:', selectedId);
      // Ищем инструкцию по ID
      const instruction = instructions.find(i => {
        console.log('[InstructionsLibrary useEffect] Comparing:', String(i.id), '===', selectedId, '?', String(i.id) === selectedId);
        return String(i.id) === selectedId;
      });
      console.log('[InstructionsLibrary useEffect] Found instruction:', instruction);
      if (instruction) {
        console.log('[InstructionsLibrary useEffect] Setting selected instruction:', instruction.title);
        setSelectedInstruction(instruction);
      } else {
        console.log('[InstructionsLibrary useEffect] Instruction not found!');
      }
      // Очищаем sessionStorage после использования
      sessionStorage.removeItem('selectedItemId');
      sessionStorage.removeItem('selectedItemType');
    } else {
      console.log('[InstructionsLibrary useEffect] No instruction to auto-select');
    }
  }, [instructions]);

  // Если выбрана инструкция, показываем детальную страницу
  console.log('[InstructionsLibrary] selectedInstruction:', selectedInstruction);
  if (selectedInstruction) {
    console.log('[InstructionsLibrary] Rendering InstructionDetail for:', selectedInstruction.id, selectedInstruction.title);
    return (
      <InstructionDetail
        instruction={selectedInstruction}
        onBack={() => {
          console.log('[InstructionsLibrary] Going back from InstructionDetail');
          setSelectedInstruction(null);
        }}
      />
    );
  }

  // Проверка доступа: нет потоков
  if (userCohorts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-500 text-lg">
          У вас нет доступа к потокам
        </p>
      </Card>
    );
  }

  // Проверка доступа: не выбран поток
  if (!selectedCohortId) {
    console.log('[InstructionsLibrary] No cohort selected!');
    console.log('[InstructionsLibrary] selectedCohortId:', selectedCohortId);
    console.log('[InstructionsLibrary] userCohorts:', userCohorts);
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-500 text-lg">
          Выберите поток
        </p>
      </Card>
    );
  }

  const handleToggleFavorite = (instruction: any) => {
    if (isFavorite(instruction.id)) {
      removeFromFavorites(instruction.id);
      toast.success("Удалено из избранного");
    } else {
      addToFavorites({
        id: instruction.id,
        type: "instruction",
        title: instruction.title,
        description: instruction.description,
        addedAt: new Date().toISOString(),
      });
      toast.success("Добавлено в избранное");
    }
  };

  const handleToggleCompleted = (instructionId: string) => {
    const newCompleted = new Set(completedInstructions);
    if (newCompleted.has(instructionId)) {
      newCompleted.delete(instructionId);
      toast.success("Отмечено как не изучено");
    } else {
      newCompleted.add(instructionId);
      toast.success("Отмечено как изучено");
    }
    setCompletedInstructions(newCompleted);
    localStorage.setItem("completedInstructions", JSON.stringify(Array.from(newCompleted)));
  };

  // Фильтруем инструкции по выбранному потоку
  const cohortInstructions = instructions.filter(i => {
    const match = i.cohort_id === selectedCohortId || i.cohortId === selectedCohortId;
    return match;
  });

  console.log('[InstructionsLibrary] Filtered instructions:', cohortInstructions.length, 'of', instructions.length, 'for cohortId:', selectedCohortId);

  // Сортируем категории по order
  const sortedCategories = [...cohortKnowledgeCategories].sort((a, b) => a.order - b.order);

  // Получаем инструкции для каждой категории базы знаний потока
  const getInstructionsByCohortCategory = (categoryId: string | number | null) => {
    return cohortInstructions
      .filter((i) => {
        const instructionCategoryId = i.cohort_category_id ?? i.cohortCategoryId;
        return instructionCategoryId === categoryId;
      })
      .sort((a, b) => a.order - b.order);
  };

  // Инструкции без категории
  const uncategorizedInstructions = getInstructionsByCohortCategory(null);

  return (
    <div className="space-y-16">
      {/* Селектор потока (если потоков больше 1) */}
      {userCohorts.length > 1 && (
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="font-semibold text-gray-700">Поток:</label>
            <select
              value={selectedCohortId || ''}
              onChange={(e) => setSelectedCohort(Number(e.target.value))}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              {userCohorts.map(cohort => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name} {cohort.product_name ? `(${cohort.product_name})` : ''}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {cohortInstructions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 text-lg">
            Пока нет доступных инструкций
          </p>
        </Card>
      ) : (
        <>
          {/* Инструкции без категории */}
          {uncategorizedInstructions.length > 0 && (
            <div className="space-y-5">
              <div className="mb-2">
                <h2 className="font-black text-2xl text-gray-900">Инструкции</h2>
              </div>

              <div className="space-y-3">
                {uncategorizedInstructions.map((instruction) => {
                  const isCompleted = completedInstructions.has(instruction.id);

                  return (
                    <Card
                      key={instruction.id}
                      onClick={() => {
                        console.log('[InstructionsLibrary] Clicked instruction:', instruction.id, instruction.title);
                        setSelectedInstruction(instruction);
                      }}
                      className="border-gray-200/60 bg-white/60 backdrop-blur-sm rounded-xl px-6 py-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => {
                            handleToggleCompleted(instruction.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-400 data-[state=checked]:to-rose-400 data-[state=checked]:border-pink-400 shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-base leading-relaxed ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {instruction.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(instruction);
                            }}
                            className={`p-2.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors ${isFavorite(instruction.id) ? 'text-pink-500' : 'text-gray-400 hover:text-gray-600'}`}
                            title={isFavorite(instruction.id) ? "Удалить из избранного" : "Добавить в избранное"}
                          >
                            <Bookmark className={`h-5 w-5 ${isFavorite(instruction.id) ? 'fill-pink-500' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInstruction(instruction);
                            }}
                            className="p-2.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                            title="Просмотр"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Категоризированные инструкции */}
          {sortedCategories.map((category) => {
            const categoryInstructions = getInstructionsByCohortCategory(category.id);

            // Показываем только категории, в которых есть инструкции
            if (categoryInstructions.length === 0) return null;

            return (
              <div key={category.id} className="space-y-5">
                <div className="mb-2">
                  <h2 className="font-black text-2xl text-gray-900">{category.name}</h2>
                  {category.description && (
                    <p className="text-gray-600 mt-1">{category.description}</p>
                  )}
                </div>
              
              <div className="space-y-3">
                {categoryInstructions.map((instruction) => {
                  const isCompleted = completedInstructions.has(instruction.id);
                  
                  return (
                    <Card
                      key={instruction.id}
                      onClick={() => {
                        console.log('[InstructionsLibrary] Clicked instruction:', instruction.id, instruction.title);
                        setSelectedInstruction(instruction);
                      }}
                      className="border-gray-200/60 bg-white/60 backdrop-blur-sm rounded-xl px-6 py-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => {
                            handleToggleCompleted(instruction.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-400 data-[state=checked]:to-rose-400 data-[state=checked]:border-pink-400 shrink-0"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-base leading-relaxed ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {instruction.title}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(instruction);
                            }}
                            className={`p-2.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors ${isFavorite(instruction.id) ? 'text-pink-500' : 'text-gray-400 hover:text-gray-600'}`}
                            title={isFavorite(instruction.id) ? "Удалить из избранного" : "Добавить в избранное"}
                          >
                            <Bookmark className={`h-5 w-5 ${isFavorite(instruction.id) ? 'fill-pink-500' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInstruction(instruction);
                            }}
                            className="p-2.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                            title="Просмотр"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
        </>
      )}
    </div>
  );
}