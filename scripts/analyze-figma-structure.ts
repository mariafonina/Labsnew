#!/usr/bin/env tsx

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';

const STRUCTURE_FILE = path.resolve(__dirname, '../figma-export/full-structure-with-frames.json');
const FRAMES_LIST_FILE = path.resolve(__dirname, '../figma-export/frames/frames-list.json');

interface FrameInfo {
  id: string;
  name: string;
  type: string;
}

interface PageStructure {
  name: string;
  id: string;
  topLevelFrames: string[];
  frameCount: number;
}

async function analyzeStructure() {
  console.log('📊 Анализ структуры дизайна из Figma\n');
  
  try {
    // Читаем список всех фреймов
    const framesData = await fs.readFile(FRAMES_LIST_FILE, 'utf-8');
    const frames: FrameInfo[] = JSON.parse(framesData);
    
    console.log(`📋 Общая статистика:`);
    console.log(`   Всего фреймов: ${frames.length}\n`);
    
    // Группируем по типам
    const byType: Record<string, FrameInfo[]> = {};
    frames.forEach(frame => {
      if (!byType[frame.type]) {
        byType[frame.type] = [];
      }
      byType[frame.type].push(frame);
    });
    
    console.log(`📦 Распределение по типам:`);
    Object.entries(byType).forEach(([type, items]) => {
      console.log(`   ${type}: ${items.length}`);
    });
    console.log('');
    
    // Группируем по названиям (топ-30)
    const byName: Record<string, FrameInfo[]> = {};
    frames.forEach(frame => {
      if (!byName[frame.name]) {
        byName[frame.name] = [];
      }
      byName[frame.name].push(frame);
    });
    
    const topNames = Object.entries(byName)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 30);
    
    console.log(`🏷️  Топ-30 названий фреймов:`);
    topNames.forEach(([name, items], index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${name.padEnd(30)} (${items.length} шт.)`);
    });
    console.log('');
    
    // Находим основные макеты страниц (фреймы "ЛАБС")
    const mainFrames = frames.filter(f => f.name === 'ЛАБС');
    console.log(`🎨 Основные макеты страниц (фреймы "ЛАБС"): ${mainFrames.length}`);
    mainFrames.forEach((frame, index) => {
      console.log(`   ${index + 1}. ID: ${frame.id}`);
    });
    console.log('');
    
    // Анализируем структуру документа
    console.log('📄 Анализ структуры документа...\n');
    const structureData = await fs.readFile(STRUCTURE_FILE, 'utf-8');
    const structure = JSON.parse(structureData);
    
    if (structure.document && structure.document.children) {
      const pages = structure.document.children;
      console.log(`📑 Страниц в документе: ${pages.length}\n`);
      
      pages.forEach((page: any) => {
        console.log(`   📄 ${page.name} (${page.type})`);
        console.log(`      ID: ${page.id}`);
        
        if (page.children && page.children.length > 0) {
          console.log(`      Верхнеуровневых фреймов: ${page.children.length}`);
          
          // Находим фреймы "ЛАБС" на этой странице
          const labsFrames = page.children.filter((child: any) => child.name === 'ЛАБС');
          if (labsFrames.length > 0) {
            console.log(`      Макетов "ЛАБС": ${labsFrames.length}`);
            
            labsFrames.forEach((labsFrame: any, idx: number) => {
              console.log(`\n      🎨 Макет ${idx + 1}: "${labsFrame.name}" (${labsFrame.id})`);
              
              // Анализируем содержимое макета
              if (labsFrame.children) {
                const adminPanel = labsFrame.children.find((c: any) => c.name === 'AdminPanel');
                if (adminPanel && adminPanel.children) {
                  const mainContent = adminPanel.children.find((c: any) => c.name === 'Main Content');
                  if (mainContent && mainContent.children) {
                    const mainFrame = mainContent.children[0];
                    if (mainFrame) {
                      console.log(`         📱 Основной контент: ${mainFrame.name} (${mainFrame.type})`);
                    }
                  }
                }
              }
            });
          }
        }
        console.log('');
      });
    }
    
    // Находим уникальные типы страниц/макетов
    console.log('🔍 Анализ типов макетов...\n');
    const uniquePageTypes = new Set<string>();
    
    const findPageTypes = (node: any) => {
      if (node.name === 'ЛАБС' && node.children) {
        const adminPanel = node.children.find((c: any) => c.name === 'AdminPanel');
        if (adminPanel && adminPanel.children) {
          const mainContent = adminPanel.children.find((c: any) => c.name === 'Main Content');
          if (mainContent && mainContent.children && mainContent.children.length > 0) {
            const mainFrame = mainContent.children[0];
            if (mainFrame && mainFrame.name) {
              uniquePageTypes.add(mainFrame.name);
            }
          }
        }
      }
      if (node.children) {
        node.children.forEach(findPageTypes);
      }
    };
    
    if (structure.document) {
      findPageTypes(structure.document);
    }
    
    console.log(`   Найдено уникальных типов страниц: ${uniquePageTypes.size}`);
    Array.from(uniquePageTypes).sort().forEach((type, index) => {
      console.log(`   ${index + 1}. ${type}`);
    });
    console.log('');
    
    // Статистика по компонентам
    if (structure.components && Object.keys(structure.components).length > 0) {
      console.log(`🧩 Компоненты:`);
      console.log(`   Всего компонентов: ${Object.keys(structure.components).length}`);
      Object.entries(structure.components).slice(0, 10).forEach(([id, comp]: [string, any]) => {
        console.log(`   - ${comp.name || id}`);
      });
      if (Object.keys(structure.components).length > 10) {
        console.log(`   ... и еще ${Object.keys(structure.components).length - 10}`);
      }
      console.log('');
    }
    
    // Сохраняем отчет
    const report = {
      totalFrames: frames.length,
      byType: Object.fromEntries(
        Object.entries(byType).map(([type, items]) => [type, items.length])
      ),
      topNames: topNames.map(([name, items]) => ({ name, count: items.length })),
      mainFrames: mainFrames.map(f => ({ id: f.id, name: f.name })),
      pageTypes: Array.from(uniquePageTypes).sort(),
      componentsCount: structure.components ? Object.keys(structure.components).length : 0,
    };
    
    const reportPath = path.resolve(__dirname, '../figma-export/structure-analysis.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Отчет сохранен: ${reportPath}`);
    
  } catch (error: any) {
    console.error('❌ Ошибка при анализе:', error.message);
    process.exit(1);
  }
}

analyzeStructure();

