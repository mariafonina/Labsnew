# Скрипты экспорта из Figma

Этот набор скриптов позволяет автоматически экспортировать дизайн из Figma в проект.

## Настройка

### 1. Получите Personal Access Token из Figma

1. Откройте [настройки Figma](https://www.figma.com/settings)
2. Перейдите в раздел **Account**
3. Найдите секцию **Personal access tokens**
4. Нажмите **Create a new personal access token**
5. Введите название (например, "ЛАБС Project")
6. Скопируйте токен (он показывается только один раз!)

### 2. Настройте переменные окружения

Создайте файл `.env` в корне проекта (на основе `.env.example`):

```bash
FIGMA_ACCESS_TOKEN=ваш_токен_здесь
```

Или установите переменную окружения напрямую:

```bash
export FIGMA_ACCESS_TOKEN=ваш_токен_здесь
```

## Использование

### Базовый экспорт

Запустите скрипт экспорта:

```bash
npm run figma:export
```

Скрипт автоматически:
- Извлечет file key из URL дизайна
- Загрузит структуру файла из Figma
- Экспортирует изображения указанных узлов
- Сохранит список компонентов и фреймов
- Сохранит все результаты в папку `figma-export/`

### Результаты экспорта

После выполнения скрипта в папке `figma-export/` будут созданы:

- `file-structure.json` - полная структура файла Figma
- `images/` - папка с экспортированными изображениями
- `components.json` - список всех компонентов
- `frames.json` - список всех фреймов

## Настройка экспорта

Вы можете изменить параметры экспорта в файле `scripts/figma-export.ts`:

```typescript
const options: ExportOptions = {
  fileKey,
  nodeIds: nodeId ? [nodeId] : undefined, // ID узлов для экспорта
  exportImages: true,                      // Экспортировать изображения
  exportComponents: true,                  // Экспортировать список компонентов
  imageFormat: 'png',                      // Формат: 'png' | 'svg' | 'jpg'
  imageScale: 2,                           // Масштаб: 1 | 2 | 4
};
```

## URL дизайна

Текущие URL настроены в скрипте:
- **Дизайн**: https://www.figma.com/design/A1Y1luaRrHIfX4tu7WqPTR/...
- **Figma Make**: https://www.figma.com/make/PYwc9yZufMfmgEw2OojQpD/...

## API утилиты

Класс `FigmaAPI` в `scripts/utils/figma-api.ts` предоставляет следующие методы:

- `getFile(fileKey, nodeIds?)` - получить структуру файла
- `getImages(fileKey, nodeIds, format, scale)` - получить изображения узлов
- `downloadImage(imageUrl, outputPath)` - скачать изображение
- `findAllComponents(node)` - найти все компоненты
- `findAllFrames(node)` - найти все фреймы
- `extractFileKey(url)` - извлечь file key из URL
- `extractNodeId(url)` - извлечь node ID из URL

## Примеры использования API

```typescript
import { FigmaAPI } from './utils/figma-api';

const api = new FigmaAPI();

// Получить файл
const fileData = await api.getFile('A1Y1luaRrHIfX4tu7WqPTR');

// Получить изображения
const images = await api.getImages('A1Y1luaRrHIfX4tu7WqPTR', ['0:1'], 'png', 2);

// Найти все компоненты
const components = api.findAllComponents(fileData.document);
```

## Устранение неполадок

### Ошибка: "FIGMA_ACCESS_TOKEN не найден"
- Убедитесь, что токен установлен в `.env` файле или переменных окружения
- Проверьте, что файл `.env` находится в корне проекта

### Ошибка: "Ошибка при получении файла из Figma: 403"
- Проверьте, что токен действителен
- Убедитесь, что у вас есть доступ к файлу в Figma

### Ошибка: "Ошибка при получении файла из Figma: 404"
- Проверьте правильность file key в URL
- Убедитесь, что файл существует и доступен

## Дополнительная информация

- [Документация Figma API](https://www.figma.com/developers/api)
- [Figma Make](https://www.figma.com/make)

