import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TierFormData {
  name: string;
  description: string;
  price: number;
  tier_level: number;
  features: { value: string }[];
  access_start_date?: string;
  access_end_date?: string;
}

interface TierFormProps {
  tier?: any;
  onSubmit: (data: any) => void;
}

export function TierForm({ tier, onSubmit }: TierFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<TierFormData>({
    defaultValues: tier ? {
      name: tier.name,
      description: tier.description,
      price: tier.price,
      tier_level: tier.tier_level,
      features: tier.features?.map((f: string) => ({ value: f })) || [{ value: '' }],
      access_start_date: tier.access_start_date || '',
      access_end_date: tier.access_end_date || ''
    } : {
      name: '',
      description: '',
      price: 0,
      tier_level: 1,
      features: [{ value: '' }],
      access_start_date: '',
      access_end_date: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'features'
  });

  const handleFormSubmit = (data: TierFormData) => {
    const formattedData = {
      ...data,
      features: data.features.map(f => f.value).filter(v => v.trim() !== '')
    };
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Название тарифа *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Название обязательно' })}
          placeholder="Базовый"
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Краткое описание тарифа"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Цена (₽) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register('price', {
              required: 'Цена обязательна',
              min: { value: 0, message: 'Цена не может быть отрицательной' }
            })}
            placeholder="15000"
          />
          {errors.price && (
            <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="tier_level">Уровень доступа *</Label>
          <Input
            id="tier_level"
            type="number"
            {...register('tier_level', {
              required: 'Уровень обязателен',
              min: { value: 1, message: 'Минимальный уровень: 1' }
            })}
            placeholder="1"
          />
          {errors.tier_level && (
            <p className="text-sm text-red-500 mt-1">{errors.tier_level.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            1 - базовый, 2 - стандарт, 3 - премиум и т.д.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="access_start_date">Дата начала доступа</Label>
          <Input
            id="access_start_date"
            type="date"
            {...register('access_start_date')}
          />
          <p className="text-xs text-gray-500 mt-1">
            Когда участники этого тарифа получат доступ
          </p>
        </div>

        <div>
          <Label htmlFor="access_end_date">Дата окончания доступа</Label>
          <Input
            id="access_end_date"
            type="date"
            {...register('access_end_date')}
          />
          <p className="text-xs text-gray-500 mt-1">
            Когда доступ закончится для этого тарифа
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Возможности тарифа</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ value: '' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...register(`features.${index}.value`)}
                placeholder="Доступ к базовым материалам"
              />
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">
          {tier ? 'Сохранить изменения' : 'Создать тариф'}
        </Button>
      </div>
    </form>
  );
}
