/**
 * Sanitizer Utility - Clean common encoding artifacts from strings
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') return str;

  return str
    .replace(/â€“/g, '–') // Fix en-dash artifact
    .replace(/â€”/g, '—') // Fix em-dash artifact
    .replace(/â€™/g, "'") // Fix apostrophe artifact
    .replace(/â€˜/g, "'") // Fix apostrophe artifact
    .replace(/â€œ/g, '"') // Fix quote artifact
    .replace(/â€ /g, '"') // Fix quote artifact
    .replace(/â€¢/g, '•') // Fix bullet artifact
    .replace(/ï¸ /g, '')   // Fix variation selector artifact
    .replace(/Â/g, '')     // Fix non-breaking space artifact
    .replace(/ðŸ“˜/g, '📖') // Fix common emoji artifacts
    .replace(/ðŸ’¡/g, '💡')
    .replace(/ðŸš€/g, '🚀')
    .replace(/ðŸ” /g, '🔍')
    .replace(/ðŸ“ /g, '📝')
    .replace(/ðŸ§¬/g, '🧪')
    .replace(/âœ…/g, '✅')
    .trim();
}

/**
 * Recursively sanitize objects
 */
export function sanitizeObject(obj) {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Don't sanitize internal MongoDB fields or IDs
      if (key === '_id' || key === 'id' || key.includes('Id')) {
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }
  
  return obj;
}
