import { useState, useEffect, useRef } from "react";
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
  Eye,
  Mail,
  Filter,
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
import { apiClient } from "../api/client";
import { UserCard } from "./admin/UserCard";
import { AdminEmailCompose } from "./AdminEmailCompose";

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'user';
  created_at: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedUserForCard, setSelectedUserForCard] = useState<User | null>(null);
  const [showingEmailCompose, setShowingEmailCompose] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(20);

  // Single query state for atomic updates
  const [query, setQuery] = useState({
    page: 1,
    search: "",
    cohortId: "",
    productId: ""
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "user" as "admin" | "user",
  });

  useEffect(() => {
    loadUsers();
  }, [query]);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const loadFilters = async () => {
    try {
      const [cohortsData, productsData] = await Promise.all([
        apiClient.getCohorts(),
        apiClient.getProducts()
      ]);
      setCohorts(cohortsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load filters:", error);
    }
  };

  const loadUsers = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (abortController.signal.aborted) return;

      setLoading(true);
      const params: any = {
        page: query.page,
        limit: pageSize,
        signal: abortController.signal
      };

      if (query.cohortId) params.cohort_id = parseInt(query.cohortId);
      if (query.productId) params.product_id = parseInt(query.productId);
      if (query.search.trim()) params.search = query.search.trim();

      const response = await apiClient.getUsers(params);

      if (abortControllerRef.current === abortController && !abortController.signal.aborted) {
        setUsers(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalUsers(response.pagination.total);
      }
    } catch (error: any) {
      if (abortControllerRef.current === abortController && !abortController.signal.aborted) {
        toast.error("Не удалось загрузить пользователей");
        console.error("Failed to load users:", error);
      }
    } finally {
      if (abortControllerRef.current === abortController) {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setUserForm({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      role: "user",
    });
    setIsAdding(false);
    setEditingUser(null);
  };

  const handleAddUser = async () => {
    if (!userForm.username || !userForm.email || !userForm.password) {
      toast.error("Заполните обязательные поля: логин, email и пароль");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      toast.error("Введите корректный email");
      return;
    }

    if (userForm.password.length < 6) {
      toast.error("Пароль должен быть не менее 6 символов");
      return;
    }

    try {
      const newUser = await apiClient.createUser({
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        first_name: userForm.first_name || undefined,
        last_name: userForm.last_name || undefined,
        role: userForm.role,
      });

      setUsers([newUser, ...users]);
      resetForm();
      toast.success("Пользователь добавлен");
    } catch (error: any) {
      toast.error(error.message || "Не удалось добавить пользователя");
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!userForm.username || !userForm.email) {
      toast.error("Заполните обязательные поля: логин и email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      toast.error("Введите корректный email");
      return;
    }

    if (userForm.password && userForm.password.length < 6) {
      toast.error("Пароль должен быть не менее 6 символов");
      return;
    }

    try {
      const updated = await apiClient.updateUser(editingUser.id, {
        username: userForm.username,
        email: userForm.email,
        first_name: userForm.first_name || undefined,
        last_name: userForm.last_name || undefined,
        password: userForm.password || undefined,
        role: userForm.role,
      });

      setUsers(users.map((user) => (user.id === editingUser.id ? updated : user)));
      resetForm();
      toast.success("Пользователь обновлён");
    } catch (error: any) {
      toast.error(error.message || "Не удалось обновить пользователя");
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      password: "",
      role: user.role,
    });
    setIsAdding(false);
  };

  const handleDelete = async () => {
    if (!deletingUserId) return;

    try {
      await apiClient.deleteUser(deletingUserId);
      setUsers(users.filter((user) => user.id !== deletingUserId));
      setDeletingUserId(null);
      toast.success("Пользователь удалён");
    } catch (error: any) {
      toast.error(error.message || "Не удалось удалить пользователя");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          toast.error("CSV файл пустой или содержит только заголовки");
          return;
        }

        const dataLines = lines.slice(1);
        const importedUsers: any[] = [];

        for (const line of dataLines) {
          const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(val =>
            val.replace(/^"|"$/g, '').trim()
          ) || [];

          if (values.length < 2) continue;

          const [username, email, firstName, lastName] = values;

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) continue;

          importedUsers.push({
            username,
            email,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            password: Math.random().toString(36).slice(-8),
            role: "user" as const,
          });
        }

        if (importedUsers.length === 0) {
          toast.error("Не найдено валидных данных для импорта");
          return;
        }

        // Import users via API
        for (const userData of importedUsers) {
          try {
            await apiClient.createUser(userData);
          } catch (error) {
            console.error(`Failed to import user ${userData.username}:`, error);
          }
        }

        await loadUsers();
        toast.success(`Импортировано ${importedUsers.length} пользователей`);
      } catch (error) {
        toast.error("Ошибка при чтении файла");
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const headers = ['Логин', 'Email', 'Имя', 'Фамилия', 'Роль', 'Дата создания'];
    const rows = users.map(user => [
      user.username,
      user.email,
      user.first_name || '',
      user.last_name || '',
      user.role === 'admin' ? 'Администратор' : 'Пользователь',
      new Date(user.created_at).toLocaleDateString('ru-RU')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

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

  const handleUserClick = (user: User) => {
    setSelectedUserForCard(user);
  };

  // If showing email compose
  if (showingEmailCompose) {
    return <AdminEmailCompose onBack={() => setShowingEmailCompose(false)} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-pink-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-black text-5xl mb-2">Пользователи</h1>
          <p className="text-gray-500 text-lg">
            Управление пользователями курса • {totalUsers} {totalUsers === 1 ? 'пользователь' : 'пользователей'}
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
                <Label className="text-base mb-2 block">Логин *</Label>
                <Input
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="ivanov"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base mb-2 block">Имя</Label>
                <Input
                  value={userForm.first_name}
                  onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                  placeholder="Иван"
                  className="h-12 text-base"
                />
              </div>
              <div>
                <Label className="text-base mb-2 block">Фамилия</Label>
                <Input
                  value={userForm.last_name}
                  onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                  placeholder="Иванов"
                  className="h-12 text-base"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base mb-2 block">
                  Пароль {editingUser ? "(оставьте пустым, чтобы не менять)" : "*"}
                </Label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUser ? "••••••" : "Минимум 6 символов"}
                  className="h-12 text-base"
                />
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
            value={query.search}
            onChange={(e) => setQuery(prev => ({ ...prev, page: 1, search: e.target.value }))}
            placeholder="Поиск по логину, email, имени или фамилии..."
            className="h-14 pl-12 text-base"
          />
        </div>
      )}

      {/* Filters and Email Button */}
      {!isAdding && !editingUser && users.length > 0 && (
        <Card className="p-8 border-2 bg-gray-50">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-black text-2xl">Фильтры</h3>
              </div>

              <Button
                onClick={() => setShowingEmailCompose(true)}
                size="lg"
                className="bg-gradient-to-r from-purple-400 to-indigo-400 hover:from-purple-500 hover:to-indigo-500 shadow-lg hover:shadow-xl transition-all"
              >
                <Mail className="h-5 w-5 mr-2" />
                Отправить письмо
              </Button>
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Продукт</Label>
                <Select
                  value={query.productId || "all"}
                  onValueChange={(value) => setQuery(prev => ({
                    ...prev,
                    page: 1,
                    productId: value === "all" ? "" : value,
                    cohortId: value === "all" ? "" : prev.cohortId // Reset cohort if product changed
                  }))}
                >
                  <SelectTrigger className="h-12 bg-white border-2 hover:border-purple-300 transition-colors">
                    <SelectValue placeholder="Все продукты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все продукты</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cohort Filter - Only shows when product is selected */}
              {query.productId && (
                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <Label className="text-sm font-semibold text-gray-700">Поток</Label>
                  <Select
                    value={query.cohortId || "all"}
                    onValueChange={(value) => setQuery(prev => ({
                      ...prev,
                      page: 1,
                      cohortId: value === "all" ? "" : value
                    }))}
                  >
                    <SelectTrigger className="h-12 bg-white border-2 hover:border-pink-300 transition-colors">
                      <SelectValue placeholder="Все потоки" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все потоки</SelectItem>
                      {cohorts
                        .filter((c: any) => c.product_id?.toString() === query.productId)
                        .map((cohort: any) => (
                          <SelectItem key={cohort.id} value={cohort.id.toString()}>
                            {cohort.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Active Filters Display */}
            {(query.productId || query.cohortId) && (
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-600">
                      Активные фильтры:
                    </span>
                    {query.productId && (
                      <Badge className="bg-blue-500 hover:bg-blue-600 text-white pl-3 pr-2 py-1.5 transition-colors">
                        {products.find((p) => p.id.toString() === query.productId)?.name}
                        <button
                          onClick={() => setQuery(prev => ({ ...prev, page: 1, productId: "", cohortId: "" }))}
                          className="ml-2 hover:bg-blue-700 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {query.cohortId && (
                      <Badge className="bg-pink-500 hover:bg-pink-600 text-white pl-3 pr-2 py-1.5 transition-colors">
                        {cohorts.find((c) => c.id.toString() === query.cohortId)?.name}
                        <button
                          onClick={() => setQuery(prev => ({ ...prev, page: 1, cohortId: "" }))}
                          className="ml-2 hover:bg-pink-700 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(prev => ({ ...prev, page: 1, productId: "", cohortId: "" }))}
                    className="border-2 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Сбросить всё
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* CSV Format Info */}
      {users.length === 0 && !isAdding && (
        <Card className="p-8 bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200">
          <h3 className="font-black text-xl mb-4">Формат CSV файла</h3>
          <p className="text-gray-700 mb-4">
            Для массового импорта пользователей подготовьте CSV файл со следующими колонками:
          </p>
          <div className="bg-white rounded-lg p-4 font-mono text-sm border border-pink-200">
            Логин,Email,Имя,Фамилия
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>• <span className="font-semibold">Логин</span> и <span className="font-semibold">Email</span> — обязательные поля</p>
            <p>• Пароли будут сгенерированы автоматически (8 символов)</p>
            <p>• Все импортированные пользователи получат роль "Пользователь"</p>
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
                  <TableHead className="font-black">Логин</TableHead>
                  <TableHead className="font-black">Имя</TableHead>
                  <TableHead className="font-black">Email</TableHead>
                  <TableHead className="font-black">Роль</TableHead>
                  <TableHead className="font-black">Дата регистрации</TableHead>
                  <TableHead className="font-black text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      Пользователи не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-semibold">{user.username}</TableCell>
                      <TableCell className="text-gray-600">
                        {[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}
                      </TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
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
                      <TableCell className="text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUserClick(user)}
                            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* Pagination */}
      {!isAdding && !editingUser && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Показано {users.length} из {totalUsers} пользователей
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={query.page === 1}
            >
              Назад
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (query.page <= 3) {
                  pageNum = i + 1;
                } else if (query.page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = query.page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={query.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuery(prev => ({ ...prev, page: pageNum }))}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
              disabled={query.page === totalPages}
            >
              Вперёд
            </Button>
          </div>
        </div>
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

      {selectedUserForCard && (
        <UserCard
          user={selectedUserForCard}
          onClose={() => setSelectedUserForCard(null)}
        />
      )}
    </div>
  );
}
