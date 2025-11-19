#!/usr/bin/env tsx

import 'dotenv/config';
import { FigmaAPI } from './utils/figma-api';
import fs from 'fs/promises';
import path from 'path';

// URL дизайна из Figma
const DESIGN_URL = 'https://www.figma.com/design/A1Y1luaRrHIfX4tu7WqPTR/%D0%9B%D0%90%D0%91%D0%A1-%D0%B4%D0%B8%D0%B7%D0%B0%D0%B9%D0%BD?node-id=0-1&t=9SMTqc8PdaHXn9rk-1';

// URL Figma Make (если нужен)
const FIGMA_MAKE_URL = 'https://www.figma.com/make/PYwc9yZufMfmgEw2OojQpD/%D0%9B%D0%90%D0%91%D0%A1?node-id=0-1&t=CK86LwE5Iin88Jz8-1';

// Пути для экспорта
const ASSETS_DIR = path.resolve(__dirname, '../src/assets');
const EXPORT_DIR = path.resolve(__dirname, '../figma-export');

interface ExportOptions {
  fileKey: string;
  nodeIds?: string[];
  exportImages?: boolean;
  exportComponents?: boolean;
  imageFormat?: 'png' | 'svg' | 'jpg';
  imageScale?: 1 | 2 | 4;
}

