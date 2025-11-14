export function validateAndNormalizeLoomUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  const loomEmbedPattern = /^https:\/\/(www\.)?loom\.com\/embed\/([a-zA-Z0-9]+)(\?.*)?$/;
  const loomSharePattern = /^https:\/\/(www\.)?loom\.com\/share\/([a-zA-Z0-9]+)(\?.*)?$/;

  let match = trimmed.match(loomEmbedPattern);
  if (match) {
    const videoId = match[2];
    const queryString = match[3] || '';
    return `https://www.loom.com/embed/${videoId}${queryString}`;
  }

  match = trimmed.match(loomSharePattern);
  if (match) {
    const videoId = match[2];
    const queryString = match[3] || '';
    return `https://www.loom.com/embed/${videoId}${queryString}`;
  }

  return null;
}
