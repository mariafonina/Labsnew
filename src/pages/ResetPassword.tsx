import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Logo } from "../components/Logo";
import { apiClient } from "../api/client";
import { Eye, EyeOff } from "lucide-react";

export function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Токен не найден");
        setIsVerifying(false);
        return;
      }

      try {
        const response = await apiClient.verifyResetToken(token);
        if (response.valid) {
          setTokenValid(true);
        } else {
          setError(response.message || "Недействительный токен");
        }
      } catch (err) {
        setError("Ошибка проверки токена");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.resetPassword(token!, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при сбросе пароля");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-pulse text-pink-600 mb-4">
                Проверка токена...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="xl" />
            </div>
            <CardTitle className="text-3xl font-black">Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || "Недействительная или истекшая ссылка"}</AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate("/")}
              className="w-full mt-4 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
            >
              Вернуться к входу
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="xl" />
            </div>
            <CardTitle className="text-3xl font-black">Успех!</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Пароль успешно изменён. Перенаправление на страницу входа...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="xl" />
          </div>
          <CardTitle className="text-3xl font-black">Новый пароль</CardTitle>
          <CardDescription>Введите новый пароль для вашего аккаунта</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Новый пароль</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Подтвердите пароль</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
              disabled={isLoading}
            >
              {isLoading ? "Изменение пароля..." : "Изменить пароль"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
