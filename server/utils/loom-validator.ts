export function validateAndNormalizeLoomUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  const loomEmbedPattern = /^https:\/\/www\.loom\.com\/embed\/([a-zA-Z0-9]+)$/;
  const loomSharePattern = /^https:\/\/www\.loom\.com\/share\/([a-zA-Z0-9]+)/;

  let match = trimmed.match(loomEmbedPattern);
  if (match) {
    return trimmed;
  }

  match = trimmed.match(loomSharePattern);
  if (match) {
    return `https://www.loom.com/embed/${match[1]}`;
  }

  return null;
}
