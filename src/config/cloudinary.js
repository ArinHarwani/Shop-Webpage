/**
 * Cloudinary Multi-Account Configuration & Helpers
 * 
 * Groups product categories into 4 Cloudinary accounts (+ default fallback)
 * to distribute image hosting and CDN bandwidth.
 */

// Default legacy / fallback account
export const DEFAULT_CLOUDINARY_ACCOUNT = {
  cloudName: import.meta.env.VITE_CLOUDINARY_FALLBACK_CLOUD_NAME || 'dvdxdqnie',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_FALLBACK_PRESET || 'shop_products_upload',
  folder: 'shop-products',
};

// 4 Account Configurations
export const CLOUDINARY_ACCOUNTS = {
  // Account 1: Tops & Kurtis
  TOPS_KURTIS: {
    id: 'tops_kurtis',
    label: 'Tops & Kurtis',
    cloudName: import.meta.env.VITE_CLOUDINARY_TOPS_KURTIS_CLOUD_NAME || 'jj9xtjbf',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_TOPS_KURTIS_PRESET || 'shop_products_upload',
    folder: 'shop-products',
    categories: ['top', 'kurti'],
  },
  // Account 2: One Piece & Dresses
  DRESSES_ONEPIECE: {
    id: 'dresses_onepiece',
    label: 'One Piece & Dresses',
    cloudName: import.meta.env.VITE_CLOUDINARY_DRESSES_CLOUD_NAME || 'slvabepb',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_DRESSES_PRESET || 'shop_products_upload',
    folder: 'shop-products',
    categories: ['long_dress', 'one_piece'],
  },
  // Account 3: Denims & Shorts (Bottoms)
  BOTTOMS_SHORTS: {
    id: 'bottoms_shorts',
    label: 'Denims & Shorts',
    cloudName: import.meta.env.VITE_CLOUDINARY_BOTTOMS_CLOUD_NAME || 'dvdxdqnie',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_BOTTOMS_PRESET || 'shop_products_upload',
    folder: 'shop-products',
    categories: ['bottom', 'shorts'],
  },
  // Account 4: Traditional Wear & Others (Coord Sets, etc.)
  TRADITIONAL_OTHER: {
    id: 'traditional_other',
    label: 'Traditional Wear & Others',
    cloudName: import.meta.env.VITE_CLOUDINARY_TRADITIONAL_CLOUD_NAME || 'wzxbak9l',
    uploadPreset: import.meta.env.VITE_CLOUDINARY_TRADITIONAL_PRESET || 'shop_products_upload',
    folder: 'shop-products',
    categories: ['coord_set', 'other', 'traditional'],
  },
};

/**
 * Category key to Cloudinary account map
 */
export const CATEGORY_TO_ACCOUNT_MAP = {
  top: CLOUDINARY_ACCOUNTS.TOPS_KURTIS,
  kurti: CLOUDINARY_ACCOUNTS.TOPS_KURTIS,
  long_dress: CLOUDINARY_ACCOUNTS.DRESSES_ONEPIECE,
  one_piece: CLOUDINARY_ACCOUNTS.DRESSES_ONEPIECE,
  bottom: CLOUDINARY_ACCOUNTS.BOTTOMS_SHORTS,
  shorts: CLOUDINARY_ACCOUNTS.BOTTOMS_SHORTS,
  coord_set: CLOUDINARY_ACCOUNTS.TRADITIONAL_OTHER,
  other: CLOUDINARY_ACCOUNTS.TRADITIONAL_OTHER,
  traditional: CLOUDINARY_ACCOUNTS.TRADITIONAL_OTHER,
};

/**
 * Get Cloudinary account configuration for a given category key
 * @param {string} category 
 * @returns {object} { cloudName, uploadPreset, folder }
 */
export function getCloudinaryConfigForCategory(category) {
  if (!category) return DEFAULT_CLOUDINARY_ACCOUNT;
  const normalized = category.toString().trim().toLowerCase();
  return CATEGORY_TO_ACCOUNT_MAP[normalized] || DEFAULT_CLOUDINARY_ACCOUNT;
}

