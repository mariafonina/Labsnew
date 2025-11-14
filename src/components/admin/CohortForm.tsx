import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CohortFormData {
  name: string;
  start_date: string;
  end_date: string;
  max_members: number | null;
}

interface CohortFormProps {
  cohort?: any;
  onSubmit: (data: CohortFormData) => void;
}

export function CohortForm({ cohort, onSubmit }: CohortFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CohortFormData>({
    defaultValues: cohort ? {
      name: cohort.name,
      start_date: cohort.start_date.split('T')[0],
      end_date: cohort.end_date.split('T')[0],
      max_members: cohort.max_members
    } : {
      name: '',
      start_date: '',
      end_date: '',
      max_members: null
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Название потока *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Название обязательно' })}
          placeholder="Поток #1 (февраль 2025)"
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Дата начала *</Label>
          <Input
            id="start_date"
            type="date"
            {...register('start_date', { required: 'Дата начала обязательна' })}
          />
          {errors.start_date && (
            <p className="text-sm text-red-500 mt-1">{errors.start_date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="end_date">Дата окончания *</Label>
          <Input
            id="end_date"
            type="date"
            {...register('end_date', { required: 'Дата окончания обязательна' })}
          />
          {errors.end_date && (
            <p className="text-sm text-red-500 mt-1">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="max_members">Максимум участников</Label>
        <Input
          id="max_members"
          type="number"
          {...register('max_members', {
            valueAsNumber: true,
            min: { value: 1, message: 'Минимум 1 участник' }
          })}
          placeholder="Без ограничений"
        />
        {errors.max_members && (
          <p className="text-sm text-red-500 mt-1">{errors.max_members.message}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Оставьте пустым для неограниченного количества участников
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">
          {cohort ? 'Сохранить изменения' : 'Создать поток'}
        </Button>
      </div>
    </form>
  );
}
