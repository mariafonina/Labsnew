# Локальная разработка

Инструкция по настройке локального окружения для разработки с PostgreSQL в Docker.

## Быстрый старт

```bash
# 1. Запустить БД
docker-compose up -d

# 2. Установить зависимости (если еще не установлены)
npm i

# 3. Запустить миграции (первый раз)
npm run migrate

# 4. Запустить dev-сервер (фронт + бек)
npm run dev
```

Приложение доступно на:
- Фронтенд: http://localhost:5000
- API: http://localhost:3001/api

## Детальная настройка

### 1. Установка Docker

Убедитесь что установлен Docker Desktop:
- macOS: https://docs.docker.com/desktop/install/mac-install/
- Windows: https://docs.docker.com/desktop/install/windows-install/
- Linux: https://docs.docker.com/desktop/install/linux-install/

### 2. Запуск PostgreSQL

```bash
# Запустить контейнер в фоновом режиме
docker-compose up -d

# Проверить статус
docker-compose ps

# Посмотреть логи БД
docker-compose logs postgres
```

PostgreSQL будет доступна на `localhost:5433` с параметрами из `.env.local` (порт 5433 чтобы не конфликтовать с локальным PostgreSQL).

### 3. Настройка окружения

Файл `.env.local` уже создан с настройками для локальной разработки:
- `DB_HOST=localhost`
- `DB_PORT=5433` (чтобы не конфликтовать с локальным PostgreSQL на 5432)
- `DB_NAME=app`
- `DB_USER=app`
- `DB_PASSWORD=local_dev_password`

**Важно:** Не коммитьте `.env.local` в git (уже добавлен в `.gitignore`).

### 4. Инициализация БД

```bash
# Запустить миграции (создаст схему labs и таблицы)
npm run migrate
```

Эта команда:
- Создаст схему `labs`
- Создаст все необходимые таблицы
- Создаст admin пользователя (если еще не существует)

### 5. Запуск приложения

```bash
# Запустить фронт + бек одновременно
npm run dev

# Или по отдельности:
npm run client  # только фронт (порт 5000)
npm run server  # только бек (порт 3001)
```

## Управление БД

### Остановка и удаление

```bash
# Остановить контейнер
docker-compose stop

# Остановить и удалить контейнер (данные сохранятся в volume)
docker-compose down

# Удалить все включая данные (ОСТОРОЖНО!)
docker-compose down -v
```

### Подключение к БД

```bash
# Через Docker
docker-compose exec postgres psql -U app -d app

# Через psql (если установлен локально)
psql -h localhost -p 5433 -U app -d app
```

Пароль: `local_dev_password`

### Сброс БД

```bash
# Удалить контейнер и volume
docker-compose down -v

# Запустить заново
docker-compose up -d

# Запустить миграции
npm run migrate
```

## Полезные команды

```bash
# Проверить логи приложения
npm run dev  # логи в консоли

# Проверить логи БД
docker-compose logs -f postgres

# Перезапустить БД
docker-compose restart postgres

# Посмотреть используемые порты
lsof -i :5433  # Docker PostgreSQL
lsof -i :3001  # Backend
lsof -i :5000  # Frontend
```

## Troubleshooting

### Порт 5433 занят

Docker PostgreSQL уже настроен на порт 5433 чтобы не конфликтовать с локальным PostgreSQL на 5432.

Если порт 5433 тоже занят:

```bash
# Найти процесс
lsof -i :5433

# Изменить порт в docker-compose.yml:
ports:
  - "5434:5432"  # localhost:5434 -> container:5432
```

Тогда в `.env.local` измените `DB_PORT=5434`.

### Ошибка подключения к БД

```bash
# Проверить что контейнер запущен
docker-compose ps

# Проверить health check
docker-compose ps postgres

# Перезапустить
docker-compose restart postgres

# Проверить логи
docker-compose logs postgres
```

### Миграции не применяются

```bash
# Убедитесь что используется .env.local
cat .env.local

# Проверьте подключение
docker-compose exec postgres psql -U app -d app -c "SELECT version();"

# Пересоздайте БД
docker-compose down -v
docker-compose up -d
npm run migrate
```

## Переключение между локальной и production БД

Просто переименуйте файлы:

```bash
# Для локальной разработки
mv .env .env.production
mv .env.local .env

# Для production
mv .env .env.local
mv .env.production .env
```

Или используйте разные файлы и загружайте нужный явно в коде (если необходимо).
