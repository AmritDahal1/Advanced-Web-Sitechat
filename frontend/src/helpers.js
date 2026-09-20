// Site cover images are generated locally as inline SVG gradients rather
// than hotlinked from an external image host. This removes a hard runtime
// dependency on a third-party domain (the previous Unsplash URLs would
// render as a blank grey box on any network that blocks that host, and
// would break entirely offline) and needs no extra asset files.
const GRADIENTS = [
  ['#4F46E5', '#7C3AED'], // indigo -> violet
  ['#0EA5A0', '#0891B2'], // teal -> cyan
  ['#F59E0B', '#EF4444'], // amber -> red
  ['#059669', '#10B981'], // emerald
  ['#DB2777', '#9333EA'], // pink -> purple
];

// Generic local SVG gradient generator, used for any card that needs a
// placeholder cover image without hotlinking to an external image host.
function gradientCover(seed, label) {
  const key = seed === null || seed === undefined ? '' : String(seed);
  const sum = key.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const [from, to] = GRADIENTS[sum % GRADIENTS.length];
  const initial = (label || '?').trim().charAt(0).toUpperCase() || '?';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="280">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}"/>
        <stop offset="1" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="280" fill="url(#g)"/>
    <text x="400" y="185" font-family="Arial, sans-serif" font-size="150" font-weight="700"
      fill="#ffffff" fill-opacity="0.22" text-anchor="middle">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getSiteCover(siteId, siteName) {
  return gradientCover(siteId, siteName);
}

export function getFacilityCover(label) {
  return gradientCover(label, label);
}
