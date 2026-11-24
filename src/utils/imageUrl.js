// Image item kisi bhi shape mein aaye (string, { url }, { watermarkedUrl }, { secure_url }) → URL string
export function imageUrl(img, { preferWatermarked = true } = {}) {
  if (!img) return '';
  if (typeof img === 'string') return img;
  const url = (preferWatermarked && img.watermarkedUrl) || img.url || img.secure_url || img.src || img.imageUrl || img.watermarkedUrl;
  return typeof url === 'string' ? url : '';
}

export const imageUrls = (list, opts) => (Array.isArray(list) ? list.map((i) => imageUrl(i, opts)).filter(Boolean) : []);
