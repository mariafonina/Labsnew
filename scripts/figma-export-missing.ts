#!/usr/bin/env tsx

import 'dotenv/config';
import { FigmaAPI } from './utils/figma-api';
import fs from 'fs/promises';
import path from 'path';

const FILE_KEY = 'A1Y1luaRrHIfX4tu7WqPTR';
const EXPORT_DIR = path.resolve(__dirname, '../figma-export');
const FRAMES_IMAGES_DIR = path.join(EXPORT_DIR, 'frames', 'images');

// Все 20 макетов "ЛАБС" из анализа
const ALL_LABS_FRAMES = [
  '0:3',   // AdminDashboard
  '1:2',   // AdminUsers
  '1:189', // AdminUsers
  '1:398', // AdminUsers
  '1:594', // AdminUserDetail
  '1:1092', // AdminUserDetail
  '1:1254', // AdminUserDetail
  '2:2',   // AdminProducts
  '2:223', // AdminProducts
  '2:338', // AdminStreamDetail
  '2:571', // AdminUsers
  '2:918', // AdminEmailCompose
  '2:1078', // AdminEmailCompose
  '2:1234', // AdminEmailCompose
  '4:2',   // AdminEmail
  '4:187', // AdminEmail
  '4:539', // AdminEmailSendPasswords
  '4:696', // AdminEmailCompose
  '4:856', // AdminEmailCompose
  '4:1012', // AdminEmailCompose
];

async function exportMissingFrames() {
  const api = new FigmaAPI();
  
  console.log('🔍 Проверяю какие макеты уже экспортированы...\n');
  
  // Проверяем какие файлы уже есть
  const existingFiles = await fs.readdir(FRAMES_IMAGES_DIR).catch(() => []);
  const existingIds = new Set(
    existingFiles
      .filter(f => f.startsWith('ЛАБС_') && f.endsWith('.png'))
      .map(f => {
        const match = f.match(/ЛАБС_(.+)\.png/);
        return match ? match[1].replace(/-/g, ':') : null;
      })
      .filter(Boolean)
  );
  
  console.log(`✅ Уже экспортировано: ${existingIds.size} макетов`);
  existingIds.forEach(id => console.log(`   - ${id}`));
  
  // Находим недостающие
  const missingIds = ALL_LABS_FRAMES.filter(id => !existingIds.has(id));
  
  if (missingIds.length === 0) {
    console.log('\n✨ Все макеты уже экспортированы!');
    return;
  }
  
  console.log(`\n📋 Недостает макетов: ${missingIds.length}`);
  missingIds.forEach(id => console.log(`   - ${id}`));
  console.log('');
  
  // Экспортируем недостающие
  console.log('🖼️  Экспортирую недостающие макеты...\n');
  
  // Экспортируем небольшими пакетами, чтобы избежать таймаутов
  const batchSize = 5;
  let exportedCount = 0;
  
  for (let i = 0; i < missingIds.length; i += batchSize) {
    const batch = missingIds.slice(i, i + batchSize);
    console.log(`📦 Пакет ${Math.floor(i / batchSize) + 1}/${Math.ceil(missingIds.length / batchSize)} (${batch.length} макетов)...`);
    
    try {
      const imagesResponse = await api.getImages(FILE_KEY, batch, 'png', 2);
      
      if (imagesResponse.images) {
        for (const [nodeId, imageUrl] of Object.entries(imagesResponse.images)) {
          if (imageUrl) {
            const fileName = `ЛАБС_${nodeId.replace(/:/g, '-')}.png`;
            const outputPath = path.join(FRAMES_IMAGES_DIR, fileName);
            
            await api.downloadImage(imageUrl, outputPath);
            exportedCount++;
            console.log(`   ✅ ${nodeId} → ${fileName}`);
          } else {
            console.log(`   ⚠️  ${nodeId} - изображение недоступно`);
          }
        }
      }
      
      // Задержка между пакетами
      if (i + batchSize < missingIds.length) {
        console.log('   ⏳ Ожидание 2 секунды...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`   ❌ Ошибка при экспорте пакета: ${error.message}`);
      
      // Пробуем экспортировать по одному
      console.log('   🔄 Пробую экспортировать по одному...\n');
      for (const nodeId of batch) {
        try {
          const singleResponse = await api.getImages(FILE_KEY, [nodeId], 'png', 2);
          if (singleResponse.images && singleResponse.images[nodeId]) {
            const fileName = `ЛАБС_${nodeId.replace(/:/g, '-')}.png`;
            const outputPath = path.join(FRAMES_IMAGES_DIR, fileName);
            await api.downloadImage(singleResponse.images[nodeId], outputPath);
            exportedCount++;
            console.log(`      ✅ ${nodeId} → ${fileName}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (singleError: any) {
          console.error(`      ❌ ${nodeId}: ${singleError.message}`);
        }
      }
    }
  }
  
  console.log(`\n✨ Экспорт завершен!`);
  console.log(`📊 Экспортировано новых макетов: ${exportedCount}`);
  console.log(`📂 Всего макетов: ${existingIds.size + exportedCount} из ${ALL_LABS_FRAMES.length}`);
  
  // Проверяем финальный статус
  const finalFiles = await fs.readdir(FRAMES_IMAGES_DIR);
  const finalIds = finalFiles
    .filter(f => f.startsWith('ЛАБС_') && f.endsWith('.png'))
    .map(f => {
      const match = f.match(/ЛАБС_(.+)\.png/);
      return match ? match[1].replace(/-/g, ':') : null;
    })
    .filter(Boolean);
  
  const stillMissing = ALL_LABS_FRAMES.filter(id => !finalIds.includes(id));
  if (stillMissing.length > 0) {
    console.log(`\n⚠️  Все еще недостает: ${stillMissing.length} макетов`);
    stillMissing.forEach(id => console.log(`   - ${id}`));
  } else {
    console.log(`\n🎉 Все 20 макетов успешно экспортированы!`);
  }
}

exportMissingFrames().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

