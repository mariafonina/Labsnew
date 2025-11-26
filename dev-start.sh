#!/bin/bash

# Скрипт быстрого запуска локальной разработки

echo "🚀 Запуск локальной разработки Labs..."

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker Desktop."
    exit 1
fi

# Проверка docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose не установлен."
    exit 1
fi

# Проверка .env.local
if [ ! -f .env.local ]; then
    echo "❌ Файл .env.local не найден."
    echo "Создайте .env.local на основе .env.example"
    exit 1
fi

# Копируем .env.local в .env для использования
echo "📝 Копирование .env.local в .env..."
cp .env.local .env

# Запуск PostgreSQL
echo "🐘 Запуск PostgreSQL в Docker..."
docker-compose up -d

# Ждем пока БД будет готова
echo "⏳ Ожидание готовности БД..."
sleep 5

# Проверка здоровья БД
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U app -d app &> /dev/null; then
        echo "✅ PostgreSQL готова"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout: PostgreSQL не запустилась"
        docker-compose logs postgres
        exit 1
    fi
    echo "⏳ Ждем БД... ($i/30)"
    sleep 2
done

# Проверка node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

# Проверка нужны ли миграции
echo "🔍 Проверка схемы БД..."
if ! docker-compose exec -T postgres psql -U app -d app -c "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'labs';" 2>/dev/null | grep -q "1 row"; then
    echo "🔧 Запуск миграций..."
    npm run migrate
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка миграции. Проверьте логи выше."
        exit 1
    fi
else
    echo "✅ Схема БД уже инициализирована"
fi

echo ""
echo "✅ Все готово! Запускаю dev-сервер..."
echo ""
echo "📍 Фронтенд: http://localhost:5000"
echo "📍 API: http://localhost:3001/api"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

# Запуск dev-сервера
npm run dev
