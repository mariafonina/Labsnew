
  # ЛАБС

  This is a code bundle for ЛАБС. The original project is available at https://www.figma.com/design/PYwc9yZufMfmgEw2OojQpD/%D0%9B%D0%90%D0%91%D0%A1.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Экспорт дизайна из Figma

  Для экспорта дизайна из Figma используйте встроенный скрипт:

  1. **Получите Personal Access Token из Figma:**
     - Откройте [настройки Figma](https://www.figma.com/settings)
     - Перейдите в раздел **Account** → **Personal access tokens**
     - Создайте новый токен и скопируйте его

  2. **Настройте переменные окружения:**
     - Создайте файл `.env` в корне проекта
     - Добавьте: `FIGMA_ACCESS_TOKEN=ваш_токен_здесь`

  3. **Запустите экспорт:**
     ```bash
     npm run figma:export
     ```

  Результаты экспорта будут сохранены в папку `figma-export/`.

  Подробная документация: [scripts/README.md](scripts/README.md)
  