export const iOS =
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

export const isAndroid =
  typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

export const isClient =
  typeof navigator !== 'undefined' && typeof window !== 'undefined';

export const isDesktop =
  typeof navigator !== 'undefined' &&
  /Windows|Macintosh|Linux/.test(navigator.userAgent);
