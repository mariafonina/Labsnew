import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { motion, AnimatePresence } from "motion/react";
import { Check, Sparkles, Newspaper, Calendar, BookOpen, Video, User, ArrowRight, Mail, Phone, Instagram, Send, Calendar as CalendarIcon } from "lucide-react";
import type { UserProfileData } from "./UserProfile";
import { Logo } from "./Logo";

interface OnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export function Onboarding({ open, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<UserProfileData>({
    nickname: "",
    gender: "",
    instagram: "",
    telegram: "",
    email: "",
    phone: "",
    birthdate: "",
  });

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Сохраняем профиль
      localStorage.setItem("userProfile", JSON.stringify(profile));
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleProfileChange = (field: keyof UserProfileData, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const canProceedFromProfile = profile.nickname && profile.gender && profile.email;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black backdrop-blur-xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        aria-describedby="onboarding-description"
      >
        <DialogTitle className="sr-only">Онбординг ЛАБС</DialogTitle>
        <DialogDescription id="onboarding-description" className="sr-only">
          Приветственный гайд по возможностям платформы ЛАБС
        </DialogDescription>
        
        {/* Header with LABS branding */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-400 to-rose-400 p-6 text-white shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="h-6 w-6" />
            <h1 className="font-black text-2xl tracking-tight">ЛАБС</h1>
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-center text-white/90 text-sm">
            Лаборатория искусственного интеллекта
          </p>
        </div>

        <div className="p-8">
          {/* Progress indicators */}
          <div className="flex gap-2 mb-8">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-400"
                  initial={{ width: 0 }}
                  animate={{ width: index <= currentStep ? "100%" : "0%" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="mb-8">
                  <div className="h-24 w-24 mx-auto rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center mb-6">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                  <h2 className="mb-4 text-white font-black text-4xl drop-shadow-lg">
                    Добро пожаловать в ЛАБС
                  </h2>
                  <p className="text-white/90 text-xl mb-3">
                    Лабораторию искусственного интеллекта
                  </p>
                  <p className="text-white/70 max-w-md mx-auto text-lg leading-relaxed">
                    Мы создали это пространство для вашего комфортного обучения. 
                    Давайте познакомимся с возможностями платформы!
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 1: News Feed */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="mb-8">
                  <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center mb-6 rotate-3 shadow-lg">
                    <Newspaper className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="mb-4 text-white font-black text-3xl drop-shadow-lg">
                    Лента новостей
                  </h2>
                  <p className="text-white/80 max-w-md mx-auto text-lg leading-relaxed">
                    Здесь вы найдёте важные анонсы, обновления материалов и уведомления 
                    о новых ответах на ваши вопросы. Не пропустите ничего важного!
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Calendar */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="mb-8">
                  <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center mb-6 -rotate-3 shadow-lg">
                    <Calendar className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="mb-4 text-white font-black text-3xl drop-shadow-lg">
                    Календарь эфиров
                  </h2>
                  <p className="text-white/80 max-w-md mx-auto text-lg leading-relaxed">
                    Все предстоящие занятия и Q&A сессии в одном месте. 
                    Задавайте вопросы заранее и получайте подробные ответы от экспертов.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Library & Recordings */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="mb-8">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center rotate-6 shadow-lg">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center -rotate-6 shadow-lg">
                      <Video className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h2 className="mb-4 text-white font-black text-3xl drop-shadow-lg">
                    База знаний 24/7
                  </h2>
                  <p className="text-white/80 max-w-md mx-auto text-lg leading-relaxed">
                    Все инструкции, записи эфиров и материалы доступны всегда. 
                    Учитесь в своём темпе, добавляйте заметки и задавайте вопросы к урокам.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 4: Profile Setup Introduction */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="mb-8">
                  <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center mb-6 shadow-lg">
                    <User className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="mb-4 text-white font-black text-3xl drop-shadow-lg">
                    Давайте познакомимся
                  </h2>
                  <p className="text-white/80 max-w-md mx-auto text-lg leading-relaxed">
                    Расскажите немного о себе, чтобы мы могли персонализировать 
                    ваш опыт обучения и настроить интерфейс под ваши предпочтения.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 5: Profile Form */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-6">
                  <h2 className="mb-2 text-white font-black text-2xl text-center drop-shadow-lg">
                    Заполните профиль
                  </h2>
                  <p className="text-white/70 text-center mb-6">
                    Обязательные поля отмечены звёздочкой (*)
                  </p>
                </div>

                <div className="space-y-4 max-w-md mx-auto">
                  {/* Nickname */}
                  <div className="space-y-2">
                    <Label htmlFor="nickname" className="flex items-center gap-2 font-semibold text-white">
                      <User className="h-4 w-4" />
                      Никнейм *
                    </Label>
                    <Input
                      id="nickname"
                      placeholder="Как к вам обращаться?"
                      value={profile.nickname}
                      onChange={(e) => handleProfileChange("nickname", e.target.value)}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-pink-400"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="font-semibold text-white">
                      Пол *
                    </Label>
                    <Select
                      value={profile.gender}
                      onValueChange={(value) => handleProfileChange("gender", value)}
                    >
                      <SelectTrigger id="gender" className="h-12 bg-white/10 border-white/20 text-white focus:border-pink-400 focus:ring-pink-400">
                        <SelectValue placeholder="Выберите пол" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20">
                        <SelectItem value="male" className="text-white focus:bg-white/10 focus:text-white">Мужчина</SelectItem>
                        <SelectItem value="female" className="text-white focus:bg-white/10 focus:text-white">Женщина</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 font-semibold text-white">
                      <Mail className="h-4 w-4" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@mail.com"
                      value={profile.email}
                      onChange={(e) => handleProfileChange("email", e.target.value)}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-pink-400"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 font-semibold text-white">
                      <Phone className="h-4 w-4" />
                      Телефон
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-pink-400"
                    />
                  </div>

                  {/* Instagram */}
                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2 font-semibold text-white">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      placeholder="@username"
                      value={profile.instagram}
                      onChange={(e) => handleProfileChange("instagram", e.target.value)}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-pink-400"
                    />
                  </div>

                  {/* Telegram */}
                  <div className="space-y-2">
                    <Label htmlFor="telegram" className="flex items-center gap-2 font-semibold text-white">
                      <Send className="h-4 w-4" />
                      Telegram
                    </Label>
                    <Input
                      id="telegram"
                      placeholder="@username"
                      value={profile.telegram}
                      onChange={(e) => handleProfileChange("telegram", e.target.value)}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-pink-400"
                    />
                  </div>

                  {/* Birthdate */}
                  <div className="space-y-2">
                    <Label htmlFor="birthdate" className="flex items-center gap-2 font-semibold text-white">
                      <CalendarIcon className="h-4 w-4" />
                      Дата рождения
                    </Label>
                    <Input
                      id="birthdate"
                      type="date"
                      value={profile.birthdate}
                      onChange={(e) => handleProfileChange("birthdate", e.target.value)}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-pink-400"
                      lang="ru"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {currentStep < 5 ? (
              <>
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="flex-1 text-white/70 hover:text-white hover:bg-white/10 h-14 font-bold"
                  >
                    Пропустить
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  className={`${
                    currentStep === 0 ? "w-full" : "flex-1"
                  } bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 hover:shadow-[0_0_30px_rgba(251,113,133,0.8)] text-white font-extrabold h-14 shadow-lg transition-all duration-200`}
                >
                  Далее
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceedFromProfile}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 hover:shadow-[0_0_30px_rgba(251,113,133,0.8)] text-white font-extrabold h-16 shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="mr-3 h-6 w-6" />
                Начать обучение
              </Button>
            )}
          </div>

          {currentStep === 5 && !canProceedFromProfile && (
            <p className="text-center text-sm text-white/60 mt-3">
              Заполните обязательные поля для продолжения
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}