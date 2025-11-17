import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';

interface FigmaFile {
  document: any;
  components: Record<string, any>;
  styles: Record<string, any>;
}

interface FigmaImageResponse {
  images: Record<string, string>;
  error?: boolean;
  status?: number;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

export class FigmaAPI {
  private accessToken: string;
  private baseUrl = 'https://api.figma.com/v1';

  constructor(accessToken?: string) {
    this.accessToken = accessToken || process.env.FIGMA_ACCESS_TOKEN || '';
    
    if (!this.accessToken) {
      throw new Error(
        'FIGMA_ACCESS_TOKEN не найден. Установите его в переменных окружения или передайте в конструктор.'
      );
    }
  }

  /**
   * Извлекает file key из URL Figma
   * Пример: https://www.figma.com/file/ABC123/Project -> ABC123
   */
  static extractFileKey(url: string): string | null {
    const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  /**
   * Извлекает node-id из URL Figma
   */
  static extractNodeId(url: string): string | null {
    const match = url.match(/node-id=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  /**
   * Получает информацию о файле из Figma
   */
  async getFile(fileKey: string, nodeIds?: string[], depth: number = 1): Promise<FigmaFile> {
    const url = new URL(`${this.baseUrl}/files/${fileKey}`);
    
    if (nodeIds && nodeIds.length > 0) {
      url.searchParams.set('ids', nodeIds.join(','));
    }
    
    // Добавляем параметры для получения дополнительной информации
    // depth: глубина загрузки дерева (больше = больше вложенных элементов)
    url.searchParams.set('depth', depth.toString());
    url.searchParams.set('geometry', 'paths');
    url.searchParams.set('plugin_data', 'shared');

    const response = await fetch(url.toString(), {
      headers: {
        'X-Figma-Token': this.accessToken,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ошибка при получении файла из Figma: ${response.status} ${error}`);
    }

    return await response.json();
  }

  /**
   * Получает изображения узлов в различных форматах
   */
  async getImages(
    fileKey: string,
    nodeIds: string[],
    format: 'png' | 'svg' | 'jpg' = 'png',
    scale: 1 | 2 | 4 = 2
  ): Promise<FigmaImageResponse> {
    const url = new URL(`${this.baseUrl}/images/${fileKey}`);
    url.searchParams.set('ids', nodeIds.join(','));
    url.searchParams.set('format', format);
    url.searchParams.set('scale', scale.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'X-Figma-Token': this.accessToken,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ошибка при получении изображений: ${response.status} ${error}`);
    }

    return await response.json();
  }

  /**
   * Скачивает изображение по URL
   */
  async downloadImage(imageUrl: string, outputPath: string): Promise<void> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Ошибка при скачивании изображения: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, Buffer.from(buffer));
  }

  /**
   * Рекурсивно находит все узлы определенного типа
   */
  findNodesByType(node: FigmaNode, type: string): FigmaNode[] {
    const results: FigmaNode[] = [];
    
    if (node.type === type) {
      results.push(node);
    }
    
    if (node.children) {
      for (const child of node.children) {
        results.push(...this.findNodesByType(child, type));
      }
    }
    
    return results;
  }

  /**
   * Рекурсивно находит все компоненты
   */
  findAllComponents(node: FigmaNode): FigmaNode[] {
    return this.findNodesByType(node, 'COMPONENT');
  }

  /**
   * Рекурсивно находит все фреймы
   */
  findAllFrames(node: FigmaNode): FigmaNode[] {
    return this.findNodesByType(node, 'FRAME');
  }
}