/**
 * Build transformation string for Cloudinary URLs
 * e.g., "f_auto,q_auto,dpr_auto,w_500,c_limit"
 */
export function buildTransformString(width = 500, quality = 'auto', crop = 'c_limit') {
  let targetWidth = 500;
  let targetQuality = 'auto';
  let targetCrop = crop || 'c_limit';

  if (typeof width === 'object' && width !== null) {
    targetWidth = width.width ?? 500;
    targetQuality = width.quality ?? 'auto';
    targetCrop = width.crop ?? 'c_limit';
  } else {
    targetWidth = width ?? 500;
    targetQuality = quality ?? 'auto';
  }

  const transformList = ['f_auto'];

  if (targetQuality === 'auto') {
    transformList.push('q_auto');
  } else if (typeof targetQuality === 'string' && targetQuality.startsWith('auto:')) {
    transformList.push(`q_${targetQuality}`);
  } else {
    transformList.push(`q_${targetQuality}`);
  }

  transformList.push('dpr_auto');

  if (targetWidth) {
    transformList.push(`w_${targetWidth}`);
    if (targetCrop) {
      transformList.push(targetCrop);
    }
  }

  return transformList.join(',');
}

/**
 * Build dynamic Cloudinary URL from publicId and cloudName
 */
export function buildCloudinaryUrl(publicId, cloudName, width = 500, quality = 'auto', crop = 'c_limit') {
  if (!publicId) return '';
  const resolvedCloudName = cloudName || DEFAULT_CLOUDINARY_ACCOUNT.cloudName;
  const transformString = buildTransformString(width, quality, crop);
  const cleanPublicId = publicId.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${resolvedCloudName}/image/upload/${transformString}/${cleanPublicId}`;
}

/**
 * Optimizes an existing image URL or constructs a dynamic one with proper Cloudinary account routing
 * @param {string|object} urlOrVariant - Either a URL string or an object with { image_url, cloudinary_public_id, cloudinary_cloud_name }
 * @param {number|object} width - Target width or options object
 * @param {string} quality - Target quality (e.g. 'auto')
 * @returns {string} Optimized URL
 */
export function getOptimizedImageUrl(urlOrVariant, width = 500, quality = 'auto') {
  if (!urlOrVariant) return '';

  // If passed a variant/colour object directly
  if (typeof urlOrVariant === 'object') {
    const publicId = urlOrVariant.cloudinary_public_id || urlOrVariant.image_public_id;
    const cloudName = urlOrVariant.cloudinary_cloud_name;
    if (publicId && cloudName) {
      return buildCloudinaryUrl(publicId, cloudName, width, quality);
    }
    // Fall back to url property if present
    urlOrVariant = urlOrVariant.image_url || urlOrVariant.url || '';
  }

  if (typeof urlOrVariant !== 'string' || !urlOrVariant) {
    return '';
  }

  // If not a Cloudinary URL, return as-is
  if (!urlOrVariant.includes('res.cloudinary.com')) {
    return urlOrVariant;
  }

  // Strip query strings to maintain CDN cache efficiency
  const cleanUrl = urlOrVariant.split('?')[0];

  const transformString = buildTransformString(width, quality);
  const uploadPattern = '/image/upload/';
  const uploadIndex = cleanUrl.indexOf(uploadPattern);
  if (uploadIndex === -1) {
    return cleanUrl;
  }

  const baseUrl = cleanUrl.slice(0, uploadIndex + uploadPattern.length);
  let rest = cleanUrl.slice(uploadIndex + uploadPattern.length);

  // Strip any existing transformation segments (e.g. f_auto,q_auto,w_500/)
  rest = rest.replace(/^(?:(?:(?:f|q|w|h|c|g|dpr|fl|e|r|b|co|ar)_[a-zA-Z0-9_.:-]+,?)+\/)+/, '');

  return `${baseUrl}${transformString}/${rest}`;
}
