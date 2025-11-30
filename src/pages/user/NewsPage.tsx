import { useNavigate } from "react-router-dom";
import { NewsFeed } from "../../components/NewsFeed";

export function NewsPage() {
  const navigate = useNavigate();

  const handleNavigateToQuestion = (
    eventId: string,
    eventType: "event" | "instruction" | "recording",
    questionId: string
  ) => {
    // For instructions and recordings, navigate to the item with question highlight
    // For events, navigate to calendar with question
    const routeMap = {
      event: `/calendar?questionId=${questionId}`,
      instruction: `/library/${eventId}?questionId=${questionId}`,
      recording: `/recordings/${eventId}?questionId=${questionId}`,
    };
    navigate(routeMap[eventType]);
  };

  return (
    <div>
      <div className="mb-12">
        <h2 className="text-gray-900 mb-3 font-black text-4xl">что нового</h2>
        <p className="text-gray-600 text-lg">
          Актуальные обновления и анонсы от преподавателей
        </p>
      </div>
      <div className="max-w-2xl">
        <NewsFeed onNavigateToQuestion={handleNavigateToQuestion} />
      </div>
    </div>
  );
}
