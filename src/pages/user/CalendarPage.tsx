import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { EventsCalendar } from "../../components/EventsCalendar";

export function CalendarPage() {
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get("questionId");

  useEffect(() => {
    if (questionId) {
      // Scroll to question after render
      setTimeout(() => {
        const element = document.getElementById(`question-${questionId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("highlight-animation");
          setTimeout(() => {
            element.classList.remove("highlight-animation");
          }, 2000);
        }
      }, 300);
    }
  }, [questionId]);

  return (
    <div>
      <div className="mb-12">
        <h2 className="text-gray-900 mb-3 font-black text-4xl">Расписание</h2>
        <p className="text-gray-600 text-lg">
          Предстоящие занятия и события курса
        </p>
      </div>
      <EventsCalendar />
    </div>
  );
}
