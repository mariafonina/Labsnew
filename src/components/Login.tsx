import { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "./Logo";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export function Login() {
  const { login } = useAuth();
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(loginUsername, loginPassword);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.message || err?.error || "Ошибка входа. Проверьте учетные данные";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="login-username" className="flex items-center gap-2 font-semibold text-gray-700">
              <Mail className="h-4 w-4" />
              Имя пользователя
            </Label>
            <Input
              id="login-username"
              type="text"
              placeholder="Введите имя пользователя"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              required
              disabled={isLoading}
              className="h-12 border-gray-300 focus:border-pink-400 focus:ring-pink-400"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="login-password" className="flex items-center gap-2 font-semibold text-gray-700">
              <Lock className="h-4 w-4" />
              Пароль
            </Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showLoginPassword ? "text" : "password"}
                placeholder="Введите пароль"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 pr-12 border-gray-300 focus:border-pink-400 focus:ring-pink-400"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                tabIndex={-1}
              >
                {showLoginPassword ? (
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

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? "Вход..." : "Войти"}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Забыли пароль?{" "}
            <button
              type="button"
              onClick={() => setForgotPasswordOpen(true)}
              className="font-semibold text-pink-500 hover:text-pink-600 transition-colors"
              disabled={isLoading}
            >
              Восстановить доступ
            </button>
          </p>
        </div>
      </Card>
      <ForgotPasswordDialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} />
    </div>
  );
}