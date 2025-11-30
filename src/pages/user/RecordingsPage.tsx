import { useParams } from "react-router-dom";
import { RecordedStreams } from "../../components/RecordedStreams";

export function RecordingsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <div className="mb-12">
        <h2 className="text-gray-900 mb-3 font-black text-4xl">Записи эфиров</h2>
        <p className="text-gray-600 text-lg">
          Все прошедшие занятия доступны для просмотра
        </p>
      </div>
      <RecordedStreams selectedItemId={id} />
    </div>
  );
}
