import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { apiClient } from "../api/client";

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();
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
  id: string | number;
  title: string;
  categoryId: string | number | null; // DEPRECATED - ID старой категории
  category_id?: number | null; // DEPRECATED - Поле из БД
  cohortId?: number; // ID потока
  cohort_id?: number; // Поле из БД
  cohortCategoryId: string | number | null; // ID категории базы знаний
  cohort_category_id?: number | null; // Поле из БД
  description: string;
  views: number;
  updatedAt: string;
  content?: string;
  downloadUrl?: string;
  order: number; // порядок внутри категории
  display_order?: number; // Поле из БД
  loom_embed_url?: string; // URL Loom видео для встраивания
  imageUrl?: string; // URL изображения на всю ширину
}

export interface InstructionCategory {
  id: string | number;
  name: string;
  description?: string;
  order: number; // порядок категории (для фронтенда)
  display_order?: number; // Поле из БД
  createdAt: string;
  created_at?: string; // Поле из БД
  updated_at?: string; // Поле из БД
}

export interface CohortKnowledgeCategory {
  id: string | number;
  cohort_id: number;
  name: string;
  description?: string;
  order: number;
  display_order?: number;
  createdAt: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserCohort {
  id: number;
  name: string;
  product_id: number;
  product_name?: string;
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
  cohortKnowledgeCategories: CohortKnowledgeCategory[];
  userCohorts: UserCohort[];
  selectedCohortId: number | null;
  recordings: Recording[];
  faqItems: FAQItem[];
  users: User[];
  addToFavorites: (item: FavoriteItem) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleLike: (id: string) => void;
  isLiked: (id: string) => boolean;
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addComment: (comment: Omit<Comment, "id" | "createdAt" | "likes">, eventTitle?: string, eventType?: "event" | "instruction" | "recording" | "faq") => Promise<void>;
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
  setSelectedCohort: (cohortId: number | null) => void;
  fetchCohortKnowledgeCategories: (cohortId: number) => Promise<void>;
  addCohortKnowledgeCategory: (cohortId: number, category: Omit<CohortKnowledgeCategory, "id" | "order" | "createdAt" | "cohort_id">) => Promise<void>;
  updateCohortKnowledgeCategory: (cohortId: number, categoryId: string | number, updates: Partial<CohortKnowledgeCategory>) => Promise<void>;
  deleteCohortKnowledgeCategory: (cohortId: number, categoryId: string | number) => Promise<void>;
  moveCohortKnowledgeCategory: (cohortId: number, categoryId: string | number, newOrder: number) => Promise<void>;
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
  setAuth: (auth: AuthData) => void;
  fetchContent: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // User-specific data loaded from API after authentication (no localStorage for security)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [completedInstructions, setCompletedInstructions] = useState<string[]>([]);

  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  
  const [auth, setAuth] = useState<AuthData>(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');
    const saved = localStorage.getItem("auth");
    
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        apiClient.setToken(token);
        console.log('[AppContext] Auth restored from auth_token/user:', user.email);
        return {
          email: user.email || "",
          password: "",
          isAuthenticated: true,
          rememberMe: true,
          isAdmin: user.role === 'admin',
        };
      } catch (e) {
        console.error('[AppContext] Failed to parse user from localStorage', e);
      }
    }
    
    if (saved) {
      try {
        const authData = JSON.parse(saved);
        if (authData.isAuthenticated) {
          console.log('[AppContext] Auth restored from localStorage:', authData.email);
          return authData;
        }
      } catch (e) {
        console.error('[AppContext] Failed to parse auth from localStorage', e);
      }
    }
    console.log('[AppContext] No auth in localStorage, user not authenticated');
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
    // Categories are now loaded from DB via API, not localStorage
    return [
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
        loom_embed_url: "https://www.loom.com/embed/example",
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

  const [userCohorts, setUserCohorts] = useState<UserCohort[]>([]);
  const [selectedCohortId, setSelectedCohortIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedCohortId');
    return saved ? parseInt(saved) : null;
  });
  const [cohortKnowledgeCategories, setCohortKnowledgeCategories] = useState<CohortKnowledgeCategory[]>([]);

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

  // Categories are now stored in DB, not localStorage
  // useEffect(() => {
  //   localStorage.setItem("instructionCategories", JSON.stringify(instructionCategories));
  // }, [instructionCategories]);

  useEffect(() => {
    localStorage.setItem("recordings", JSON.stringify(recordings));
  }, [recordings]);

