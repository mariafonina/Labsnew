#!/usr/bin/env tsx

import 'dotenv/config';
import { FigmaAPI } from './utils/figma-api';
import fs from 'fs/promises';
import path from 'path';

// URL страницы с фреймами
const PAGE_URL = 'https://www.figma.com/design/A1Y1luaRrHIfX4tu7WqPTR/%D0%9B%D0%90%D0%91%D0%A1-%D0%B4%D0%B8%D0%B7%D0%B0%D0%B9%D0%BD?node-id=0-1';

const EXPORT_DIR = path.resolve(__dirname, '../figma-export');

interface FrameInfo {
  id: string;
  name: string;
  type: string;
  children?: any[];
}

async function exportAllFrames() {
  const api = new FigmaAPI();
  
  console.log('🎨 Экспортирую все фреймы со страницы...\n');
  
  const fileKey = FigmaAPI.extractFileKey(PAGE_URL);
  const nodeId = FigmaAPI.extractNodeId(PAGE_URL) || '0:1'; // Страница Page 1
  
  if (!fileKey) {
    console.error('❌ Не удалось извлечь file key');
    process.exit(1);
  }
  
  console.log('🔗 URL:', PAGE_URL);
  console.log('🔑 File Key:', fileKey);
  console.log('📍 Страница:', nodeId);
  console.log('');
  
  try {
    // Загружаем с максимальной глубиной
    console.log('📥 Загружаю структуру страницы (глубина: 20)...');
    const fileData: any = await api.getFile(fileKey, [nodeId], 20);
    
    // Создаем директории
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    const framesDir = path.join(EXPORT_DIR, 'frames');
    const framesImagesDir = path.join(framesDir, 'images');
    await fs.mkdir(framesImagesDir, { recursive: true });
    
    // Находим все фреймы
    let allFrames: FrameInfo[] = [];
    
    if (fileData.document) {
      // Рекурсивно собираем все фреймы
      const collectFrames = (node: any): void => {
        if (node.type === 'FRAME' || node.type === 'COMPONENT') {
          allFrames.push({
            id: node.id,
            name: node.name,
            type: node.type,
            children: node.children
          });
        }
        if (node.children) {
          node.children.forEach(collectFrames);
        }
      };
      
      if (fileData.document.children) {
        fileData.document.children.forEach((page: any) => {
          if (page.children) {
            page.children.forEach(collectFrames);
          }
        });
      }
    }
    
    console.log(`\n📊 Найдено фреймов: ${allFrames.length}\n`);
    
    if (allFrames.length === 0) {
      console.log('⚠️  Фреймы не найдены. Сохраняю полную структуру для анализа...');
      const jsonPath = path.join(EXPORT_DIR, 'full-structure.json');
      await fs.writeFile(jsonPath, JSON.stringify(fileData, null, 2));
      console.log(`✅ Структура сохранена: ${jsonPath}`);
      return;
    }
    
    // Сохраняем список фреймов
    const framesListPath = path.join(framesDir, 'frames-list.json');
    await fs.writeFile(
      framesListPath,
      JSON.stringify(allFrames.map(f => ({ id: f.id, name: f.name, type: f.type })), null, 2)
    );
    console.log(`✅ Список фреймов сохранен: ${framesListPath}`);
    
    // Показываем список фреймов
    console.log('📋 Список найденных фреймов:');
    allFrames.forEach((frame, index) => {
      console.log(`   ${index + 1}. ${frame.name} (${frame.id}) [${frame.type}]`);
    });
    
    // Экспортируем изображения всех фреймов
    console.log(`\n🖼️  Экспортирую изображения фреймов (${allFrames.length} шт.)...`);
    
    // Figma API позволяет запрашивать до 200 узлов за раз
    const batchSize = 200;
    let exportedCount = 0;
    
    for (let i = 0; i < allFrames.length; i += batchSize) {
      const batch = allFrames.slice(i, i + batchSize);
      const frameIds = batch.map(f => f.id);
      
      console.log(`   📦 Пакет ${Math.floor(i / batchSize) + 1}/${Math.ceil(allFrames.length / batchSize)} (${batch.length} фреймов)...`);
      
      try {
        const imagesResponse = await api.getImages(fileKey, frameIds, 'png', 2);
        
        if (imagesResponse.images) {
          for (const [nodeId, imageUrl] of Object.entries(imagesResponse.images)) {
            if (imageUrl) {
              const frame = allFrames.find(f => f.id === nodeId);
              const safeName = frame 
                ? frame.name.replace(/[^a-z0-9а-яё\s]/gi, '_').replace(/\s+/g, '_')
                : nodeId.replace(/:/g, '-');
              
              const fileName = `${safeName}_${nodeId.replace(/:/g, '-')}.png`;
              const outputPath = path.join(framesImagesDir, fileName);
              
              await api.downloadImage(imageUrl, outputPath);
              exportedCount++;
              console.log(`      ✅ ${frame?.name || nodeId}`);
            }
          }
        }
        
        // Небольшая задержка между пакетами, чтобы не перегружать API
        if (i + batchSize < allFrames.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`      ❌ Ошибка при экспорте пакета: ${error.message}`);
      }
    }
    
    // Сохраняем полную структуру для детального анализа
    const fullStructurePath = path.join(EXPORT_DIR, 'full-structure-with-frames.json');
    await fs.writeFile(fullStructurePath, JSON.stringify(fileData, null, 2));
    
    console.log(`\n✨ Экспорт завершен!`);
    console.log(`📊 Статистика:`);
    console.log(`   - Найдено фреймов: ${allFrames.length}`);
    console.log(`   - Экспортировано изображений: ${exportedCount}`);
    console.log(`📂 Файлы сохранены в:`);
    console.log(`   - Список фреймов: ${framesListPath}`);
    console.log(`   - Изображения: ${framesImagesDir}`);
    console.log(`   - Полная структура: ${fullStructurePath}`);
    
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    if (error.message.includes('403')) {
      console.error('\n💡 Проверьте, что токен имеет доступ к файлу');
    }
    process.exit(1);
  }
}

exportAllFrames();

