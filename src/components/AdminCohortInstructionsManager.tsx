import { useState, useEffect, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { RichTextEditor } from "./RichTextEditor";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  GripVertical,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { apiClient } from "../api/client";
import { formatDateShortRu } from "../utils/formatDate";

interface CohortInstruction {
  id: number;
  title: string;
  content: string;
  cohort_category_id: number | null;
  category_name?: string;
  description?: string;
  loom_embed_url?: string;
  image_url?: string;
  display_order: number;
  updated_at?: string;
  views?: number;
}

interface CohortKnowledgeCategory {
  id: number;
  cohort_id: number;
  name: string;
  description?: string;
  display_order: number;
}

interface DragItem {
  id: number;
  type: "category" | "instruction";
  order: number;
  categoryId?: number;
}

interface CategoryCardProps {
  category: CohortKnowledgeCategory;
  instructions: CohortInstruction[];
  onEditCategory: (category: CohortKnowledgeCategory) => void;
  onDeleteCategory: (id: number) => void;
  onEditInstruction: (instruction: CohortInstruction) => void;
  onDeleteInstruction: (id: number) => void;
  onAddInstruction: (categoryId: number) => void;
  onMoveCategory: (categoryId: number, newOrder: number) => void;
  onMoveInstruction: (instructionId: number, targetCategoryId: number, newOrder: number) => void;
  index: number;
}

function CategoryCard({
  category,
  instructions,
  onEditCategory,
  onDeleteCategory,
  onEditInstruction,
  onDeleteInstruction,
  onAddInstruction,
  onMoveCategory,
  onMoveInstruction,
  index,
}: CategoryCardProps) {
  const storageKey = `labs_cohort_category_expanded_${category.cohort_id}_${category.id}`;
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved !== null ? saved === "true" : true;
  });
  const [isEditingName, setIsEditingName] = useState(false);

  const handleToggleExpanded = () => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);
    localStorage.setItem(storageKey, String(newValue));
  };
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const [editedDescription, setEditedDescription] = useState(category.description || "");

  const [{ isDragging }, dragRef, previewRef] = useDrag<
    DragItem,
    void,
    { isDragging: boolean }
  >({
    type: "category",
    item: { id: category.id, type: "category", order: category.display_order },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, dropRef] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: "category",
    drop: (item) => {
      if (item.id !== category.id) {
        onMoveCategory(item.id, category.display_order);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div ref={(node) => previewRef(dropRef(node))}>
      <Card
        className={`border-2 transition-all ${
          isDragging ? "opacity-50" : ""
        } ${isOver ? "border-purple-400 bg-purple-50" : ""}`}
      >
        {/* Category Header */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-3">
            <div
              ref={dragRef}
              className="cursor-move p-2 hover:bg-gray-200 rounded transition-colors"
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>

            <button
              onClick={handleToggleExpanded}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={() => {
                    if (editedName.trim() && editedName !== category.name) {
                      onEditCategory({ ...category, name: editedName.trim() });
                    }
                    setIsEditingName(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (editedName.trim() && editedName !== category.name) {
                        onEditCategory({ ...category, name: editedName.trim() });
                      }
                      setIsEditingName(false);
                    } else if (e.key === "Escape") {
                      setEditedName(category.name);
                      setIsEditingName(false);
                    }
                  }}
                  autoFocus
                  className="font-black text-xl h-auto py-1 px-2"
                />
              ) : (
                <h3
                  className="font-black text-xl cursor-text hover:bg-gray-100 px-2 py-1 rounded transition-colors inline-flex items-center gap-2 group"
                  onClick={() => {
                    setEditedName(category.name);
                    setIsEditingName(true);
                  }}
                >
                  {category.name}
                  <Edit2 className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              )}

              {isEditingDescription ? (
                <div className="mt-1">
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    onBlur={() => {
                      if (editedDescription !== (category.description || "")) {
                        onEditCategory({ ...category, description: editedDescription.trim() || undefined });
                      }
                      setIsEditingDescription(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        if (editedDescription !== (category.description || "")) {
                          onEditCategory({ ...category, description: editedDescription.trim() || undefined });
                        }
                        setIsEditingDescription(false);
                      } else if (e.key === "Escape") {
                        setEditedDescription(category.description || "");
                        setIsEditingDescription(false);
                      }
                    }}
                    autoFocus
                    className="text-sm text-gray-500 min-h-[60px] py-1 px-2"
                    placeholder="Добавить описание..."
                  />
                  <p className="text-xs text-gray-400 mt-1 px-2">
                    Ctrl+Enter для сохранения • Esc для отмены
                  </p>
                </div>
              ) : (
                <p
                  className="text-sm text-gray-500 mt-1 cursor-text hover:bg-gray-100 px-2 py-1 rounded transition-colors inline-flex items-center gap-2 group"
                  onClick={() => {
                    setEditedDescription(category.description || "");
                    setIsEditingDescription(true);
                  }}
                >
                  {category.description || <span className="text-gray-400 italic">Добавить описание...</span>}
                  <Edit2 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              )}
            </div>

            <Badge variant="outline" className="shrink-0">
              {instructions.length} {instructions.length === 1 ? "инструкция" : "инструкций"}
            </Badge>

            <div className="flex gap-2 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onAddInstruction(category.id)}
                    className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Добавить инструкцию в эту категорию</p>
                </TooltipContent>
              </Tooltip>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDeleteCategory(category.id)}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions List */}
        {isExpanded && (
          <div className="p-4 space-y-2">
            {instructions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="max-w-sm mx-auto">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">
                    Нет инструкций в этой категории
                  </p>
                  <Button
                    onClick={() => onAddInstruction(category.id)}
                    size="default"
                    className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить первую инструкцию
                  </Button>
                </div>
              </div>
            ) : (
              instructions.map((instruction, idx) => (
                <InstructionItem
                  key={instruction.id}
                  instruction={instruction}
                  categoryId={category.id}
                  onEdit={onEditInstruction}
                  onDelete={onDeleteInstruction}
                  onMove={onMoveInstruction}
                  index={idx}
                />
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

interface InstructionItemProps {
  instruction: CohortInstruction;
  categoryId: number;
  onEdit: (instruction: CohortInstruction) => void;
  onDelete: (id: number) => void;
  onMove: (instructionId: number, targetCategoryId: number, newOrder: number) => void;
  index: number;
}

function InstructionItem({
  instruction,
  categoryId,
  onEdit,
  onDelete,
  onMove,
  index,
}: InstructionItemProps) {
  const [{ isDragging }, dragRef, previewRef] = useDrag<
    DragItem,
    void,
    { isDragging: boolean }
  >({
    type: "instruction",
    item: {
      id: instruction.id,
      type: "instruction",
      order: instruction.display_order,
      categoryId: instruction.cohort_category_id || undefined,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, dropRef] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: "instruction",
    drop: (item) => {
      if (item.id !== instruction.id) {
        onMove(item.id, categoryId, instruction.display_order);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div ref={(node) => previewRef(dropRef(node))}>
      <Card
        className={`p-3 lg:p-4 transition-all ${
          isDragging ? "opacity-50" : ""
        } ${isOver ? "border-purple-400 bg-purple-50" : "hover:shadow-md"}`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <div className="hidden lg:block">
            <div
              ref={dragRef}
              className="cursor-move p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="flex-1 min-w-0 w-full lg:w-auto">
            <h4 className="font-black text-sm lg:text-base mb-1">{instruction.title}</h4>
            {instruction.description && (
              <p className="text-xs lg:text-sm text-gray-600 line-clamp-2 mb-2">
                {instruction.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {instruction.updated_at && <span className="font-semibold">📅 {formatDateShortRu(instruction.updated_at)}</span>}
              {instruction.views !== undefined && (
                <>
                  <span>•</span>
                  <span>👁️ {instruction.views} просмотров</span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0 w-full lg:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(instruction)}
              className="hover:bg-gray-100 flex-1 lg:flex-none"
            >
              <Edit2 className="h-3 w-3 lg:mr-1" />
              <span className="hidden lg:inline text-xs">Изменить</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(instruction.id)}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface AdminCohortInstructionsManagerProps {
  cohortId: number;
}

export function AdminCohortInstructionsManager({ cohortId }: AdminCohortInstructionsManagerProps) {
  const [categories, setCategories] = useState<CohortKnowledgeCategory[]>([]);
  const [instructions, setInstructions] = useState<CohortInstruction[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingInstruction, setIsAddingInstruction] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<CohortInstruction | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: number; type: string } | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  const [instructionForm, setInstructionForm] = useState({
    title: "",
    cohort_category_id: 0,
    description: "",
    content: "",
    loom_embed_url: "",
    image_url: "",
  });

  const categoryFormRef = useRef<HTMLDivElement>(null);
  const instructionFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [cohortId]);

  useEffect(() => {
    if (isAddingCategory && categoryFormRef.current) {
      requestAnimationFrame(() => {
        categoryFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [isAddingCategory]);

  useEffect(() => {
    if ((isAddingInstruction || editingInstruction) && instructionFormRef.current) {
      requestAnimationFrame(() => {
        instructionFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [isAddingInstruction, editingInstruction]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<any>(`/admin/cohort-materials/${cohortId}`);
      console.log("API response:", data);
      console.log("Categories:", data.categories);
      console.log("Instructions:", data.instructions);
      setCategories(data.categories || []);
      setInstructions(data.instructions || []);
    } catch (error: any) {
      toast.error("Не удалось загрузить данные");
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedCategories = [...categories].sort((a, b) => a.display_order - b.display_order);

  const getInstructionsByCategory = (categoryId: number) => {
    return instructions
      .filter((i) => i.cohort_category_id === categoryId)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name) {
      toast.error("Введите название категории");
      return;
    }
    try {
      await apiClient.post(`/cohorts/${cohortId}/knowledge-categories`, categoryForm);
      await loadData();
      setCategoryForm({ name: "", description: "" });
      setIsAddingCategory(false);
      toast.success("Категория добавлена");
    } catch (error: any) {
      toast.error(error.message || "Ошибка при добавлении категории");
    }
  };

  const handleUpdateCategory = async (category: CohortKnowledgeCategory) => {
    try {
      await apiClient.put(`/cohorts/${cohortId}/knowledge-categories/${category.id}`, {
        name: category.name,
        description: category.description,
      });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Ошибка при обновлении категории");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await apiClient.delete(`/cohorts/${cohortId}/knowledge-categories/${id}`);
      await loadData();
      setDeletingItem(null);
      toast.success("Категория удалена");
    } catch (error: any) {
      toast.error(error.message || "Ошибка при удалении категории");
    }
  };

  const handleAddInstruction = async () => {
    if (!instructionForm.title || !instructionForm.content) {
      toast.error("Заполните обязательные поля");
      return;
    }
    try {
      await apiClient.post(`/admin/cohort-materials/${cohortId}/instructions`, instructionForm);
      await loadData();
      setInstructionForm({
        title: "",
        cohort_category_id: 0,
        description: "",
        content: "",
        loom_embed_url: "",
        image_url: "",
      });
      setIsAddingInstruction(false);
      toast.success("Инструкция добавлена");
    } catch (error: any) {
      toast.error(error.message || "Ошибка при добавлении инструкции");
    }
  };

  const handleUpdateInstruction = async () => {
    if (!editingInstruction) return;
    if (!instructionForm.title || !instructionForm.content) {
      toast.error("Заполните обязательные поля");
      return;
    }
    try {
      await apiClient.put(`/admin/cohort-materials/${cohortId}/instructions/${editingInstruction.id}`, instructionForm);
      await loadData();
      setInstructionForm({
        title: "",
        cohort_category_id: 0,
        description: "",
        content: "",
        loom_embed_url: "",
        image_url: "",
      });
      setEditingInstruction(null);
      toast.success("Инструкция обновлена");
    } catch (error: any) {
      toast.error(error.message || "Ошибка при обновлении инструкции");
    }
  };

  const handleDeleteInstruction = async (id: number) => {
    try {
      await apiClient.delete(`/admin/cohort-materials/${cohortId}/instructions/${id}`);
      await loadData();
      setDeletingItem(null);
      toast.success("Инструкция удалена");
    } catch (error: any) {
      toast.error(error.message || "Ошибка при удалении инструкции");
    }
  };

  const handleMoveCategory = async (categoryId: number, newOrder: number) => {
    const reordered = [...categories];
    const fromIndex = reordered.findIndex((c) => c.id === categoryId);
    const toIndex = reordered.findIndex((c) => c.display_order === newOrder);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const updates = reordered.map((cat, idx) => ({ id: cat.id, order: idx }));
    const newCategories = reordered.map((cat, idx) => ({ ...cat, display_order: idx }));

    const previousCategories = categories;
    setCategories(newCategories);

    try {
      await apiClient.post(`/cohorts/${cohortId}/knowledge-categories/reorder`, { categories: updates });
    } catch (error: any) {
      setCategories(previousCategories);
      toast.error(error.message || "Ошибка при изменении порядка");
    }
  };

  const handleMoveInstruction = async (instructionId: number, targetCategoryId: number, targetDisplayOrder: number) => {
    const movedInstruction = instructions.find((i) => i.id === instructionId);
    if (!movedInstruction) return;

    const sourceCategoryId = movedInstruction.cohort_category_id;
    const isMovingWithinSameCategory = sourceCategoryId === targetCategoryId;

    let updates: Array<{ id: number; order: number; cohort_category_id: number }> = [];
    let newInstructions: typeof instructions = [];

    if (isMovingWithinSameCategory) {
      const categoryInstructions = instructions
        .filter((i) => i.cohort_category_id === targetCategoryId)
        .sort((a, b) => a.display_order - b.display_order);

      const movedIndex = categoryInstructions.findIndex((i) => i.id === instructionId);
      const targetIndex = categoryInstructions.findIndex((i) => i.display_order === targetDisplayOrder);

      if (movedIndex === -1 || targetIndex === -1 || movedIndex === targetIndex) return;

      const reordered = categoryInstructions.filter(i => i.id !== instructionId);
      reordered.splice(targetIndex, 0, movedInstruction);

      updates = reordered.map((instr, idx) => ({
        id: instr.id,
        order: idx,
        cohort_category_id: targetCategoryId,
      }));

      const updatedMap = new Map(updates.map(u => [u.id, u]));
      newInstructions = instructions.map(instr => {
        const update = updatedMap.get(instr.id);
        if (update) {
          return { ...instr, display_order: update.order, cohort_category_id: update.cohort_category_id };
        }
        return instr;
      });
    } else {
      const sourceInstructions = instructions
        .filter((i) => i.cohort_category_id === sourceCategoryId && i.id !== instructionId)
        .sort((a, b) => a.display_order - b.display_order);

      const sourceUpdates = sourceInstructions.map((instr, idx) => ({
        id: instr.id,
        order: idx,
        cohort_category_id: sourceCategoryId!,
      }));

      const targetInstructions = instructions
        .filter((i) => i.cohort_category_id === targetCategoryId)
        .sort((a, b) => a.display_order - b.display_order);

      const targetIndex = targetInstructions.findIndex((i) => i.display_order === targetDisplayOrder);
      const insertAt = targetIndex !== -1 ? targetIndex : targetInstructions.length;

      targetInstructions.splice(insertAt, 0, { ...movedInstruction, cohort_category_id: targetCategoryId });

      const targetUpdates = targetInstructions.map((instr, idx) => ({
        id: instr.id,
        order: idx,
        cohort_category_id: targetCategoryId,
      }));

      updates = [...sourceUpdates, ...targetUpdates];

      const updatedMap = new Map(updates.map(u => [u.id, u]));
      newInstructions = instructions.map(instr => {
        const update = updatedMap.get(instr.id);
        if (update) {
          return { ...instr, display_order: update.order, cohort_category_id: update.cohort_category_id };
        }
        return instr;
      });
    }

    const previousInstructions = instructions;
    setInstructions(newInstructions);

    try {
      await apiClient.post(`/admin/cohort-materials/${cohortId}/instructions/reorder`, { instructions: updates });
    } catch (error: any) {
      setInstructions(previousInstructions);
      toast.error(error.message || "Ошибка при изменении порядка");
    }
  };

  const handleDelete = () => {
    if (!deletingItem) return;

    if (deletingItem.type === "category") {
      handleDeleteCategory(deletingItem.id);
    } else {
      handleDeleteInstruction(deletingItem.id);
    }
  };

  const cancelEdit = () => {
    setIsAddingCategory(false);
    setIsAddingInstruction(false);
    setEditingInstruction(null);
    setCategoryForm({ name: "", description: "" });
    setInstructionForm({
      title: "",
      cohort_category_id: 0,
      description: "",
      content: "",
      loom_embed_url: "",
      image_url: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <TooltipProvider>
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <h2 className="font-black text-3xl mb-2">База знаний</h2>
              <p className="text-gray-500 text-sm lg:text-base">
                Управление категориями и инструкциями • {categories.length} категорий •{" "}
                {instructions.length} инструкций
              </p>
            </div>
            {!isAddingCategory && !isAddingInstruction && !editingInstruction && (
              <Button
                onClick={() => setIsAddingCategory(true)}
                size="lg"
                className="hidden lg:flex bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Добавить категорию
              </Button>
            )}
          </div>

          {/* Add Category Form */}
          {isAddingCategory && (
            <Card ref={categoryFormRef} className="p-4 lg:p-8 shadow-lg border-2">
              <div className="mb-4 lg:mb-6 pb-4 lg:pb-6 border-b border-gray-200">
                <h3 className="font-black text-2xl lg:text-3xl">
                  Новая категория
                </h3>
                <p className="text-gray-500 mt-2 text-sm lg:text-base">Заполните поля для создания категории</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="category-name" className="text-base mb-2 block">
                    Название категории *
                  </Label>
                  <Input
                    id="category-name"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    placeholder="Например: Базовые навыки"
                    className="text-base h-12"
                  />
                </div>

                <div>
                  <Label htmlFor="category-description" className="text-base mb-2 block">
                    Описание (опционально)
                  </Label>
                  <Textarea
                    id="category-description"
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, description: e.target.value })
                    }
                    placeholder="Краткое описание категории"
                    className="text-base min-h-[100px]"
                  />
                </div>

                <div className="flex flex-col lg:flex-row gap-3 pt-4">
                  <Button
                    onClick={handleAddCategory}
                    size="lg"
                    className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 w-full lg:w-auto"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Создать категорию
                  </Button>
                  <Button onClick={cancelEdit} size="lg" variant="outline" className="w-full lg:w-auto">
                    <X className="h-5 w-5 mr-2" />
                    Отмена
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Add/Edit Instruction Form */}
          {(isAddingInstruction || editingInstruction) && (
            <Card ref={instructionFormRef} className="p-4 lg:p-8 shadow-lg border-2">
              <div className="mb-4 lg:mb-6 pb-4 lg:pb-6 border-b border-gray-200">
                <h3 className="font-black text-2xl lg:text-3xl">
                  {editingInstruction ? "Редактировать инструкцию" : "Новая инструкция"}
                </h3>
                <p className="text-gray-500 mt-2 text-sm lg:text-base">
                  {instructionForm.cohort_category_id && !editingInstruction && (
                    <>
                      Добавление в категорию:{" "}
                      <span className="font-extrabold text-gray-700">
                        {sortedCategories.find(c => c.id === instructionForm.cohort_category_id)?.name}
                      </span>
                      {" • "}
                    </>
                  )}
                  Заполните все обязательные поля отмеченные звёздочкой *
                </p>
              </div>

              <div className="space-y-6">
                {/* Основная информация */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-1 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-full" />
                    <h4 className="font-black text-base lg:text-lg">Основная информация</h4>
                  </div>
                  <div>
                    <Label htmlFor="instruction-title" className="text-base mb-2 block">
                      Название *
                    </Label>
                    <Input
                      id="instruction-title"
                      value={instructionForm.title}
                      onChange={(e) =>
                        setInstructionForm({ ...instructionForm, title: e.target.value })
                      }
                      placeholder="Название инструкции"
                      className="text-base h-12"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instruction-category" className="text-base mb-2 block">
                      Категория *
                    </Label>
                    <Select
                      value={instructionForm.cohort_category_id?.toString() || ""}
                      onValueChange={(value) =>
                        setInstructionForm({ ...instructionForm, cohort_category_id: parseInt(value) })
                      }
                    >
                      <SelectTrigger className="text-base h-12">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="instruction-description" className="text-base mb-2 block">
                      Краткое описание
                    </Label>
                    <Textarea
                      id="instruction-description"
                      value={instructionForm.description}
                      onChange={(e) =>
                        setInstructionForm({ ...instructionForm, description: e.target.value })
                      }
                      placeholder="Краткое описание инструкции (отображается в списке)"
                      className="text-base min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Содержание */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-1 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-full" />
                    <h4 className="font-black text-base lg:text-lg">Содержание инструкции</h4>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-3">
                      📝 Используйте редактор для создания подробного содержания с форматированием текста, изображениями и ссылками
                    </p>
                    <RichTextEditor
                      value={instructionForm.content}
                      onChange={(value) =>
                        setInstructionForm({ ...instructionForm, content: value })
                      }
                      placeholder="Подробное содержание инструкции с форматированием..."
                      minHeight="500px"
                    />
                  </div>
                </div>

                {/* Дополнительная информация */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-1 bg-gradient-to-b from-purple-400 to-indigo-400 rounded-full" />
                    <h4 className="font-black text-base lg:text-lg">Дополнительная информация</h4>
                  </div>
                  <div>
                    <Label htmlFor="instruction-url" className="text-base mb-2 block">
                      Ссылка для скачивания
                    </Label>
                    <Input
                      id="instruction-url"
                      type="url"
                      value={instructionForm.image_url}
                      onChange={(e) =>
                        setInstructionForm({ ...instructionForm, image_url: e.target.value })
                      }
                      placeholder="https://example.com/file.pdf"
                      className="text-base h-12"
                    />
                    <p className="text-xs lg:text-sm text-gray-500 mt-1">
                      🔗 Ссылка на файл для скачивания (PDF, DOCX и т.д.)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="instruction-loom" className="text-base mb-2 block">
                      Loom видео (ссылка для встраивания)
                    </Label>
                    <Input
                      id="instruction-loom"
                      type="url"
                      value={instructionForm.loom_embed_url}
                      onChange={(e) =>
                        setInstructionForm({ ...instructionForm, loom_embed_url: e.target.value })
                      }
                      placeholder="https://www.loom.com/embed/... или https://www.loom.com/share/..."
                      className="text-base h-12"
                    />
                    <p className="text-xs lg:text-sm text-gray-500 mt-1">
                      🎥 Ссылка на Loom видео для встраивания в инструкцию
                    </p>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-3 pt-4">
                  <Button
                    onClick={editingInstruction ? handleUpdateInstruction : handleAddInstruction}
                    size="lg"
                    className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 w-full lg:w-auto"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {editingInstruction ? "Сохранить изменения" : "Создать инструкцию"}
                  </Button>
                  <Button onClick={cancelEdit} size="lg" variant="outline" className="w-full lg:w-auto">
                    <X className="h-5 w-5 mr-2" />
                    Отмена
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Categories List */}
          <div className="space-y-4">
            {sortedCategories.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed border-gray-300">
                <div className="max-w-sm mx-auto">
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="font-black text-2xl text-gray-900 mb-2">Нет категорий</h3>
                  <p className="text-gray-500 mb-6">
                    Создайте первую категорию для организации инструкций
                  </p>
                  <Button
                    onClick={() => setIsAddingCategory(true)}
                    size="lg"
                    className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Создать категорию
                  </Button>
                </div>
              </Card>
            ) : (
              sortedCategories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  instructions={getInstructionsByCategory(category.id)}
                  onEditCategory={handleUpdateCategory}
                  onDeleteCategory={(id) => setDeletingItem({ id, type: "category" })}
                  onEditInstruction={(instr) => {
                    setEditingInstruction(instr);
                    setInstructionForm({
                      title: instr.title,
                      cohort_category_id: instr.cohort_category_id || 0,
                      description: instr.description || "",
                      content: instr.content || "",
                      loom_embed_url: instr.loom_embed_url || "",
                      image_url: instr.image_url || "",
                    });
                  }}
                  onDeleteInstruction={(id) => setDeletingItem({ id, type: "instruction" })}
                  onAddInstruction={(categoryId) => {
                    setIsAddingInstruction(true);
                    setInstructionForm({
                      ...instructionForm,
                      cohort_category_id: categoryId,
                    });
                  }}
                  onMoveCategory={handleMoveCategory}
                  onMoveInstruction={handleMoveInstruction}
                  index={index}
                />
              ))
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
                <AlertDialogDescription>
                  {deletingItem?.type === "category"
                    ? "Вы уверены, что хотите удалить эту категорию? Все инструкции в ней также будут удалены."
                    : "Вы уверены, что хотите удалить эту инструкцию?"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TooltipProvider>
    </DndProvider>
  );
}
