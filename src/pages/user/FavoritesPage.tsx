import { Favorites } from "../../components/Favorites";

export function FavoritesPage() {
  return (
    <div>
      <div className="mb-12">
        <h2 className="text-gray-900 mb-3 font-black text-4xl">Избранное</h2>
        <p className="text-gray-600 text-lg">
          Сохранённые материалы для быстрого доступа
        </p>
      </div>
      <Favorites />
    </div>
  );
}
