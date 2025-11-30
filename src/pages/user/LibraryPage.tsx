import { useParams } from "react-router-dom";
import { InstructionsLibrary } from "../../components/InstructionsLibrary";

export function LibraryPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <div className="mb-12">
        <h2 className="text-gray-900 mb-3 font-black text-4xl">База знаний</h2>
        <p className="text-gray-600 text-lg">
          Инструкции, гайды и материалы по всем темам курса
        </p>
      </div>
      <InstructionsLibrary selectedItemId={id} />
    </div>
  );
}
