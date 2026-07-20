import sharp from 'sharp';

export const OPTIMIZED_IMAGE_TYPE = 'image/webp';
export const OPTIMIZED_IMAGE_EXTENSION = 'webp';

const DEFAULT_MAX_WIDTH = 1400;
const DEFAULT_MAX_HEIGHT = 1800;
const DEFAULT_TARGET_BYTES = 260 * 1024;
const MIN_QUALITY = 58;
const MAX_QUALITY = 84;

export function canOptimizeImage(contentType = '') {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(contentType);
}

export function optimizedImagePath(originalPath = '') {
  const cleanPath = String(originalPath || '').replace(/\.[a-z0-9]+$/i, '');
  return `${cleanPath}.${OPTIMIZED_IMAGE_EXTENSION}`;
}

export async function optimizeImageBuffer(input, options = {}) {
  const source = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const contentType = options.contentType || '';

  if (!canOptimizeImage(contentType)) {
    return {
      buffer: source,
      contentType,
      extension: contentType.split('/')[1] || 'bin',
      optimized: false,
      originalBytes: source.length,
      outputBytes: source.length,
    };
  }

  const targetBytes = options.targetBytes || DEFAULT_TARGET_BYTES;
  const maxWidth = options.maxWidth || DEFAULT_MAX_WIDTH;
  const maxHeight = options.maxHeight || DEFAULT_MAX_HEIGHT;

  const base = sharp(source, { animated: false, limitInputPixels: 30_000_000 })
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });

  let best = null;
  for (const quality of [MAX_QUALITY, 78, 72, 66, 62, MIN_QUALITY]) {
    const candidate = await base
      .clone()
      .webp({
        quality,
        effort: 5,
        smartSubsample: true,
      })
      .toBuffer();

    best = { buffer: candidate, quality };
    if (candidate.length <= targetBytes) break;
  }

  if (!best || best.buffer.length >= source.length * 0.95) {
    return {
      buffer: source,
      contentType,
      extension: contentType.split('/')[1] || 'bin',
      optimized: false,
      originalBytes: source.length,
      outputBytes: source.length,
    };
  }

  return {
    buffer: best.buffer,
    contentType: OPTIMIZED_IMAGE_TYPE,
    extension: OPTIMIZED_IMAGE_EXTENSION,
    optimized: true,
    quality: best.quality,
    originalBytes: source.length,
    outputBytes: best.buffer.length,
  };
}
