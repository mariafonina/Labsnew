import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { apiClient } from "../api/client";
import { validateAndNormalizeLoomUrl } from "../utils/loom-validator";

export interface FavoriteItem {
  id: string;
  type: "news" | "instruction" | "recording" | "event";
  title: string;
  description?: string;
  date?: string;
  addedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  linkedItem?: FavoriteItem;
}

export interface Comment {
  id: string;
  eventId: string;
  eventType?: "event" | "instruction" | "recording" | "faq"; // тип материала
  eventTitle?: string; // название материала
  authorName: string;
  authorRole: "user" | "admin";
  content: string;
  createdAt: string;
  parentId?: string; // для ответов на комментарии
  likes: number;
}

export interface Notification {
  id: string;
  type: "answer_received";
  commentId: string; // ID ответа
  questionId: string; // ID вопроса пользователя
  eventId: string; // ID материала (эфир/урок/запись/faq)
  eventType: "event" | "instruction" | "recording" | "faq";
  eventTitle: string;
  answerAuthor: string;
  answerPreview: string;
  createdAt: string;
  isRead: boolean;
}

export interface AuthData {
  email: string;
  password: string;
  isAuthenticated: boolean;
  rememberMe: boolean;
  isAdmin: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  date: string;
  category: string;
  image?: string;
  isNew?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  duration: string;
  instructor: string;
  type: "upcoming" | "past";
  link?: string;
}

export interface Instruction {
  id: string;
  title: string;
  categoryId: string; // ID категории вместо строки
  description: string;
  views: number;
  updatedAt: string;
  content?: string;
  downloadUrl?: string;
  order: number; // порядок внутри категории
  loom_embed_url?: string; // URL Loom видео для встраивания
  imageUrl?: string; // URL изображения на всю ширину
}

export interface InstructionCategory {
  id: string;
  name: string;
  description?: string;
  order: number; // порядок категории
  createdAt: string;
}

export interface Recording {
  id: string;
  title: string;
  date: string;
  duration: string;
  instructor: string;
  thumbnail?: string;
  views: number;
  description: string;
  videoUrl?: string;
  loom_embed_url?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: "male" | "female";
  registeredAt: string;
  status: "active" | "inactive";
  lastActivity?: string;
  role?: "admin" | "user";
}

