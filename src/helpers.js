const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1660893978186-04bb33247dc0?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1655516557079-a969d3509876?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1519494140681-8b17d830a3e9?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1659275136863-6f27b069e1f7?auto=format&fit=crop&w=1200&q=70'
];

export function getSiteCover(siteId) {
  if (!siteId) return COVER_IMAGES[0];
  const sum = siteId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return COVER_IMAGES[sum % COVER_IMAGES.length];
}
