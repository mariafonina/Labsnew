import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Home } from "lucide-react";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <Card className="p-12 max-w-md text-center border-gray-200/60 bg-white/60 backdrop-blur-sm">
        <div className="mb-6">
          <h1 className="font-black text-9xl text-gray-200">404</h1>
        </div>
        <h2 className="font-black text-3xl text-gray-900 mb-4">
          Страница не найдена
        </h2>
        <p className="text-gray-600 mb-8">
          К сожалению, запрашиваемая страница не существует или была перемещена.
        </p>
        <Button
          onClick={() => navigate("/news")}
          className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold h-14 px-8 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          <Home className="h-5 w-5 mr-2" />
          На главную
        </Button>
      </Card>
    </div>
  );
}
