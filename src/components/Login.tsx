import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "./Logo";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { Eye, EyeOff } from "lucide-react";

export function Login() {
  const { login, register } = useAuth();
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(loginUsername, loginPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register(regUsername, regEmail, regPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="xl" />
          </div>
          <CardTitle className="text-3xl font-black">Добро пожаловать</CardTitle>
          <CardDescription>Войдите в систему или создайте новый аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Имя пользователя</Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500" disabled={isLoading}>
                  {isLoading ? "Вход..." : "Войти"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="w-full text-pink-600 hover:text-pink-700"
                  disabled={isLoading}
                >
                  Забыли пароль?
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Имя пользователя</Label>
                  <Input
                    id="reg-username"
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Пароль (минимум 6 символов)</Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={isLoading}
                      className="h-12 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showRegPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500" disabled={isLoading}>
                  {isLoading ? "Регистрация..." : "Создать аккаунт"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <ForgotPasswordDialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} />
    </div>
  );
}