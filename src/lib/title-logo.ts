export function buildTitleLogoUrl(filePath: string, maxWidth = 800) {
  return `https://wsrv.nl/?url=${encodeURIComponent(
    `https://image.tmdb.org/t/p/original${filePath}`,
  )}&output=webp&q=80&w=${maxWidth}`;
}
