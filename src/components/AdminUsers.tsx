import { useState, useRef } from "react";
import { useApp } from "../contexts/AppContext";
import type { User } from "../contexts/AppContext";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  Download,
  Users as UsersIcon,
  Search,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { toast } from "sonner";

export function AdminUsers() {
  const { users, addUser, updateUser, deleteUser, importUsersFromCSV, exportUsersToCSV } = useApp();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "unspecified" as "male" | "female" | "unspecified",
    status: "active" as "active" | "inactive",
    role: "user" as "admin" | "user",
  });

  const resetForm = () => {
    setUserForm({
      name: "",
      email: "",
      phone: "",
      gender: "unspecified",
      status: "active",
      role: "user",
    });
    setIsAdding(false);
    setEditingUser(null);
  };

  const handleAddUser = () => {
    if (!userForm.name || !userForm.email) {
      toast.error("Заполните обязательные поля");
      return;
    }

    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      toast.error("Введите корректный email");
      return;
    }

    addUser({
      name: userForm.name,
      email: userForm.email,
      phone: userForm.phone || undefined,
      gender: userForm.gender === "unspecified" ? undefined : userForm.gender,
      status: userForm.status,
      role: userForm.role,
    });

    resetForm();
    toast.success("Пользователь добавлен");
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    if (!userForm.name || !userForm.email) {
      toast.error("Заполните обязательные поля");
      return;
    }

    updateUser(editingUser.id, {
      name: userForm.name,
      email: userForm.email,
      phone: userForm.phone || undefined,
      gender: userForm.gender === "unspecified" ? undefined : userForm.gender,
      status: userForm.status,
      role: userForm.role,
    });

    resetForm();
    toast.success("Пользователь обновлён");
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      gender: user.gender || "unspecified",
      status: user.status,
      role: user.role || "user",
    });
    setIsAdding(false);
  };

  const handleDelete = () => {
    if (!deletingUserId) return;
    deleteUser(deletingUserId);
    setDeletingUserId(null);
    toast.success("Пользователь удалён");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error("CSV файл пустой или содержит только заголовки");
          return;
        }

        // Пропускаем первую строку (заголовки)
        const dataLines = lines.slice(1);
        const importedUsers: Omit<User, "id" | "registeredAt">[] = [];

        for (const line of dataLines) {
          // Разбор CSV с учётом кавычек
          const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(val => 
            val.replace(/^"|"$/g, '').trim()
          ) || [];

          if (values.length < 2) continue; // Минимум имя и email

          const [name, email, phone, gender, , status] = values;

          // Валидация email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) continue;

          const genderValue = gender?.toLowerCase() === 'мужской' ? 'male' 
            : gender?.toLowerCase() === 'женский' ? 'female' 
            : undefined;

          const statusValue = status?.toLowerCase() === 'неактивен' ? 'inactive' : 'active';

          importedUsers.push({
            name,
            email,
            phone: phone || undefined,
            gender: genderValue,
            status: statusValue,
          });
        }

        if (importedUsers.length === 0) {
          toast.error("Не найдено валидных данных для импорта");
          return;
        }

        importUsersFromCSV(importedUsers);
        toast.success(`Импортировано ${importedUsers.length} пользователей`);
      } catch (error) {
        toast.error("Ошибка при чтении файла");
      }
    };

    reader.readAsText(file);
    // Сброс input для возможности загрузить тот же файл снова
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const csvContent = exportUsersToCSV();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Список пользователей экспортирован");
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-black text-5xl mb-2">Пользователи</h1>
          <p className="text-gray-500 text-lg">
            Управление пользователями курса • {users.length} {users.length === 1 ? 'пользователь' : 'пользователей'}
          </p>
        </div>
        {!isAdding && !editingUser && (
          <div className="flex gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="lg"
              className="border-2 hover:border-pink-300 hover:bg-pink-50"
            >
              <Upload className="h-5 w-5 mr-2" />
              Импорт CSV
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              size="lg"
              className="border-2 hover:border-pink-300 hover:bg-pink-50"
              disabled={users.length === 0}
            >
              <Download className="h-5 w-5 mr-2" />
              Экспорт CSV
            </Button>
            <Button
              onClick={() => setIsAdding(true)}
              size="lg"
              className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Добавить пользователя
            </Button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Form */}
      {(isAdding || editingUser) && (
        <Card className="p-8 shadow-lg border-2">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="font-black text-3xl">
              {editingUser ? "Редактировать пользователя" : "Новый пользователь"}
            </h3>
            <p className="text-gray-500 mt-2">
              Заполните все обязательные поля отмеченные звёздочкой *
            </p>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base mb-2 block">Имя *</Label>
                <Input
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Иван Иванов"
                  className="h-12 text-base"
                />
              </div>
              <div>
                <Label className="text-base mb-2 block">Email *</Label>
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="h-12 text-base"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-base mb-2 block">Телефон</Label>
                <Input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                  className="h-12 text-base"
                />
              </div>
              <div>
                <Label className="text-base mb-2 block">Пол</Label>
                <Select
                  value={userForm.gender}
                  onValueChange={(value: "male" | "female" | "unspecified") => 
                    setUserForm({ ...userForm, gender: value })
                  }
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Выберите пол" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">Не указан</SelectItem>
                    <SelectItem value="male">Мужской</SelectItem>
                    <SelectItem value="female">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base mb-2 block">Статус</Label>
                <Select
                  value={userForm.status}
                  onValueChange={(value: "active" | "inactive") => 
                    setUserForm({ ...userForm, status: value })
                  }
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="inactive">Неактивен</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-base mb-2 block">Роль</Label>
              <Select
                value={userForm.role}
                onValueChange={(value: "admin" | "user") => 
                  setUserForm({ ...userForm, role: value })
                }
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">👤 Пользователь</SelectItem>
                  <SelectItem value="admin">⭐ Администратор</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                💡 Администраторы имеют доступ к панели управления
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={editingUser ? handleUpdateUser : handleAddUser}
                size="lg"
                className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 px-8 shadow-md"
              >
                <Save className="h-5 w-5 mr-2" />
                {editingUser ? "Сохранить изменения" : "Добавить пользователя"}
              </Button>
              <Button onClick={resetForm} variant="outline" size="lg" className="px-8">
                <X className="h-5 w-5 mr-2" />
                Отмена
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      {!isAdding && !editingUser && users.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, email или телефону..."
            className="h-14 pl-12 text-base"
          />
        </div>
      )}

      {/* CSV Format Info */}
      {users.length === 0 && !isAdding && (
        <Card className="p-8 bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200">
          <h3 className="font-black text-xl mb-4">Формат CSV файла</h3>
          <p className="text-gray-700 mb-4">
            Для массового импорта пользователей подготовьте CSV файл со следующими колонками:
          </p>
          <div className="bg-white rounded-lg p-4 font-mono text-sm border border-pink-200">
            Имя,Email,Телефон,Пол,Дата регистрации,Статус,Последняя активность
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>• <span className="font-semibold">Имя</span> и <span className="font-semibold">Email</span> — обязательные поля</p>
            <p>• <span className="font-semibold">Пол</span>: Мужской или Женский</p>
            <p>• <span className="font-semibold">Статус</span>: Активен или Неактивен (по умолчанию Активен)</p>
            <p>• Дата регистрации и Последняя активность игнорируются при импорте</p>
          </div>
        </Card>
      )}

      {/* Users Table */}
      {users.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <div className="max-w-sm mx-auto">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="font-black text-2xl text-gray-900 mb-2">
              Нет пользователей
            </h3>
            <p className="text-gray-500 mb-6">
              Добавьте первого пользователя или импортируйте список из CSV файла
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setIsAdding(true)}
                size="lg"
                className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                Добавить пользователя
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="lg"
                className="border-2"
              >
                <Upload className="h-5 w-5 mr-2" />
                Импорт CSV
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden border-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-black">Имя</TableHead>
                  <TableHead className="font-black">Email</TableHead>
                  <TableHead className="font-black">Телефон</TableHead>
                  <TableHead className="font-black">Пол</TableHead>
                  <TableHead className="font-black">Роль</TableHead>
                  <TableHead className="font-black">Статус</TableHead>
                  <TableHead className="font-black">Дата регистрации</TableHead>
                  <TableHead className="font-black text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                      Пользователи не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-semibold">{user.name}</TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell className="text-gray-600">{user.phone || '—'}</TableCell>
                      <TableCell>
                        {user.gender === 'male' ? 'Мужской' : user.gender === 'female' ? 'Женский' : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.role === 'admin'
                              ? "bg-pink-100 text-pink-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.status === 'active'
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {user.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(user.registeredAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(user)}
                            className="hover:bg-gray-100"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingUserId(user.id)}
                            className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUserId} onOpenChange={() => setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Пользователь будет удалён из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}