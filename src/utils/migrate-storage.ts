import { apiClient } from '../api/client';
import type { FavoriteItem, Note, Comment } from '../contexts/AppContext';

export interface MigrationResult {
  success: boolean;
  favoritesCount: number;
  notesCount: number;
  commentsCount: number;
  errors: string[];
}

// Server already sanitizes, so we don't need to sanitize here to avoid double-escaping
// Just pass the data as-is and let the server handle sanitization

export async function migrateLocalStorageToPostgreSQL(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    favoritesCount: 0,
    notesCount: 0,
    commentsCount: 0,
    errors: [],
  };

  try {
    // 1. Migrate favorites
    const favoritesData = localStorage.getItem('favorites');
    if (favoritesData) {
      try {
        const favorites: FavoriteItem[] = JSON.parse(favoritesData);
        for (const favorite of favorites) {
          try {
            await apiClient.post('/favorites', {
              item_type: favorite.type,
              item_id: favorite.id,
              title: favorite.title || '',
              description: favorite.description || null,
              date: favorite.date || favorite.addedAt,
            });
            result.favoritesCount++;
          } catch (err: any) {
            // Skip conflicts (409) - item already exists
            if (err.response?.status !== 409) {
              result.errors.push(`Failed to migrate favorite "${favorite.title}": ${err.message}`);
            }
          }
        }
      } catch (err: any) {
        result.errors.push(`Failed to parse favorites: ${err.message}`);
      }
    }

    // 2. Migrate notes
    const notesData = localStorage.getItem('notes');
    if (notesData) {
      try {
        const notes: Note[] = JSON.parse(notesData);
        for (const note of notes) {
          try {
            await apiClient.post('/notes', {
              title: note.title || null,
              content: note.content,
              linked_item: note.linkedItem || null,
            });
            result.notesCount++;
          } catch (err: any) {
            result.errors.push(`Failed to migrate note "${note.title}": ${err.message}`);
          }
        }
      } catch (err: any) {
        result.errors.push(`Failed to parse notes: ${err.message}`);
      }
    }

    // 3. Migrate comments
    const commentsData = localStorage.getItem('comments');
    if (commentsData) {
      try {
        const comments: Comment[] = JSON.parse(commentsData);
        for (const comment of comments) {
          try {
            await apiClient.post('/comments', {
              event_id: comment.eventId,
              event_type: comment.eventType,
              event_title: comment.eventTitle,
              author_name: comment.authorName,
              author_role: comment.authorRole,
              content: comment.content,
              parent_id: comment.parentId || null,
            });
            result.commentsCount++;
          } catch (err: any) {
            result.errors.push(`Failed to migrate comment: ${err.message}`);
          }
        }
      } catch (err: any) {
        result.errors.push(`Failed to parse comments: ${err.message}`);
      }
    }

    // 4. If migration was successful, set flag and clear localStorage
    if (result.errors.length === 0) {
      localStorage.setItem('data_migrated', 'true');
      localStorage.removeItem('favorites');
      localStorage.removeItem('notes');
      localStorage.removeItem('comments');
    } else {
      result.success = false;
    }

  } catch (err: any) {
    result.success = false;
    result.errors.push(`Migration failed: ${err.message}`);
  }

  return result;
}

export function isMigrationNeeded(): boolean {
  // Check if migration flag is set
  if (localStorage.getItem('data_migrated') === 'true') {
    return false;
  }

  // Check if there's any data to migrate
  const hasFavorites = !!localStorage.getItem('favorites');
  const hasNotes = !!localStorage.getItem('notes');
  const hasComments = !!localStorage.getItem('comments');

  return hasFavorites || hasNotes || hasComments;
}