async function exportFromFigma(options: ExportOptions) {
  const api = new FigmaAPI();
  
  console.log('🎨 Начинаю экспорт из Figma...');
  console.log(`📁 File Key: ${options.fileKey}`);
  
  try {
    // Получаем информацию о файле
    // Если nodeIds не указаны, загружаем весь документ с большей глубиной
    const depth = options.nodeIds ? 1 : 10; // Больше глубина для полного документа
    console.log('📥 Загружаю структуру файла...');
    const fileData = await api.getFile(options.fileKey, options.nodeIds, depth);
    
    // Создаем директорию для экспорта
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    
    // Сохраняем JSON структуру
    const jsonPath = path.join(EXPORT_DIR, 'file-structure.json');
    await fs.writeFile(jsonPath, JSON.stringify(fileData, null, 2));
    console.log(`✅ Структура файла сохранена: ${jsonPath}`);
    
    // Экспортируем изображения, если нужно
    if (options.exportImages && options.nodeIds && options.nodeIds.length > 0) {
      console.log('🖼️  Экспортирую изображения...');
      const imagesResponse = await api.getImages(
        options.fileKey,
        options.nodeIds,
        options.imageFormat || 'png',
        options.imageScale || 2
      );
      
      if (imagesResponse.images) {
        const imagesDir = path.join(EXPORT_DIR, 'images');
        await fs.mkdir(imagesDir, { recursive: true });
        
        for (const [nodeId, imageUrl] of Object.entries(imagesResponse.images)) {
          if (imageUrl) {
            const fileName = `${nodeId}.${options.imageFormat || 'png'}`;
            const outputPath = path.join(imagesDir, fileName);
            await api.downloadImage(imageUrl, outputPath);
            console.log(`  ✅ Скачано: ${fileName}`);
          }
        }
      }
    }
    
    // Экспортируем компоненты, если нужно
    if (options.exportComponents && fileData.document) {
      console.log('🧩 Анализирую компоненты...');
      const components = api.findAllComponents(fileData.document);
      console.log(`  Найдено компонентов: ${components.length}`);
      
      if (components.length > 0) {
        const componentsPath = path.join(EXPORT_DIR, 'components.json');
        await fs.writeFile(
          componentsPath,
          JSON.stringify(components.map(c => ({ id: c.id, name: c.name })), null, 2)
        );
        console.log(`✅ Список компонентов сохранен: ${componentsPath}`);
        
        // Экспортируем изображения компонентов
        if (options.exportImages) {
          console.log('  📸 Экспортирую изображения компонентов...');
          const componentIds = components.map(c => c.id);
          const componentImages = await api.getImages(
            options.fileKey,
            componentIds,
            options.imageFormat || 'png',
            options.imageScale || 2
          );
          
          if (componentImages.images) {
            const componentsImagesDir = path.join(EXPORT_DIR, 'images', 'components');
            await fs.mkdir(componentsImagesDir, { recursive: true });
            
            for (const [nodeId, imageUrl] of Object.entries(componentImages.images)) {
              if (imageUrl) {
                const component = components.find(c => c.id === nodeId);
                const fileName = component 
                  ? `${component.name.replace(/[^a-z0-9]/gi, '_')}_${nodeId}.${options.imageFormat || 'png'}`
                  : `${nodeId}.${options.imageFormat || 'png'}`;
                const outputPath = path.join(componentsImagesDir, fileName);
                await api.downloadImage(imageUrl, outputPath);
                console.log(`    ✅ ${fileName}`);
              }
            }
          }
        }
      } else {
        console.log('  ℹ️  Компоненты не найдены (возможно, нужно запросить весь документ)');
      }
    }
    
    // Экспортируем фреймы
    if (fileData.document) {
      console.log('🖼️  Анализирую фреймы...');
      const frames = api.findAllFrames(fileData.document);
      console.log(`  Найдено фреймов: ${frames.length}`);
      
      if (frames.length > 0) {
        const framesPath = path.join(EXPORT_DIR, 'frames.json');
        await fs.writeFile(
          framesPath,
          JSON.stringify(frames.map(f => ({ id: f.id, name: f.name })), null, 2)
        );
        console.log(`✅ Список фреймов сохранен: ${framesPath}`);
        
        // Экспортируем изображения фреймов
        if (options.exportImages) {
          console.log('  📸 Экспортирую изображения фреймов...');
          const frameIds = frames.map(f => f.id);
          const frameImages = await api.getImages(
            options.fileKey,
            frameIds,
            options.imageFormat || 'png',
            options.imageScale || 2
          );
          
          if (frameImages.images) {
            const framesImagesDir = path.join(EXPORT_DIR, 'images', 'frames');
            await fs.mkdir(framesImagesDir, { recursive: true });
            
            for (const [nodeId, imageUrl] of Object.entries(frameImages.images)) {
              if (imageUrl) {
                const frame = frames.find(f => f.id === nodeId);
                const fileName = frame 
                  ? `${frame.name.replace(/[^a-z0-9]/gi, '_')}_${nodeId}.${options.imageFormat || 'png'}`
                  : `${nodeId}.${options.imageFormat || 'png'}`;
                const outputPath = path.join(framesImagesDir, fileName);
                await api.downloadImage(imageUrl, outputPath);
                console.log(`    ✅ ${fileName}`);
              }
            }
          }
        }
      } else {
        console.log('  ℹ️  Фреймы не найдены (возможно, нужно запросить весь документ)');
      }
    }
    
    console.log('\n✨ Экспорт завершен успешно!');
    console.log(`📂 Результаты сохранены в: ${EXPORT_DIR}`);
    
  } catch (error) {
    console.error('❌ Ошибка при экспорте:', error);
    process.exit(1);
  }
}

async function main() {
  // Извлекаем file key из URL
  const fileKey = FigmaAPI.extractFileKey(DESIGN_URL);
  const nodeId = FigmaAPI.extractNodeId(DESIGN_URL);
  
  if (!fileKey) {
    console.error('❌ Не удалось извлечь file key из URL');
    console.error(`URL: ${DESIGN_URL}`);
    process.exit(1);
  }
  
  console.log('🔗 URL дизайна:', DESIGN_URL);
  console.log('🔑 File Key:', fileKey);
  if (nodeId) {
    console.log('📍 Node ID:', nodeId);
  }
  console.log('');
  
  // Опции экспорта
  // Если nodeId не указан, экспортируем весь документ
  const options: ExportOptions = {
    fileKey,
    nodeIds: nodeId ? [nodeId] : undefined, // Если undefined, загрузится весь документ
    exportImages: true,
    exportComponents: true,
    imageFormat: 'png',
    imageScale: 2,
  };
  
  await exportFromFigma(options);
}

// Запускаем скрипт
main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

