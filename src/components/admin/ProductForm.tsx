import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ProductStatus = 'not_for_sale' | 'pre_registration' | 'for_sale' | 'active';

interface ProductFormData {
  name: string;
  description: string;
  type: string;
  duration_weeks: number;
  default_price: number;
  status: ProductStatus;
  project_start_date?: string;
  project_end_date?: string;
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
      type: '',
      duration_weeks: 4,
      default_price: 0,
      status: 'not_for_sale',
      project_start_date: '',
      project_end_date: ''
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
          <Input
            id="type"
            {...register('type', { required: 'Тип продукта обязателен' })}
            placeholder="Интенсив по Вайбкодингу"
          />
          <p className="text-xs text-gray-500 mt-1">
            Например: Интенсив, Курс, Вебинар, Менторство
          </p>
          {errors.type && (
            <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
          )}
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

      <div>
        <Label htmlFor="status">Статус продукта *</Label>
        <Select
          defaultValue={product?.status || 'not_for_sale'}
          onValueChange={(value: string) => setValue('status', value as ProductStatus)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_for_sale">Не продается</SelectItem>
            <SelectItem value="pre_registration">Предрегистрация</SelectItem>
            <SelectItem value="for_sale">В продаже</SelectItem>
            <SelectItem value="active">Проведение проекта</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Статус определяет видимость продукта на главной странице
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="project_start_date">Дата начала проекта</Label>
          <Input
            id="project_start_date"
            type="date"
            {...register('project_start_date')}
          />
        </div>

        <div>
          <Label htmlFor="project_end_date">Дата окончания проекта</Label>
          <Input
            id="project_end_date"
            type="date"
            {...register('project_end_date')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">
          {product ? 'Сохранить изменения' : 'Создать продукт'}
        </Button>
      </div>
    </form>
  );
}
