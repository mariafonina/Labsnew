import { UserProfile } from "../../components/UserProfile";

export function ProfilePage() {
  return (
    <div>
      <div className="mb-12">
        <h2 className="text-gray-900 mb-3 font-black text-4xl">Мой профиль</h2>
        <p className="text-gray-600 text-lg">
          Управление личной информацией и настройками
        </p>
      </div>
      <UserProfile />
    </div>
  );
}
