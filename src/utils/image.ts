export function withCacheBust(uri: string, cacheKey?: string | number) {
  if (!uri) return uri;
  // Local URIs shouldn't be cache-busted.
  if (
    uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://')
  ) {
    return uri;
  }
  if (cacheKey === undefined || cacheKey === null || cacheKey === '') {
    return uri;
  }
  const sep = uri.includes('?') ? '&' : '?';
  return `${uri}${sep}cb=${encodeURIComponent(String(cacheKey))}`;
}

