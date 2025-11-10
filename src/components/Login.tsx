import { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Logo } from "./Logo";

interface LoginProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Заполните все поля");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Введите корректный email");
      return;
    }

    onLogin(email, password, rememberMe);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4">
      <Card className="w-full max-w-md p-8 border-gray-200/60 bg-white/80 backdrop-blur-sm shadow-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <Logo size="xl" />
          </div>
          <h1 className="font-black text-3xl text-gray-900 mb-2">
            Вход в аккаунт
          </h1>
          <p className="text-gray-600">
            Войдите, чтобы продолжить обучение
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 font-semibold text-gray-700">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-gray-300 focus:border-pink-400 focus:ring-pink-400"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 font-semibold text-gray-700">
              <Lock className="h-4 w-4" />
              Пароль
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pr-12 border-gray-300 focus:border-pink-400 focus:ring-pink-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-gray-300"
            />
            <Label
              htmlFor="remember"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Запомнить меня и не выходить из аккаунта
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Войти
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Забыли пароль?{" "}
            <a
              href="https://t.me/mashtab_sherif"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-pink-500 hover:text-pink-600 transition-colors"
            >
              Свяжитесь с поддержкой
            </a>
          </p>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              <span className="font-extrabold text-gray-700">Вход для администратора:</span>
              <br />
              email: admin@course.ru
              <br />
              пароль: admin123
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}