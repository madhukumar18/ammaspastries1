/**
 * Formats image URLs so they load reliably across local dev, mobile, and tunnels.
 * Converts absolute localhost URLs (http://127.0.0.1:8000/storage/...) into relative /storage/... paths.
 */
export function formatImageUrl(url, fallback = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700') {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }
  const trimmed = url.trim();
  if (trimmed.includes('/storage/')) {
    const idx = trimmed.indexOf('/storage/');
    return trimmed.substring(idx);
  }
  return trimmed;
}

export default formatImageUrl;
