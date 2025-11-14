export const validateAndNormalizeLoomUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return undefined;

  try {
    const urlObj = new URL(trimmedUrl);
    
    if (urlObj.hostname !== 'www.loom.com' && urlObj.hostname !== 'loom.com') {
      console.warn('Invalid Loom URL hostname:', urlObj.hostname);
      return undefined;
    }

    const shareMatch = urlObj.pathname.match(/^\/share\/([a-zA-Z0-9]+)/);
    const embedMatch = urlObj.pathname.match(/^\/embed\/([a-zA-Z0-9]+)/);

    if (shareMatch) {
      const videoId = shareMatch[1];
      const queryString = urlObj.search;
      return `https://www.loom.com/embed/${videoId}${queryString}`;
    }

    if (embedMatch) {
      const videoId = embedMatch[1];
      const queryString = urlObj.search;
      return `https://www.loom.com/embed/${videoId}${queryString}`;
    }

    console.warn('Invalid Loom URL format:', trimmedUrl);
    return undefined;
  } catch (error) {
    console.warn('Failed to parse Loom URL:', error);
    return undefined;
  }
};
