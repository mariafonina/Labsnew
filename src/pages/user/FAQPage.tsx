import { FAQ } from "../../components/FAQ";

export function FAQPage() {
  return (
    <div>
      <div className="mb-12">
        <h2 className="text-gray-900 mb-3 font-black text-4xl">Вопрос-ответ (FAQ)</h2>
        <p className="text-gray-600 text-lg">
          Ответы на часто задаваемые вопросы о курсе
        </p>
      </div>
      <FAQ />
    </div>
  );
}
