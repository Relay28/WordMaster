// Prefer an explicit VITE_API_URL in production; fall back to empty string so
// client-side code can call relative paths like /api/... when served from the
// same origin or when the hosting platform proxies requests.
const API_URL = import.meta.env.VITE_API_URL || '';

export default { API_URL };
