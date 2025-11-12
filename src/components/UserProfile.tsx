import { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { User, Instagram, Send, Mail, Phone, Calendar as CalendarIcon, Lock, Eye, EyeOff, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export interface UserProfileData {
  nickname: string;
  gender: "male" | "female" | "";
  instagram: string;
  telegram: string;
  email: string;
  phone: string;
  birthdate: string;
}

export function UserProfile() {
  const { logout } = useAuth();
  
  const [profile, setProfile] = useState<UserProfileData>(() => {
    const saved = localStorage.getItem("userProfile");
    return saved
      ? JSON.parse(saved)
      : {
          nickname: "",
          gender: "",
          instagram: "",
          telegram: "",
          email: "",
          phone: "",
          birthdate: "",
        };
  });

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSave = () => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    toast.success("Профиль успешно сохранён");
  };

  const handleChange = (field: keyof UserProfileData, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Заполните все поля");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Новые пароли не совпадают");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Пароль должен быть не менее 6 символов");
      return;
    }

    toast.info("Функция смены пароля будет добавлена в следующей версии");
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Вы вышли из аккаунта");
    } catch (error) {
      toast.error("Не удалось выйти из аккаунта");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8 border-gray-200/60 bg-white/60 backdrop-blur-sm">
        <div className="mb-8">
          <h3 className="font-black text-3xl text-gray-900 mb-2">
            Личная информация
          </h3>
          <p className="text-gray-600 text-base">
            Заполните информацию о себе
          </p>
        </div>

        <div className="space-y-6">
          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname" className="flex items-center gap-2 font-semibold text-gray-700">
              <User className="h-4 w-4" />
              Никнейм
            </Label>
            <Input
              id="nickname"
              placeholder="Введите ваш никнейм"
              value={profile.nickname}
              onChange={(e) => handleChange("nickname", e.target.value)}
              className="h-12"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender" className="font-semibold text-gray-700">
              Пол
            </Label>
            <Select
              value={profile.gender}
              onValueChange={(value: string) => handleChange("gender", value)}
            >
              <SelectTrigger id="gender" className="h-12">
                <SelectValue placeholder="Выберите пол" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Мужчина</SelectItem>
                <SelectItem value="female">Женщина</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2 font-semibold text-gray-700">
              <Instagram className="h-4 w-4" />
              Instagram
            </Label>
            <Input
              id="instagram"
              placeholder="@username"
              value={profile.instagram}
              onChange={(e) => handleChange("instagram", e.target.value)}
              className="h-12"
            />
          </div>

          {/* Telegram */}
          <div className="space-y-2">
            <Label htmlFor="telegram" className="flex items-center gap-2 font-semibold text-gray-700">
              <Send className="h-4 w-4" />
              Telegram
            </Label>
            <Input
              id="telegram"
              placeholder="@username"
              value={profile.telegram}
              onChange={(e) => handleChange("telegram", e.target.value)}
              className="h-12"
            />
          </div>

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
              value={profile.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="h-12"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 font-semibold text-gray-700">
              <Phone className="h-4 w-4" />
              Телефон
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={profile.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="h-12"
            />
          </div>

          {/* Birthdate */}
          <div className="space-y-2">
            <Label htmlFor="birthdate" className="flex items-center gap-2 font-semibold text-gray-700">
              <CalendarIcon className="h-4 w-4" />
              Дата рождения
            </Label>
            <Input
              id="birthdate"
              type="date"
              value={profile.birthdate}
              onChange={(e) => handleChange("birthdate", e.target.value)}
              className="h-12"
              placeholder="дд.мм.гггг"
              lang="ru"
            />
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button
            onClick={handleSave}
            className="h-12 w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500 border-0 font-extrabold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Сохранить изменения
          </Button>
        </div>
      </Card>

      {/* Change Password Section */}
      <Card className="p-8 border-gray-200/60 bg-white/60 backdrop-blur-sm mt-6">
        <div className="mb-6">
          <h3 className="font-black text-3xl text-gray-900 mb-2">
            Изменить пароль
          </h3>
          <p className="text-gray-600 text-base">
            Обновите пароль для входа в систему
          </p>
        </div>

        <div className="space-y-5">
          {/* Old Password */}
          <div className="space-y-2">
            <Label htmlFor="oldPassword" className="flex items-center gap-2 font-semibold text-gray-700">
              <Lock className="h-4 w-4" />
              Текущий пароль
            </Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOldPassword ? "text" : "password"}
                placeholder="Введите текущий пароль"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="h-12 pr-12 border-gray-300 focus:border-pink-400 focus:ring-pink-400"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showOldPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="flex items-center gap-2 font-semibold text-gray-700">
              <Lock className="h-4 w-4" />
              Новый пароль
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Введите новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 pr-12 border-gray-300 focus:border-pink-400 focus:ring-pink-400"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="flex items-center gap-2 font-semibold text-gray-700">
              <Lock className="h-4 w-4" />
              Подтвердите новый пароль
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Повторите новый пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 pr-12 border-gray-300 focus:border-pink-400 focus:ring-pink-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
          <Button
            onClick={handleChangePassword}
            className="h-12 w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Изменить пароль
          </Button>
        </div>
      </Card>

      {/* Logout Section */}
      <Card className="p-8 border-red-200/60 bg-white/60 backdrop-blur-sm mt-6">
        <div className="mb-6">
          <h3 className="font-black text-2xl text-gray-900 mb-2">
            Выход из аккаунта
          </h3>
          <p className="text-gray-600">
            Вы можете выйти из системы в любой момент
          </p>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="h-12 w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 font-extrabold transition-all duration-200"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Выйти из аккаунта
        </Button>
      </Card>
    </div>
  );
}