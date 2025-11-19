import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  ArrowLeft,
  BookOpen,
  Video,
  Newspaper,
  Calendar,
  HelpCircle,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../api/client";
import { AdminEmptyState } from "./AdminEmptyState";

interface Material {
  id: number;
  title: string;
  material_type: string;
  material_id: number;
  is_visible: boolean;
}

interface AvailableMaterials {
  instructions: Array<{id: number, title: string}>;
  recordings: Array<{id: number, title: string}>;
  news: Array<{id: number, title: string}>;
  events: Array<{id: number, title: string}>;
  faq: Array<{id: number, title: string}>;
}

interface AdminStreamDetailProps {
  cohortId: number;
  cohortName: string;
  productName: string;
  onBack: () => void;
}

export function AdminStreamDetail({ cohortId, cohortName, productName, onBack }: AdminStreamDetailProps) {
  const [assignedMaterials, setAssignedMaterials] = useState<Material[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<AvailableMaterials | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMaterials, setSelectedMaterials] = useState<{[key: string]: number[]}>({
    instructions: [],
    recordings: [],
    news: [],
    events: [],
    faq: []
  });

  useEffect(() => {
    loadMaterials();
  }, [cohortId]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const [assigned, available] = await Promise.all([
        apiClient.getCohortMaterials(cohortId),
        apiClient.getAvailableMaterials(cohortId)
      ]);

      setAssignedMaterials(assigned);
      setAvailableMaterials(available);
    } catch (error: any) {
      toast.error("Не удалось загрузить материалы");
      console.error("Failed to load materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = (type: string, id: number) => {
    return assignedMaterials.some(m => m.material_type === type && m.material_id === id);
  };

  const getMaterialVisibility = (type: string, id: number) => {
    const material = assignedMaterials.find(m => m.material_type === type && m.material_id === id);
    return material?.is_visible ?? true;
  };

  const handleToggleMaterial = (type: string, id: number) => {
    const current = selectedMaterials[type] || [];
    const newSelection = current.includes(id)
      ? current.filter(i => i !== id)
      : [...current, id];

    setSelectedMaterials({
      ...selectedMaterials,
      [type]: newSelection
    });
  };

  const handleAssignSelected = async (materialType: string) => {
    const materialIds = selectedMaterials[materialType];
    if (materialIds.length === 0) {
      toast.error("Выберите материалы для назначения");
      return;
    }

    try {
      await apiClient.assignCohortMaterials(cohortId, {
        material_type: materialType === 'instructions' ? 'instruction' :
                      materialType === 'recordings' ? 'recording' :
                      materialType === 'news' ? 'news' :
                      materialType === 'events' ? 'event' :
                      'faq',
        material_ids: materialIds,
        is_visible: true
      });

      await loadMaterials();
      setSelectedMaterials({
        ...selectedMaterials,
        [materialType]: []
      });
      toast.success(`Назначено материалов: ${materialIds.length}`);
    } catch (error: any) {
      toast.error(error.message || "Не удалось назначить материалы");
    }
  };

  const handleToggleVisibility = async (type: string, id: number) => {
    const currentVisibility = getMaterialVisibility(type, id);

    try {
      await apiClient.updateMaterialsVisibility(cohortId, [{
        type,
        id,
        visible: !currentVisibility
      }]);

      await loadMaterials();
      toast.success(currentVisibility ? "Материал скрыт" : "Материал показан");
    } catch (error: any) {
      toast.error("Не удалось изменить видимость");
    }
  };

  const handleRemoveMaterial = async (type: string, id: number) => {
    try {
      await apiClient.removeCohortMaterial(cohortId, type, id);
      await loadMaterials();
      toast.success("Материал удален из потока");
    } catch (error: any) {
      toast.error("Не удалось удалить материал");
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'instructions': return BookOpen;
      case 'recordings': return Video;
      case 'news': return Newspaper;
      case 'events': return Calendar;
      case 'faq': return HelpCircle;
      default: return BookOpen;
    }
  };

  const getMaterialColor = (type: string) => {
    switch (type) {
      case 'instructions': return 'from-blue-400 to-cyan-400';
      case 'recordings': return 'from-purple-400 to-indigo-400';
      case 'news': return 'from-pink-400 to-rose-400';
      case 'events': return 'from-green-400 to-emerald-400';
      case 'faq': return 'from-orange-400 to-amber-400';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getMaterialLabel = (type: string) => {
    switch (type) {
      case 'instructions': return 'База знаний';
      case 'recordings': return 'Записи';
      case 'news': return 'Новости';
      case 'events': return 'События';
      case 'faq': return 'FAQ';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-black">{cohortName}</h2>
          <p className="text-gray-500 mt-1">{productName} • Управление материалами</p>
        </div>
      </div>

      {availableMaterials && Object.keys(availableMaterials).map((materialType) => {
        const materials = availableMaterials[materialType as keyof AvailableMaterials];
        if (!materials || materials.length === 0) return null;

        const Icon = getMaterialIcon(materialType);
        const colorClass = getMaterialColor(materialType);
        const label = getMaterialLabel(materialType);

        return (
          <Card key={materialType} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">{label}</h3>
                  <p className="text-sm text-gray-500">
                    Назначено: {assignedMaterials.filter(m => m.material_type === materialType).length} из {materials.length}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleAssignSelected(materialType)}
                disabled={selectedMaterials[materialType]?.length === 0}
                className={`bg-gradient-to-r ${colorClass} hover:opacity-90 text-white`}
              >
                <Check className="h-4 w-4 mr-2" />
                Назначить выбранные ({selectedMaterials[materialType]?.length || 0})
              </Button>
            </div>

            <div className="space-y-3">
              {materials.map((material) => {
                const assigned = isAssigned(
                  materialType === 'instructions' ? 'instruction' :
                  materialType === 'recordings' ? 'recording' :
                  materialType === 'news' ? 'news' :
                  materialType === 'events' ? 'event' :
                  'faq',
                  material.id
                );
                const visible = getMaterialVisibility(
                  materialType === 'instructions' ? 'instruction' :
                  materialType === 'recordings' ? 'recording' :
                  materialType === 'news' ? 'news' :
                  materialType === 'events' ? 'event' :
                  'faq',
                  material.id
                );

                return (
                  <div
                    key={material.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      assigned
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {!assigned && (
                        <Checkbox
                          checked={selectedMaterials[materialType]?.includes(material.id)}
                          onCheckedChange={() => handleToggleMaterial(materialType, material.id)}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{material.title}</p>
                        {assigned && (
                          <div className="flex gap-2 mt-1">
                            <Badge className="bg-green-200 text-green-700 text-xs">
                              Назначен
                            </Badge>
                            {!visible && (
                              <Badge className="bg-gray-200 text-gray-700 text-xs">
                                Скрыт
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {assigned && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleToggleVisibility(
                            materialType === 'instructions' ? 'instruction' :
                            materialType === 'recordings' ? 'recording' :
                            materialType === 'news' ? 'news' :
                            materialType === 'events' ? 'event' :
                            'faq',
                            material.id
                          )}
                          variant="ghost"
                          size="sm"
                          title={visible ? "Скрыть" : "Показать"}
                        >
                          {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          onClick={() => handleRemoveMaterial(
                            materialType === 'instructions' ? 'instruction' :
                            materialType === 'recordings' ? 'recording' :
                            materialType === 'news' ? 'news' :
                            materialType === 'events' ? 'event' :
                            'faq',
                            material.id
                          )}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Удалить
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {availableMaterials && Object.values(availableMaterials).every(arr => arr.length === 0) && (
        <AdminEmptyState
          icon={<BookOpen className="h-10 w-10 text-gray-400" />}
          title="Нет доступных материалов"
          description="Добавьте материалы через систему управления ресурсами продукта"
          actionLabel="Вернуться"
          onAction={onBack}
        />
      )}
    </div>
  );
}