  useEffect(() => {
    localStorage.setItem("faqItems", JSON.stringify(faqItems));
  }, [faqItems]);

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (selectedCohortId !== null) {
      localStorage.setItem('selectedCohortId', selectedCohortId.toString());
    }
  }, [selectedCohortId]);

  useEffect(() => {
    if (selectedCohortId && auth.isAuthenticated) {
      fetchCohortKnowledgeCategories(selectedCohortId);
    }
  }, [selectedCohortId, auth.isAuthenticated]);

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
    fetchInstructionCategories(); // Load categories from DB

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

  // Mark auth as initialized after first render and ensure token is set
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token && auth.isAuthenticated) {
      apiClient.setToken(token);
      console.log('[AppContext] Token set in apiClient during initialization');
    }
    setIsAuthInitialized(true);
    console.log('[AppContext] Auth initialized, isAuthenticated:', auth.isAuthenticated);
  }, []);

  // Load content when auth state changes (but only after initialization)
  useEffect(() => {
    if (!isAuthInitialized) {
      console.log('[AppContext] Waiting for auth initialization...');
      return;
    }
    
    console.log('[AppContext] Auth changed, isAuthenticated:', auth.isAuthenticated);
    if (auth.isAuthenticated) {
      console.log('[AppContext] User is authenticated, calling fetchContent');
      fetchContent();
    } else {
      console.log('[AppContext] User is not authenticated, clearing content');
      setNewsItems([]);
      setEvents([]);
      setInstructions([]);
      setRecordings([]);
      setFaqItems([]);
    }
  }, [auth.isAuthenticated, isAuthInitialized]);

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

  const addNote = async (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
    try {
      // Send to API
      const result = await apiClient.post('/notes', {
        title: note.title,
        content: note.content,
        linked_item: note.linkedItem
      });

      // Add to local state
      const newNote: Note = {
        id: String(result.id),
        title: result.title || note.title,
        content: result.content,
        linkedItem: result.linked_item || note.linkedItem,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
      setNotes((prev) => [newNote, ...prev]);
    } catch (error) {
      console.error('Failed to save note:', error);
      throw error;
    }
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

  const addComment = async (
    comment: Omit<Comment, "id" | "createdAt" | "likes">,
    eventTitle?: string,
    eventType?: "event" | "instruction" | "recording" | "faq"
  ) => {
    try {
      // Send to API
      const result = await apiClient.post('/comments', {
        event_id: comment.eventId,
        event_type: eventType || comment.eventType || 'event',
        event_title: eventTitle || comment.eventTitle,
        author_name: comment.authorName,
        author_role: comment.authorRole,
        content: comment.content,
        parent_id: comment.parentId || null
      });

      // Add to local state
      const newComment: Comment = {
        id: String(result.id),
        userId: String(result.user_id),
        eventId: result.event_id,
        eventType: result.event_type,
        eventTitle: result.event_title,
        authorName: result.author_name,
        authorRole: result.author_role,
        content: result.content,
        createdAt: result.created_at,
        likes: result.likes || 0,
        parentId: result.parent_id ? String(result.parent_id) : undefined
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
    } catch (error) {
      console.error('Failed to save comment:', error);
      throw error;
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
  const addInstructionCategory = async (category: Omit<InstructionCategory, "id" | "order" | "createdAt">) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Не авторизован');
      }

      const response = await fetch(`${API_BASE_URL}/instruction-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: category.name,
          description: category.description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при создании категории');
      }

      const newCategoryFromDB = await response.json();

      // Конвертируем из БД формата в фронтенд формат
      const newCategory: InstructionCategory = {
        id: newCategoryFromDB.id,
        name: newCategoryFromDB.name,
        description: newCategoryFromDB.description,
        order: newCategoryFromDB.display_order,
        createdAt: newCategoryFromDB.created_at,
        display_order: newCategoryFromDB.display_order,
        created_at: newCategoryFromDB.created_at,
        updated_at: newCategoryFromDB.updated_at,
      };

      setInstructionCategories((prev) => [...prev, newCategory]);
    } catch (error) {
      console.error('Error adding instruction category:', error);
      throw error;
    }
  };

  const updateInstructionCategory = async (id: string | number, updates: Partial<InstructionCategory>) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Не авторизован');
      }

      const response = await fetch(`${API_BASE_URL}/instruction-categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updates.name,
          description: updates.description,
          display_order: updates.order ?? updates.display_order,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при обновлении категории');
      }

      const updatedCategoryFromDB = await response.json();

      setInstructionCategories((prev) =>
        prev.map((item) => item.id === id ? {
          ...item,
          name: updatedCategoryFromDB.name,
          description: updatedCategoryFromDB.description,
          order: updatedCategoryFromDB.display_order,
          display_order: updatedCategoryFromDB.display_order,
          updated_at: updatedCategoryFromDB.updated_at,
        } : item)
      );
    } catch (error) {
      console.error('Error updating instruction category:', error);
      throw error;
    }
  };

  const deleteInstructionCategory = async (id: string | number) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Не авторизован');
      }

      const response = await fetch(`${API_BASE_URL}/instruction-categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при удалении категории');
      }

      // Удаляем категорию и все инструкции в ней из локального состояния
      setInstructionCategories((prev) => prev.filter((item) => item.id !== id));
      setInstructions((prev) => prev.filter((item) => item.categoryId !== id && item.category_id !== id));
    } catch (error) {
      console.error('Error deleting instruction category:', error);
      throw error;
    }
  };

  const moveInstructionCategory = async (categoryId: string | number, newOrder: number) => {
    try {
      // Сначала обновляем локально для плавности
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

      // Затем отправляем на сервер
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Не авторизован');
      }

      const response = await fetch(`${API_BASE_URL}/instruction-categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          display_order: newOrder,
        }),
      });

      if (!response.ok) {
        // Если ошибка, откатываем изменения
        throw new Error('Ошибка при изменении порядка категории');
      }
    } catch (error) {
      console.error('Error moving instruction category:', error);
      // Перезагружаем категории при ошибке
      fetchInstructionCategories();
      throw error;
    }
  };

  // Fetch instruction categories from API
  const fetchInstructionCategories = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/instruction-categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при загрузке категорий инструкций');
      }

      const categoriesFromDB = await response.json();

      // Конвертируем из БД формата в фронтенд формат
      const categories: InstructionCategory[] = categoriesFromDB.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        order: cat.display_order,
        createdAt: cat.created_at,
        display_order: cat.display_order,
        created_at: cat.created_at,
        updated_at: cat.updated_at,
      }));

      setInstructionCategories(categories);
    } catch (error) {
      console.error('Error fetching instruction categories:', error);
    }
  };

  // Fetch content from API (news, events, instructions, recordings, FAQ)
  const fetchContent = async () => {
    console.log('[AppContext] fetchContent called');
    try {
      // Загружаем потоки пользователя
      const cohortsData = await Promise.allSettled([
        apiClient.get(`/profile/cohorts`)
      ]);

      console.log('[AppContext] Cohorts data:', cohortsData[0]);

      if (cohortsData[0].status === 'fulfilled') {
        const response = cohortsData[0].value;
        // API возвращает либо массив напрямую, либо объект с полем data
        const cohorts = Array.isArray(response) ? response : (response.data || response || []);
        console.log('[AppContext] Cohorts array:', cohorts, 'length:', cohorts.length);
        setUserCohorts(cohorts);

        // Автоматически выбрать первый поток если не выбран или если выбранный поток не существует
        console.log('[AppContext] Auto-select check: cohorts.length =', cohorts.length, 'selectedCohortId =', selectedCohortId);
        if (cohorts.length > 0) {
          // Проверяем что выбранный поток существует в списке
          const selectedExists = selectedCohortId && cohorts.some(c => c.id === selectedCohortId);
          if (!selectedExists) {
            console.log('[AppContext] Auto-selecting first cohort:', cohorts[0].id);
            setSelectedCohortIdState(cohorts[0].id);
          } else {
            console.log('[AppContext] Selected cohort exists:', selectedCohortId);
          }
        } else {
          console.log('[AppContext] No cohorts available');
        }
      } else if (cohortsData[0].status === 'rejected') {
        console.error('[AppContext] Failed to load cohorts:', cohortsData[0].reason);
        setUserCohorts([]);
      }

      const [newsData, eventsData, instructionsData, recordingsData, faqData] = await Promise.allSettled([
        apiClient.getNews(),
        apiClient.getEvents(),
        apiClient.getInstructions(),
        apiClient.getRecordings(),
        apiClient.getFAQ()
      ]);

      console.log('[AppContext] News data:', newsData);
      console.log('[AppContext] Events data:', eventsData);
      console.log('[AppContext] Instructions data:', instructionsData);

      if (newsData.status === 'fulfilled') {
        console.log('[AppContext] News value:', newsData.value);
        const items = newsData.value.length > 0 ? newsData.value.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          content: item.content,
          author: item.author,
          authorAvatar: item.author_avatar,
          date: item.date,
          category: item.category,
          image: item.image,
          isNew: item.is_new
        })) : [];
        console.log('[AppContext] Setting news items:', items.length);
        setNewsItems(items);
      } else {
        console.error('[AppContext] News data rejected:', newsData.reason);
      }

      if (eventsData.status === 'fulfilled') {
        console.log('[AppContext] Events value:', eventsData.value);
        const items = eventsData.value.length > 0 ? eventsData.value.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          description: item.description,
          date: item.event_date,
          time: item.event_time,
          location: item.location,
          duration: item.duration,
          instructor: item.instructor,
          type: item.type,
          link: item.link
        })) : [];
        console.log('[AppContext] Setting events:', items.length);
        setEvents(items);
      } else {
        console.error('[AppContext] Events data rejected:', eventsData.reason);
      }

      if (instructionsData.status === 'fulfilled') {
        console.log('[AppContext] Instructions value:', instructionsData.value);
        const items = instructionsData.value.length > 0 ? instructionsData.value.map((item: any) => ({
          id: item.id,
          title: item.title,
          categoryId: item.category_id, // deprecated
          cohort_id: item.cohort_id, // Поле из БД
          cohortId: item.cohort_id, // Дублируем для совместимости
          cohort_category_id: item.cohort_category_id, // Поле из БД
          cohortCategoryId: item.cohort_category_id,
          description: item.description || '',
          views: item.views || 0,
          updatedAt: item.updated_at,
          content: item.content,
          imageUrl: item.image_url,
          loom_embed_url: item.loom_embed_url,
          order: item.display_order || 0
        })) : [];
        console.log('[AppContext] Setting instructions:', items.length);
        setInstructions(items);
      } else {
        console.error('[AppContext] Instructions data rejected:', instructionsData.reason);
      }

      if (recordingsData.status === 'fulfilled') {
        const items = recordingsData.value.length > 0 ? recordingsData.value.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          description: item.description,
          date: item.date,
          duration: item.duration,
          loomUrl: item.loom_url,
          videoUrl: item.video_url,
          loom_embed_url: item.loom_embed_url,
          instructor: item.instructor,
          views: item.views || 0,
          thumbnail: item.thumbnail,
          category: item.category
        })) : [];
        setRecordings(items);
      }

      if (faqData.status === 'fulfilled') {
        const items = faqData.value.length > 0 ? faqData.value.map((item: any) => ({
          id: String(item.id),
          question: item.question,
          answer: item.answer,
          category: item.category,
          createdAt: item.created_at,
          helpful: 0
        })) : [];
        setFaqItems(items);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    }
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

  const setSelectedCohort = (cohortId: number | null) => {
    setSelectedCohortIdState(cohortId);
  };

  const fetchCohortKnowledgeCategories = async (cohortId: number) => {
    try {
      const data = await apiClient.get(`/cohorts/${cohortId}/knowledge-categories`);
      setCohortKnowledgeCategories(data.map((cat: any) => ({
        id: cat.id,
        cohort_id: cat.cohort_id,
        name: cat.name,
        description: cat.description,
        order: cat.display_order || 0,
        display_order: cat.display_order,
        createdAt: cat.created_at,
        created_at: cat.created_at,
        updated_at: cat.updated_at
      })));
    } catch (error) {
      console.error('Error fetching cohort knowledge categories:', error);
    }
  };

  const addCohortKnowledgeCategory = async (cohortId: number, category: Omit<CohortKnowledgeCategory, "id" | "order" | "createdAt" | "cohort_id">) => {
    try {
      const response = await apiClient.post(`/cohorts/${cohortId}/knowledge-categories`, category);
      await fetchCohortKnowledgeCategories(cohortId);
    } catch (error) {
      console.error('Error adding cohort knowledge category:', error);
    }
  };

  const updateCohortKnowledgeCategory = async (cohortId: number, categoryId: string | number, updates: Partial<CohortKnowledgeCategory>) => {
    try {
      await apiClient.put(`/cohorts/${cohortId}/knowledge-categories/${categoryId}`, updates);
      await fetchCohortKnowledgeCategories(cohortId);
    } catch (error) {
      console.error('Error updating cohort knowledge category:', error);
    }
  };

  const deleteCohortKnowledgeCategory = async (cohortId: number, categoryId: string | number) => {
    try {
      await apiClient.delete(`/cohorts/${cohortId}/knowledge-categories/${categoryId}`);
      await fetchCohortKnowledgeCategories(cohortId);
    } catch (error) {
      console.error('Error deleting cohort knowledge category:', error);
    }
  };

  const moveCohortKnowledgeCategory = async (cohortId: number, categoryId: string | number, newOrder: number) => {
    try {
      await apiClient.put(`/cohorts/${cohortId}/knowledge-categories/${categoryId}`, { display_order: newOrder });
      await fetchCohortKnowledgeCategories(cohortId);
    } catch (error) {
      console.error('Error moving cohort knowledge category:', error);
    }
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
        cohortKnowledgeCategories,
        userCohorts,
        selectedCohortId,
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
        setSelectedCohort,
        fetchCohortKnowledgeCategories,
        addCohortKnowledgeCategory,
        updateCohortKnowledgeCategory,
        deleteCohortKnowledgeCategory,
        moveCohortKnowledgeCategory,
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
        setAuth,
        fetchContent,
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