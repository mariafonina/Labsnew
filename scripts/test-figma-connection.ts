#!/usr/bin/env tsx

import 'dotenv/config';
import { FigmaAPI } from './utils/figma-api';

async function testConnection() {
  try {
    console.log('🔍 Проверяю подключение к Figma API...\n');
    
    const api = new FigmaAPI();
    console.log('✅ Токен загружен успешно');
    
    // Тестируем извлечение file key из URL
    const designUrl = 'https://www.figma.com/design/A1Y1luaRrHIfX4tu7WqPTR/%D0%9B%D0%90%D0%91%D0%A1-%D0%B4%D0%B8%D0%B7%D0%B0%D0%B9%D0%BD?node-id=0-1&t=9SMTqc8PdaHXn9rk-1';
    const fileKey = FigmaAPI.extractFileKey(designUrl);
    const nodeId = FigmaAPI.extractNodeId(designUrl);
    
    console.log(`📁 File Key: ${fileKey}`);
    console.log(`📍 Node ID: ${nodeId}\n`);
    
    if (!fileKey) {
      console.error('❌ Не удалось извлечь file key');
      process.exit(1);
    }
    
    // Пробуем получить информацию о файле (минимальный запрос)
    console.log('📡 Тестирую подключение к Figma API...');
    const fileData: any = await api.getFile(fileKey);
    
    console.log('✅ Подключение успешно!');
    console.log(`📄 Файл найден в Figma`);
    if (fileData.name) {
      console.log(`📝 Название: ${fileData.name}`);
    }
    if (fileData.lastModified) {
      console.log(`📅 Последнее изменение: ${fileData.lastModified}`);
    }
    if (fileData.version) {
      console.log(`📊 Версия: ${fileData.version}`);
    }
    if (fileData.document) {
      console.log(`📑 Документ загружен (${fileData.document.type || 'unknown'})`);
    }
    console.log('');
    
    console.log('✨ Все готово к экспорту! Запустите: npm run figma:export');
    
  } catch (error: any) {
    console.error('❌ Ошибка при подключении:', error.message);
    if (error.message.includes('403')) {
      console.error('\n💡 Возможные причины:');
      console.error('   - Неверный токен');
      console.error('   - Нет доступа к файлу');
    } else if (error.message.includes('404')) {
      console.error('\n💡 Возможные причины:');
      console.error('   - Неверный file key');
      console.error('   - Файл не существует или удален');
    }
    process.exit(1);
  }
}

testConnection();

