/**
 * Sanitizer Utility - Clean common encoding artifacts from strings
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') return str;

  return str
    .replace(/â€“/g, '-')
    .replace(/â€”/g, '-')
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€ /g, '"')
    .replace(/â€¢/g, '•')
    .replace(/ï¸ /g, '')
    .replace(/Â/g, '')
    .replace(/â†'/g, '->')
    .replace(/â†’/g, '->')
    .replace(/â†/g, '->') // Prefix catch-all
    .replace(/eâ»/g, 'e-')
    .replace(/e⁻/g, 'e-')
    .replace(/eâ/g, 'e-') // Prefix catch-all
    .replace(/ðŸ“˜/g, '📖')
    .replace(/ðŸ’¡/g, '💡')
    .replace(/ðŸš€/g, '🚀')
    .replace(/ðŸ” /g, '🔍')
    .replace(/ðŸ“ /g, '📝')
    .replace(/ðŸ“Œ/g, '📌')
    .replace(/ðŸ”¹/g, '🔹')
    .replace(/ðŸ§ /g, '🧠')
    .replace(/ðŸ§¬/g, '🧪')
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
