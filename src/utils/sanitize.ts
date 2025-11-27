import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Smart function that detects if content is HTML or Markdown and processes accordingly
 */
export function sanitizeMarkdown(content: string): string {
  if (!content) return '';

  // Check if content looks like HTML (contains HTML tags)
  const hasHtmlTags = /<[^>]+>/.test(content);

  if (hasHtmlTags) {
    // Content is already HTML, just sanitize it
    return sanitizeHtml(content);
  }

  // Content is markdown, convert to HTML then sanitize
  const rawHtml = marked(content, {
    breaks: true,
    gfm: true,
  });

  return DOMPurify.sanitize(rawHtml as string, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'em', 'u', 's', 'del',
      'blockquote', 'code', 'pre',
      'ul', 'ol', 'li',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title',
      'class',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target'],
    FORCE_BODY: true,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM: false,
  });
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'b', 'i', 'em', 'strong', 'u', 's', 'del',
      'blockquote', 'code', 'pre',
      'ul', 'ol', 'li',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title',
      'class',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
