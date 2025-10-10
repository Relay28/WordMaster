// Simple sanitizer for plain text display
// Removes control chars, bidi overrides, and zero-widths. React escapes HTML by default,
// so we avoid encoding and only normalize dangerous unicode.
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F-\u009F]/g; // C0 and C1 control chars
const DANGEROUS_UNICODE_RE = /[\u202A-\u202E\u2066-\u2069\u200B\u200C\u200D\u2060\uFEFF]/g; /**
 * Sanitizes plain text by removing control characters and dangerous Unicode (bidi marks and zero-widths), then trimming surrounding whitespace.
 * @param {*} input - Value to sanitize; if `null` or `undefined`, an empty string is returned. Non-null inputs are converted to a string before processing.
 * @returns {string} The sanitized string with C0/C1 control characters and bidi/zero-width characters removed and trimmed.
 */

export function sanitizePlainText(input) {
  if (input == null) return '';
  const str = String(input);
  return str.replace(CONTROL_CHARS_RE, '').replace(DANGEROUS_UNICODE_RE, '').trim();
}

export default sanitizePlainText;