import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductFormData {
  name: string;
  description: string;
  type: string;
  duration_weeks: number;
  default_price: number;
}

interface ProductFormProps {
  product?: any;
  onSubmit: (data: ProductFormData) => void;
}

export function ProductForm({ product, onSubmit }: ProductFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: product || {
      name: '',
      description: '',
      type: 'intensive',
      duration_weeks: 4,
      default_price: 0
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Название продукта *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Название обязательно' })}
          placeholder="Интенсив по Вайбкодингу"
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
          placeholder="Подробное описание продукта"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Тип продукта *</Label>
          <Select
            defaultValue={product?.type || 'intensive'}
            onValueChange={(value: string) => setValue('type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="intensive">Интенсив</SelectItem>
              <SelectItem value="course">Курс</SelectItem>
              <SelectItem value="webinar">Вебинар</SelectItem>
              <SelectItem value="mentorship">Менторство</SelectItem>
              <SelectItem value="workshop">Воркшоп</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="duration_weeks">Длительность (недели) *</Label>
          <Input
            id="duration_weeks"
            type="number"
            {...register('duration_weeks', {
              required: 'Длительность обязательна',
              min: { value: 1, message: 'Минимум 1 неделя' }
            })}
            placeholder="4"
          />
          {errors.duration_weeks && (
            <p className="text-sm text-red-500 mt-1">{errors.duration_weeks.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="default_price">Базовая цена (₽)</Label>
        <Input
          id="default_price"
          type="number"
          step="0.01"
          {...register('default_price', {
            min: { value: 0, message: 'Цена не может быть отрицательной' }
          })}
          placeholder="25000"
        />
        {errors.default_price && (
          <p className="text-sm text-red-500 mt-1">{errors.default_price.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">
          {product ? 'Сохранить изменения' : 'Создать продукт'}
        </Button>
      </div>
    </form>
  );
}
