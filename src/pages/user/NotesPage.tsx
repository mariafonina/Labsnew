import { useNavigate } from "react-router-dom";
import { Notes } from "../../components/Notes";

export function NotesPage() {
  const navigate = useNavigate();

  const handleNavigateToItem = (linkedItem: any) => {
    const routeMap: Record<string, string> = {
      news: "/news",
      instruction: `/library/${linkedItem.id}`,
      recording: `/recordings/${linkedItem.id}`,
      event: `/calendar?itemId=${linkedItem.id}`,
    };
    const route = routeMap[linkedItem.type];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div>
      <div className="mb-12">
        <h2 className="text-gray-900 mb-3 font-black text-4xl">Мои заметки</h2>
        <p className="text-gray-600 text-lg">Ваши личные заметки и идеи</p>
      </div>
      <Notes onNavigateToItem={handleNavigateToItem} />
    </div>
  );
}
