import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Lock, Users, Tag } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface Cohort {
  id: number;
  name: string;
  product_id: number;
  product_name?: string;
}

interface Tier {
  id: number;
  name: string;
  product_id: number;
  tier_level: number;
  product_name?: string;
}

interface AccessControlPanelProps {
  selectedCohorts: number[];
  selectedTiers: number[];
  onCohortsChange: (cohortIds: number[]) => void;
  onTiersChange: (tierIds: number[]) => void;
  cohorts: Cohort[];
  tiers: Tier[];
  className?: string;
}

export const AccessControlPanel: React.FC<AccessControlPanelProps> = ({
  selectedCohorts,
  selectedTiers,
  onCohortsChange,
  onTiersChange,
  cohorts,
  tiers,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'cohorts' | 'tiers'>('cohorts');

  const handleToggleCohort = (cohortId: number) => {
    if (selectedCohorts.includes(cohortId)) {
      onCohortsChange(selectedCohorts.filter((id) => id !== cohortId));
    } else {
      onCohortsChange([...selectedCohorts, cohortId]);
    }
  };

  const handleToggleTier = (tierId: number) => {
    if (selectedTiers.includes(tierId)) {
      onTiersChange(selectedTiers.filter((id) => id !== tierId));
    } else {
      onTiersChange([...selectedTiers, tierId]);
    }
  };

  const hasRestrictions = selectedCohorts.length > 0 || selectedTiers.length > 0;

  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-4 w-4 text-gray-500" />
        <h3 className="font-medium text-sm">Контроль доступа</h3>
        {hasRestrictions && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-auto">
            Ограничен
          </span>
        )}
      </div>

      <p className="text-xs text-gray-600 mb-4">
        Если не выбрано ничего, контент доступен всем. Выберите потоки или тарифы для ограничения доступа.
      </p>

      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'cohorts' | 'tiers')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cohorts">
            <Users className="h-4 w-4 mr-2" />
            Потоки ({selectedCohorts.length})
          </TabsTrigger>
          <TabsTrigger value="tiers">
            <Tag className="h-4 w-4 mr-2" />
            Тарифы ({selectedTiers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cohorts" className="mt-4">
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {cohorts.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">
                  Нет доступных потоков
                </div>
              ) : (
                cohorts.map((cohort) => (
                  <div
                    key={cohort.id}
                    className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                    onClick={() => handleToggleCohort(cohort.id)}
                  >
                    <Checkbox checked={selectedCohorts.includes(cohort.id)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{cohort.name}</div>
                      {cohort.product_name && (
                        <div className="text-xs text-gray-500">{cohort.product_name}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          {selectedCohorts.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onCohortsChange([])}
              className="w-full mt-2"
            >
              Очистить выбор
            </Button>
          )}
        </TabsContent>

        <TabsContent value="tiers" className="mt-4">
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {tiers.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">
                  Нет доступных тарифов
                </div>
              ) : (
                tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                    onClick={() => handleToggleTier(tier.id)}
                  >
                    <Checkbox checked={selectedTiers.includes(tier.id)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{tier.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          Уровень {tier.tier_level}
                        </span>
                      </div>
                      {tier.product_name && (
                        <div className="text-xs text-gray-500">{tier.product_name}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          {selectedTiers.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onTiersChange([])}
              className="w-full mt-2"
            >
              Очистить выбор
            </Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
