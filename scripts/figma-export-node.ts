#!/usr/bin/env tsx

import 'dotenv/config';
import { FigmaAPI } from './utils/figma-api';
import fs from 'fs/promises';
import path from 'path';

// URL с конкретным узлом
const NODE_URL = process.argv[2] || 'https://www.figma.com/design/A1Y1luaRrHIfX4tu7WqPTR/%D0%9B%D0%90%D0%91%D0%A1-%D0%B4%D0%B8%D0%B7%D0%B0%D0%B9%D0%BD?node-id=0-3&m=dev';

const EXPORT_DIR = path.resolve(__dirname, '../figma-export');

async function exportNode() {
  const api = new FigmaAPI();
  
  console.log('🎨 Экспортирую узел из Figma...\n');
  
  // Извлекаем file key и node ID из URL
  const fileKey = FigmaAPI.extractFileKey(NODE_URL);
  const nodeId = FigmaAPI.extractNodeId(NODE_URL);
  
  if (!fileKey) {
    console.error('❌ Не удалось извлечь file key из URL');
    process.exit(1);
  }
  
  console.log('🔗 URL:', NODE_URL);
  console.log('🔑 File Key:', fileKey);
  console.log('📍 Node ID:', nodeId || 'не указан (экспортирую весь документ)');
  console.log('');
  
  try {
    // Загружаем с большой глубиной, чтобы получить все вложенные элементы
    const depth = 10;
    console.log(`📥 Загружаю структуру (глубина: ${depth})...`);
    
    const nodeIds = nodeId ? [nodeId] : undefined;
    const fileData: any = await api.getFile(fileKey, nodeIds, depth);
    
    // Создаем директорию для экспорта
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    
    // Сохраняем полную структуру
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(EXPORT_DIR, `node-${nodeId || 'full'}-${timestamp}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(fileData, null, 2));
    console.log(`✅ Структура сохранена: ${jsonPath}`);
    
    // Анализируем структуру
    console.log('\n📊 Анализ структуры:');
    console.log(`   Название файла: ${fileData.name || 'Не указано'}`);
    
    if (fileData.document) {
      const doc = fileData.document;
      console.log(`   Тип корневого элемента: ${doc.type}`);
      console.log(`   Название: ${doc.name}`);
      
      if (doc.children) {
        console.log(`   Количество страниц: ${doc.children.length}`);
        
        // Анализируем каждую страницу
        for (const page of doc.children) {
          console.log(`\n   📄 Страница: "${page.name}" (${page.type})`);
          console.log(`      ID: ${page.id}`);
          
          if (page.children && page.children.length > 0) {
            console.log(`      Элементов на странице: ${page.children.length}`);
            
            // Считаем типы элементов
            const countByType: Record<string, number> = {};
            const countElements = (node: any) => {
              countByType[node.type] = (countByType[node.type] || 0) + 1;
              if (node.children) {
                node.children.forEach(countElements);
              }
            };
            page.children.forEach(countElements);
            
            console.log(`      Распределение по типам:`);
            Object.entries(countByType).forEach(([type, count]) => {
              console.log(`         ${type}: ${count}`);
            });
          } else {
            console.log(`      ⚠️  Страница пустая или элементы не загружены`);
          }
        }
      }
    }
    
    // Ищем компоненты
    const components = fileData.document ? api.findAllComponents(fileData.document) : [];
    console.log(`\n🧩 Найдено компонентов: ${components.length}`);
    if (components.length > 0) {
      components.slice(0, 10).forEach((c: any) => {
        console.log(`   - ${c.name} (${c.id})`);
      });
      if (components.length > 10) {
        console.log(`   ... и еще ${components.length - 10}`);
      }
    }
    
    // Ищем фреймы
    const frames = fileData.document ? api.findAllFrames(fileData.document) : [];
    console.log(`\n🖼️  Найдено фреймов: ${frames.length}`);
    if (frames.length > 0) {
      frames.slice(0, 10).forEach((f: any) => {
        console.log(`   - ${f.name} (${f.id})`);
      });
      if (frames.length > 10) {
        console.log(`   ... и еще ${frames.length - 10}`);
      }
    }
    
    // Экспортируем изображения, если указан nodeId
    if (nodeId) {
      console.log(`\n🖼️  Экспортирую изображение узла...`);
      const imagesResponse = await api.getImages(fileKey, [nodeId], 'png', 2);
      
      if (imagesResponse.images && imagesResponse.images[nodeId]) {
        const imagesDir = path.join(EXPORT_DIR, 'images');
        await fs.mkdir(imagesDir, { recursive: true });
        
        const fileName = `${nodeId.replace(/:/g, '-')}.png`;
        const outputPath = path.join(imagesDir, fileName);
        await api.downloadImage(imagesResponse.images[nodeId], outputPath);
        console.log(`✅ Изображение сохранено: ${outputPath}`);
      }
    }
    
    console.log('\n✨ Экспорт завершен!');
    console.log(`📂 Все файлы в: ${EXPORT_DIR}`);
    
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

exportNode();

