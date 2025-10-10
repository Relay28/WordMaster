// Simple sanitizer for plain text display
// Removes control chars, bidi overrides, and zero-widths. React escapes HTML by default,
// so we avoid encoding and only normalize dangerous unicode.
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F-\u009F]/g; // C0 and C1 control chars
const DANGEROUS_UNICODE_RE = /[\u202A-\u202E\u2066-\u2069\u200B\u200C\u2060\uFEFF]|\u200D/g; // bidi marks and zero-widths (ZWJ handled outside class)

export function sanitizePlainText(input) {
  if (input == null) return '';
  const str = String(input);
  return str.replace(CONTROL_CHARS_RE, '').replace(DANGEROUS_UNICODE_RE, '').trim();
}

export default sanitizePlainText;