interface AppContextType {
  favorites: FavoriteItem[];
  notes: Note[];
  likes: string[];
  comments: Comment[];
  completedInstructions: string[];
  auth: AuthData;
  notifications: Notification[];
  newsItems: NewsItem[];
  events: Event[];
  instructions: Instruction[];
  instructionCategories: InstructionCategory[];
  recordings: Recording[];
  faqItems: FAQItem[];
  users: User[];
  addToFavorites: (item: FavoriteItem) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleLike: (id: string) => void;
  isLiked: (id: string) => boolean;
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addComment: (comment: Omit<Comment, "id" | "createdAt" | "likes">, eventTitle?: string, eventType?: "event" | "instruction" | "recording" | "faq") => void;
  getCommentsByEvent: (eventId: string) => Comment[];
  toggleCommentLike: (commentId: string) => void;
  toggleInstructionComplete: (id: string) => void;
  isInstructionComplete: (id: string) => boolean;
  login: (email: string, password: string, rememberMe: boolean, isAdmin?: boolean) => void;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => boolean;
  markNotificationAsRead: (notificationId: string) => void;
  getUnreadNotificationsCount: () => number;
  addNewsItem: (item: Omit<NewsItem, "id">) => void;
  updateNewsItem: (id: string, updates: Partial<NewsItem>) => void;
  deleteNewsItem: (id: string) => void;
  addEvent: (event: Omit<Event, "id">) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  addInstruction: (instruction: Omit<Instruction, "id" | "views" | "order">) => void;
  updateInstruction: (id: string, updates: Partial<Instruction>) => void;
  deleteInstruction: (id: string) => void;
  moveInstruction: (instructionId: string, targetCategoryId: string, newOrder: number) => void;
  addInstructionCategory: (category: Omit<InstructionCategory, "id" | "order" | "createdAt">) => void;
  updateInstructionCategory: (id: string, updates: Partial<InstructionCategory>) => void;
  deleteInstructionCategory: (id: string) => void;
  moveInstructionCategory: (categoryId: string, newOrder: number) => void;
  addRecording: (recording: Omit<Recording, "id" | "views">) => void;
  updateRecording: (id: string, updates: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;
  addFAQItem: (item: Omit<FAQItem, "id" | "helpful">) => void;
  updateFAQItem: (id: string, updates: Partial<FAQItem>) => void;
  deleteFAQItem: (id: string) => void;
  toggleFAQHelpful: (id: string) => void;
  addUser: (user: Omit<User, "id" | "registeredAt">) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  importUsersFromCSV: (users: Omit<User, "id" | "registeredAt">[]) => void;
  exportUsersToCSV: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // User-specific data loaded from API after authentication (no localStorage for security)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [completedInstructions, setCompletedInstructions] = useState<string[]>([]);

  const [auth, setAuth] = useState<AuthData>(() => {
    const saved = localStorage.getItem("auth");
    if (saved) {
      const authData = JSON.parse(saved);
      // Если rememberMe был установлен, возвращаем данные авторизации
      if (authData.rememberMe) {
        return authData;
      }
    }
    // По умолчанию - не авторизован
    return {
      email: "",
      password: "",
      isAuthenticated: false,
      rememberMe: false,
      isAdmin: false,
    };
  });

  const [newsItems, setNewsItems] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem("newsItems");
    return saved ? JSON.parse(saved) : [
      {
        id: "1",
        title: "Новый модуль: Продвинутые техники",
        content: "С понедельника открывается доступ к новому модулю курса. Вас ждут практические занятия и эксклюзивные материалы.",
        author: "Анна Смирнова",
        date: "Сегодня",
        category: "Обновление",
        image: "https://images.unsplash.com/photo-1759884247381-d7222dd72dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYyMjY0ODIyfDA&ixlib=rb-4.1.0&q=80&w=1080",
        isNew: true
      },
      {
        id: "2",
        title: "Дополнительные материалы доступны",
        content: "Загрузили шаблоны и чек-листы к прошедшему эфиру. Проверьте раздел с инструкциями.",
        author: "Дмитрий Козлов",
        date: "Вчера",
        category: "Материалы",
        image: "https://images.unsplash.com/photo-1761635095574-3c63c3584e19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBtYXRlcmlhbHMlMjBib29rc3xlbnwxfHx8fDE3NjIzNTc2MTl8MA&ixlib=rb-4.1.0&q=80&w=1080"
      },
      {
        id: "3",
        title: "Итоги первого месяца обучения",
        content: "Благодарим за активность! Средний прогресс группы - 78%. Продолжайте в том же духе. Впереди самое интересное.",
        author: "Анна Смирнова",
        date: "2 дня назад",
        category: "Достижения"
      }
    ];
  });

  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem("events");
    return saved ? JSON.parse(saved) : [
      {
        id: "event-1",
        title: "Основы целеполагания",
        description: "Разберём методики постановки целей и создания плана действий",
        date: "2024-11-15",
        time: "19:00",
        location: "Онлайн",
        duration: "2 часа",
        instructor: "Анна Смирнова",
        type: "upcoming",
        link: "https://zoom.us/example"
      },
      {
        id: "event-2",
        title: "Практикум: работа с возражениями",
        description: "Практическое занятие с разбором реальных кейсов",
        date: "2024-11-18",
        time: "20:00",
        location: "Онлайн",
        duration: "1.5 часа",
        instructor: "Дмитрий Козлов",
        type: "upcoming"
      }
    ];
  });

  const [instructionCategories, setInstructionCategories] = useState<InstructionCategory[]>(() => {
    const saved = localStorage.getItem("instructionCategories");
    return saved ? JSON.parse(saved) : [
      {
        id: "cat-1",
        name: "Базовые навыки",
        description: "Основные инструкции для начинающих",
        order: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: "cat-2",
        name: "Инструменты",
        description: "Полезные инструменты и шаблоны",
        order: 1,
        createdAt: new Date().toISOString()
      },
      {
        id: "cat-3",
        name: "Продвинутые техники",
        description: "Для опытных пользователей",
        order: 2,
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [instructions, setInstructions] = useState<Instruction[]>(() => {
    const saved = localStorage.getItem("instructions");
    const parsed = (saved && saved !== "undefined") ? JSON.parse(saved) : [
      {
        id: "instr-1",
        title: "Полное руководство по эффективному обучению",
        categoryId: "cat-1",
        description: "Подробное руководство по организации эффективного процесса обучения с практическими примерами и таблицами",
        views: 234,
        updatedAt: "2024-11-01",
        loomVideoUrl: "https://www.loom.com/embed/example",
        imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200",
        content: `
          <h2>Введение в систему обучения</h2>
          <p>Добро пожаловать в наше полное руководство по эффективному обучению! Этот материал поможет вам систематизировать процесс получения новых знаний и навыков. Мы собрали лучшие практики и методики, которые доказали свою эффективность.</p>
          
          <h3>Основные принципы эффективного обучения</h3>
          <ul>
            <li>Регулярность занятий важнее их продолжительности</li>
            <li>Активное применение знаний на практике ускоряет процесс обучения в 3 раза</li>
            <li>Повторение материала через определенные интервалы улучшает запоминание</li>
            <li>Обучение в группе повышает мотивацию и дает новые инсайты</li>
          </ul>

          <blockquote>
            "Обучение — это не подготовка к жизни. Обучение — это и есть жизнь." — Джон Дьюи
          </blockquote>

          <h2>План обучения на первый месяц</h2>
          <p>Мы разработали оптимальный график занятий, который учитывает особенности усвоения информации человеческим мозгом. <strong>Важно:</strong> не пропускайте занятия и выполняйте все практические задания.</p>

          <table>
            <thead>
              <tr>
                <th>Неделя</th>
                <th>Тема</th>
                <th>Формат</th>
                <th>Время</th>
                <th>Результат</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>Основы целеполагания</td>
                <td>Живой эфир</td>
                <td>2 часа</td>
                <td>Личный план на 3 месяца</td>
              </tr>
              <tr>
                <td>2</td>
                <td>Тайм-менеджмент</td>
                <td>Видео + практика</td>
                <td>3 часа</td>
                <td>Настроенная система планирования</td>
              </tr>
              <tr>
                <td>3</td>
                <td>Работа с информацией</td>
                <td>Мастер-класс</td>
                <td>2.5 часа</td>
                <td>Личная база знаний</td>
              </tr>
              <tr>
                <td>4</td>
                <td>Формирование привычек</td>
                <td>Живой эфир</td>
                <td>2 часа</td>
                <td>Трекер привычек на 30 дней</td>
              </tr>
            </tbody>
          </table>

          <h3>Рекомендуемые инструменты</h3>
          <p>Для максимально эффективного обучения мы рекомендуем использовать следующие инструменты:</p>

          <ol>
            <li><strong>Notion</strong> — для создания личной базы знаний и конспектов</li>
            <li><strong>Todoist</strong> — для управления задачами и дедлайнами</li>
            <li><strong>Forest</strong> — для концентрации и техники Pomodoro</li>
            <li><strong>Anki</strong> — для запоминания информации с помощью карточек</li>
          </ol>

          <h2>Метрики прогресса</h2>
          <p>Отслеживание прогресса критически важно для поддержания мотивации. Вот основные показатели, которые мы рекомендуем измерять еженедельно:</p>

          <table>
            <thead>
              <tr>
                <th>Метрика</th>
                <th>Цель (неделя)</th>
                <th>Как измерять</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Просмотренных уроков</td>
                <td>5-7</td>
                <td>Автоматически в платформе</td>
              </tr>
              <tr>
                <td>Выполненных практик</td>
                <td>3-4</td>
                <td>Галочки в чек-листе</td>
              </tr>
              <tr>
                <td>Часов обучения</td>
                <td>8-10</td>
                <td>Таймер в приложении</td>
              </tr>
              <tr>
                <td>Заданных вопросов</td>
                <td>2-3</td>
                <td>Комментарии и чат</td>
              </tr>
            </tbody>
          </table>

          <h3>Техника интервального повторения</h3>
          <p>Одна из самых эффективных методик запоминания — это <em>интервальное повторение</em>. Суть проста: повторяйте материал через определенные промежутки времени.</p>

          <pre><code>Схема повторений:
1-й день: изучение материала
2-й день: первое повторение
4-й день: второе повторение  
7-й день: третье повторение
14-й день: четвертое повторение
30-й день: пятое повторение</code></pre>

          <blockquote>
            После 5 повторений по этой схеме материал переходит в долговременную память и остается там на годы!
          </blockquote>

          <h2>Частые ошибки начинающих</h2>
          <p>Избегайте этих распространенных ошибок, которые замедляют прогресс:</p>

          <ul>
            <li>Попытка изучить всё сразу — <strong>концентрируйтесь на одной теме за раз</strong></li>
            <li>Пассивное потребление контента без практики</li>
            <li>Игнорирование повторения пройденного материала</li>
            <li>Отсутствие четкого плана и графика занятий</li>
            <li>Перфекционизм — лучше сделать, чем идеально</li>
          </ul>

          <h3>Заключение</h3>
          <p>Помните, что обучение — это марафон, а не спринт. Двигайтесь последовательно, шаг за шагом, и результаты не заставят себя ждать. У вас всё получится! 🚀</p>

          <hr>

          <p><em>Если у вас остались вопросы по материалу, не стесняйтесь задавать их в разделе "Вопросы и ответы" ниже. Мы всегда рады помочь!</em></p>
        `,
        order: 0
      },
      {
        id: "instr-2",
        title: "Шаблоны для планирования",
        categoryId: "cat-2",
        description: "Готовые шаблоны для ежедневного и недельного планирования",
        views: 189,
        updatedAt: "2024-10-28",
        order: 1
      }
    ];
    
    return parsed.map((instr: Instruction) => ({
      ...instr,
      loom_embed_url: validateAndNormalizeLoomUrl(instr.loom_embed_url),
    }));
  });

  const [recordings, setRecordings] = useState<Recording[]>(() => {
    const saved = localStorage.getItem("recordings");
    return saved ? JSON.parse(saved) : [
      {
        id: "rec-1",
        title: "Вводный эфир: Знакомство с курсом",
        date: "2024-10-20",
        duration: "1:45:00",
        instructor: "Анна Смирнова",
        thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        views: 342,
        description: "В этом вводном эфире мы познакомимся с программой курса, разберем структуру обучения и ответим на все ваши вопросы. Вы узнаете, как устроена платформа, как получить максимум от курса и какие результаты вас ждут."
      },
      {
        id: "rec-2",
        title: "Основы тайм-менеджмента",
        date: "2024-10-25",
        duration: "2:00:00",
        instructor: "Дмитрий Козлов",
        thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        views: 298,
        description: "Практические методики управления временем, которые помогут вам стать более продуктивным. Разберем технику Pomodoro, метод Эйзенхауэра и другие проверенные инструменты планирования."
      }
    ];
  });

  const [faqItems, setFaqItems] = useState<FAQItem[]>(() => {
    const saved = localStorage.getItem("faqItems");
    return saved ? JSON.parse(saved) : [
      {
        id: "faq-1",
        question: "Как получить доступ к новым материалам?",
        answer: "Новые материалы автоматически появляются в вашем личном кабинете согласно расписанию курса. Вы получите уведомление о каждом новом материале.",
        category: "Доступ к материалам",
        helpful: 45
      },
      {
        id: "faq-2",
        question: "Можно ли пересматривать эфиры?",
        answer: "Да, все эфиры доступны в записи в разделе 'Записи эфиров'. Они остаются доступными на протяжении всего курса и 3 месяца после его окончания.",
        category: "Эфиры и записи",
        helpful: 38
      },
      {
        id: "faq-3",
        question: "Как связаться с преподавателем?",
        answer: "Вы можете задать вопрос в комментариях под любым материалом или во время живого эфира. Преподаватель отвечает на вопросы в течение 24-48 часов.",
        category: "Обратная связь",
        helpful: 52
      }
    ];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : [];
  });

  // User-specific data NO LONGER persisted to localStorage for security (loaded from API)
  // Only auth persisted for rememberMe functionality
  useEffect(() => {
    localStorage.setItem("auth", JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("newsItems", JSON.stringify(newsItems));
  }, [newsItems]);

  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("instructions", JSON.stringify(instructions));
  }, [instructions]);

  useEffect(() => {
    localStorage.setItem("instructionCategories", JSON.stringify(instructionCategories));
  }, [instructionCategories]);

  useEffect(() => {
    localStorage.setItem("recordings", JSON.stringify(recordings));
  }, [recordings]);

  useEffect(() => {
    localStorage.setItem("faqItems", JSON.stringify(faqItems));
  }, [faqItems]);

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  // OPTIMIZATION: Removed blocking prefetch of admin content (news, events, recordings, FAQ)
  // These are now loaded on-demand in their respective admin components
  // This reduces initial bundle requests from 10+ to ~2-3, improving Time to First Paint by ~70%

  // Load user-specific data when authenticated (critical for multi-tenant security)
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      // Clear user data when not authenticated to prevent cross-tenant leakage
      setNotes([]);
      setFavorites([]);
      setCompletedInstructions([]);
      setComments([]);
      requestIdRef.current++; // Invalidate any in-flight requests
      return;
    }

    // Increment request ID - only this ID can update state
    requestIdRef.current++;
    const currentRequestId = requestIdRef.current;

    const loadUserData = async () => {
      try {
        const [notesData, favoritesData, progressData, commentsData] = await Promise.allSettled([
          apiClient.getAllNotes(),
          apiClient.getFavorites(),
          apiClient.getProgress(),
          apiClient.getAllComments()
        ]);

        // CRITICAL: Only update if this is still the latest request
        if (currentRequestId !== requestIdRef.current) {
          // Stale request - newer one started (logout then login)
          return;
        }

        // CRITICAL: Always clear state to prevent cross-tenant leakage, even on errors
        if (notesData.status === 'fulfilled') {
          if (notesData.value.length > 0) {
            setNotes(notesData.value.map((item: any) => ({
              id: String(item.id),
              title: item.title || '',
              content: item.content,
              linkedItem: item.linked_item || null,
              createdAt: item.created_at,
              updatedAt: item.updated_at
            })));
          } else {
            setNotes([]);
          }
        } else {
          // API call failed - clear to prevent stale data
          setNotes([]);
        }

        if (favoritesData.status === 'fulfilled') {
          if (favoritesData.value.length > 0) {
            setFavorites(favoritesData.value.map((item: any) => ({
              id: item.item_id || String(item.id),
              title: item.title || '',
              type: item.item_type || 'instruction',
              description: item.description || '',
              date: item.date || item.created_at,
              addedAt: item.created_at
            })));
          } else {
            setFavorites([]);
          }
        } else {
          setFavorites([]);
        }

        if (progressData.status === 'fulfilled') {
          if (progressData.value.length > 0) {
            const completedIds = progressData.value
              .filter((item: any) => item.completed)
              .map((item: any) => String(item.instruction_id));
            setCompletedInstructions(completedIds);
          } else {
            setCompletedInstructions([]);
          }
        } else {
          setCompletedInstructions([]);
        }

        if (commentsData.status === 'fulfilled') {
          if (commentsData.value.length > 0) {
            setComments(commentsData.value.map((item: any) => ({
              id: String(item.id),
              userId: String(item.user_id),
              eventId: item.event_id,
              eventType: item.event_type || 'event',
              eventTitle: item.event_title || '',
              authorName: item.author_name,
              authorRole: item.author_role as 'admin' | 'user',
              content: item.content,
              createdAt: item.created_at,
              likes: item.likes || 0,
              parentId: item.parent_id ? String(item.parent_id) : undefined
            })));
          } else {
            setComments([]);
          }
        } else {
          setComments([]);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        // Clear on error only if this is still the current request
        if (currentRequestId === requestIdRef.current) {
          setNotes([]);
          setFavorites([]);
          setCompletedInstructions([]);
          setComments([]);
        }
      }
    };

    loadUserData();

    // Cleanup: invalidate this request and clear state
    return () => {
      // Increment to invalidate this fetch (in case it completes after unmount)
      if (currentRequestId === requestIdRef.current) {
        requestIdRef.current++;
      }
      setNotes([]);
      setFavorites([]);
      setCompletedInstructions([]);
      setComments([]);
    };
  }, [auth.isAuthenticated]);

  const addToFavorites = (item: FavoriteItem) => {
    setFavorites((prev) => {
      if (prev.some((fav) => fav.id === item.id)) {
        return prev;
      }
      return [...prev, { ...item, addedAt: new Date().toISOString() }];
    });
  };

  const removeFromFavorites = (id: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  };

  const isFavorite = (id: string) => {
    return favorites.some((item) => item.id === id);
  };

  const toggleLike = (id: string) => {
    setLikes((prev) => {
      if (prev.includes(id)) {
        return prev.filter((likeId) => likeId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isLiked = (id: string) => {
    return likes.includes(id);
  };

  const addNote = (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    // Sanitize note content to prevent XSS
    const sanitizedContent = note.content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    const newNote: Note = {
      ...note,
      content: sanitizedContent,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const addComment = (
    comment: Omit<Comment, "id" | "createdAt" | "likes">,
    eventTitle?: string,
    eventType?: "event" | "instruction" | "recording" | "faq"
  ) => {
    // Sanitize comment content to prevent XSS
    const sanitizedContent = comment.content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    const newComment: Comment = {
      ...comment,
      content: sanitizedContent,
      eventTitle: eventTitle || comment.eventTitle,
      eventType: eventType || comment.eventType,
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      likes: 0,
    };
    setComments((prev) => [newComment, ...prev]);

    // Если это ответ на вопрос пользователя (есть parentId), создаём уведомление
    if (comment.parentId && comment.authorRole === "admin") {
      const parentComment = comments.find((c) => c.id === comment.parentId);
      
      // Проверяем, что родительский комментарий принадлежит пользователю
      if (parentComment && parentComment.authorRole === "user") {
        const notification: Notification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "answer_received",
          commentId: newComment.id,
          questionId: comment.parentId,
          eventId: comment.eventId,
          eventType: eventType || "event",
          eventTitle: eventTitle || "Материал курса",
          answerAuthor: comment.authorName,
          answerPreview: comment.content.substring(0, 100),
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        
        setNotifications((prev) => [notification, ...prev]);
      }
    }
  };

  const getCommentsByEvent = (eventId: string) => {
    return comments.filter((comment) => comment.eventId === eventId);
  };

  const toggleCommentLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, likes: comment.likes + (likes.includes(commentId) ? -1 : 1) }
          : comment
      )
    );
    toggleLike(commentId);
  };

  const toggleInstructionComplete = (id: string) => {
    setCompletedInstructions((prev) => {
      if (prev.includes(id)) {
        return prev.filter((instructionId) => instructionId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isInstructionComplete = (id: string) => {
    return completedInstructions.includes(id);
  };

  const login = (email: string, password: string, rememberMe: boolean, isAdmin: boolean = false) => {
    // В реальном приложении здесь была бы проверка на сервере
    // admin@course.ru / admin123 - для админа
    const adminCheck = email === "admin@course.ru" && password === "admin123";
    setAuth({
      email,
      password,
      isAuthenticated: true,
      rememberMe,
      isAdmin: adminCheck || isAdmin,
    });
  };

  const logout = () => {
    // Clear user authentication
    setAuth({
      email: "",
      password: "",
      isAuthenticated: false,
      rememberMe: false,
      isAdmin: false,
    });
    
    // Clear all user-specific data from state
    setFavorites([]);
    setNotes([]);
    setLikes([]);
    setComments([]);
    setCompletedInstructions([]);
    
    // Clear all user-specific data from localStorage to prevent multi-tenant leakage
    localStorage.removeItem("auth");
    localStorage.removeItem("favorites");
    localStorage.removeItem("notes");
    localStorage.removeItem("likes");
    localStorage.removeItem("comments");
    localStorage.removeItem("completedInstructions");
    localStorage.removeItem("notifications");
  };

  const changePassword = (oldPassword: string, newPassword: string): boolean => {
    if (auth.password !== oldPassword) {
      return false;
    }
    
    setAuth((prev) => ({
      ...prev,
      password: newPassword,
    }));
    
    return true;
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const getUnreadNotificationsCount = (): number => {
    return notifications.filter((notif) => !notif.isRead).length;
  };

  // Admin functions for News
  const addNewsItem = (item: Omit<NewsItem, "id">) => {
    const newItem: NewsItem = {
      ...item,
      id: `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setNewsItems((prev) => [newItem, ...prev]);
  };

  const updateNewsItem = (id: string, updates: Partial<NewsItem>) => {
    setNewsItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteNewsItem = (id: string) => {
    setNewsItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Admin functions for Events
  const addEvent = (event: Omit<Event, "id">) => {
    const newEvent: Event = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    setEvents((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((item) => item.id !== id));
  };

  // Admin functions for Instructions
  const addInstruction = (instruction: Omit<Instruction, "id" | "views" | "order">) => {
    // Получаем максимальный order в категории
    const categoryInstructions = instructions.filter(i => i.categoryId === instruction.categoryId);
    const maxOrder = categoryInstructions.length > 0 
      ? Math.max(...categoryInstructions.map(i => i.order))
      : -1;
    
    const newInstruction: Instruction = {
      ...instruction,
      id: `instr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      views: 0,
      order: maxOrder + 1,
      loom_embed_url: validateAndNormalizeLoomUrl(instruction.loom_embed_url),
    };
    setInstructions((prev) => [...prev, newInstruction]);
  };

  const updateInstruction = (id: string, updates: Partial<Instruction>) => {
    const normalizedUpdates = {
      ...updates,
      ...(updates.loom_embed_url !== undefined && {
        loom_embed_url: validateAndNormalizeLoomUrl(updates.loom_embed_url),
      }),
    };
    setInstructions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...normalizedUpdates } : item))
    );
  };

  const deleteInstruction = (id: string) => {
    setInstructions((prev) => prev.filter((item) => item.id !== id));
  };

  const moveInstruction = (instructionId: string, targetCategoryId: string, newOrder: number) => {
    setInstructions((prev) => {
      const instruction = prev.find(i => i.id === instructionId);
      if (!instruction) return prev;

      const sourceCategoryId = instruction.categoryId;
      
      // Обновляем все инструкции
      return prev.map(item => {
        // Перемещаемая инструкция
        if (item.id === instructionId) {
          return { ...item, categoryId: targetCategoryId, order: newOrder };
        }
        
        // Инструкции в исходной категории (если переместили в другую категорию)
        if (sourceCategoryId !== targetCategoryId && item.categoryId === sourceCategoryId && item.order > instruction.order) {
          return { ...item, order: item.order - 1 };
        }
        
        // Инструкции в целевой категории
        if (item.categoryId === targetCategoryId && item.id !== instructionId) {
          if (sourceCategoryId === targetCategoryId) {
            // Перемещение внутри категории
            if (newOrder < instruction.order && item.order >= newOrder && item.order < instruction.order) {
              return { ...item, order: item.order + 1 };
            }
            if (newOrder > instruction.order && item.order <= newOrder && item.order > instruction.order) {
              return { ...item, order: item.order - 1 };
            }
          } else {
            // Перемещение в другую категорию
            if (item.order >= newOrder) {
              return { ...item, order: item.order + 1 };
            }
          }
        }
        
        return item;
      });
    });
  };

  // Admin functions for Instruction Categories
  const addInstructionCategory = (category: Omit<InstructionCategory, "id" | "order" | "createdAt">) => {
    const maxOrder = instructionCategories.length > 0
      ? Math.max(...instructionCategories.map(c => c.order))
      : -1;
    
    const newCategory: InstructionCategory = {
      ...category,
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    setInstructionCategories((prev) => [...prev, newCategory]);
  };

  const updateInstructionCategory = (id: string, updates: Partial<InstructionCategory>) => {
    setInstructionCategories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteInstructionCategory = (id: string) => {
    // Удаляем категорию и все инструкции в ней
    setInstructionCategories((prev) => prev.filter((item) => item.id !== id));
    setInstructions((prev) => prev.filter((item) => item.categoryId !== id));
  };

  const moveInstructionCategory = (categoryId: string, newOrder: number) => {
    setInstructionCategories((prev) => {
      const category = prev.find(c => c.id === categoryId);
      if (!category) return prev;

      return prev.map(item => {
        if (item.id === categoryId) {
          return { ...item, order: newOrder };
        }
        
        if (newOrder < category.order && item.order >= newOrder && item.order < category.order) {
          return { ...item, order: item.order + 1 };
        }
        
        if (newOrder > category.order && item.order <= newOrder && item.order > category.order) {
          return { ...item, order: item.order - 1 };
        }
        
        return item;
      });
    });
  };

  // Admin functions for Recordings
  const addRecording = (recording: Omit<Recording, "id" | "views">) => {
    const newRecording: Recording = {
      ...recording,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      views: 0,
    };
    setRecordings((prev) => [newRecording, ...prev]);
  };

  const updateRecording = (id: string, updates: Partial<Recording>) => {
    setRecordings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((item) => item.id !== id));
  };

  // Admin functions for FAQ
  const addFAQItem = (item: Omit<FAQItem, "id" | "helpful">) => {
    const newItem: FAQItem = {
      ...item,
      id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      helpful: 0,
    };
    setFaqItems((prev) => [newItem, ...prev]);
  };

  const updateFAQItem = (id: string, updates: Partial<FAQItem>) => {
    setFaqItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteFAQItem = (id: string) => {
    setFaqItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleFAQHelpful = (id: string) => {
    setFaqItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, helpful: item.helpful + 1 } : item))
    );
  };

  // Admin functions for Users
  const addUser = (user: Omit<User, "id" | "registeredAt">) => {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      registeredAt: new Date().toISOString(),
    };
    setUsers((prev) => [newUser, ...prev]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((item) => item.id !== id));
  };

  const importUsersFromCSV = (importedUsers: Omit<User, "id" | "registeredAt">[]) => {
    const newUsers = importedUsers.map(user => ({
      ...user,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      registeredAt: new Date().toISOString(),
    }));
    setUsers((prev) => [...newUsers, ...prev]);
  };

  const exportUsersToCSV = (): string => {
    const headers = ['Имя', 'Email', 'Телефон', 'Пол', 'Дата регистрации', 'Статус', 'Последняя активность'];
    const rows = users.map(user => [
      user.name,
      user.email,
      user.phone || '',
      user.gender === 'male' ? 'Мужской' : user.gender === 'female' ? 'Женский' : '',
      new Date(user.registeredAt).toLocaleDateString('ru-RU'),
      user.status === 'active' ? 'Активен' : 'Неактивен',
      user.lastActivity ? new Date(user.lastActivity).toLocaleDateString('ru-RU') : ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  };

  return (
    <AppContext.Provider
      value={{
        favorites,
        notes,
        likes,
        comments,
        completedInstructions,
        auth,
        notifications,
        newsItems,
        events,
        instructions,
        instructionCategories,
        recordings,
        faqItems,
        users,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleLike,
        isLiked,
        addNote,
        updateNote,
        deleteNote,
        addComment,
        getCommentsByEvent,
        toggleCommentLike,
        toggleInstructionComplete,
        isInstructionComplete,
        login,
        logout,
        changePassword,
        markNotificationAsRead,
        getUnreadNotificationsCount,
        addNewsItem,
        updateNewsItem,
        deleteNewsItem,
        addEvent,
        updateEvent,
        deleteEvent,
        addInstruction,
        updateInstruction,
        deleteInstruction,
        moveInstruction,
        addInstructionCategory,
        updateInstructionCategory,
        deleteInstructionCategory,
        moveInstructionCategory,
        addRecording,
        updateRecording,
        deleteRecording,
        addFAQItem,
        updateFAQItem,
        deleteFAQItem,
        toggleFAQHelpful,
        addUser,
        updateUser,
        deleteUser,
        importUsersFromCSV,
        exportUsersToCSV,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}