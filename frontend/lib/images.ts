export const DEFAULT_GIG_PLACEHOLDER = "/placeholder.svg?height=360&width=640";

export type TransformOptions = {
  w?: number;
  h?: number;
  c?: string; // crop mode, e.g., 'fill'
  f?: string; // format, e.g., 'auto'
  q?: string | number; // quality, e.g., 'auto'
};

export function transformCloudinary(url?: string | null, opts: TransformOptions = {}): string {
  if (!url) return DEFAULT_GIG_PLACEHOLDER;
  try {
    const isCloudinary = /res\.cloudinary\.com/.test(url);
    if (!isCloudinary) return url;

    const { w = 640, h = 360, c = 'fill', f = 'auto', q = 'auto' } = opts;
    const transform = [`c_${c}`, `w_${w}`, `h_${h}`, `q_${q}`, `f_${f}`]
      .filter(Boolean)
      .join(',');

    const parts = url.split('/upload/');
    if (parts.length < 2) return url;
    const before = parts[0];
    const after = parts[1];

    // Insert our transform before any version or public_id segments
    return `${before}/upload/${transform}/${after}`;
  } catch {
    return url || DEFAULT_GIG_PLACEHOLDER;
  }
}

export function getGigThumb(url?: string | null, w = 640, h = 360): string {
  return transformCloudinary(url, { w, h, c: 'fill', f: 'auto', q: 'auto' });
}
