const PRODUCTION_API = 'https://abytrivia.pythonanywhere.com/api';
const isLoopback = hostname => ['localhost', '127.0.0.1', '[::1]'].includes(hostname);

export function resolveApiBase({ hostname, configuredBase, override }) {
  if (override === 'prod') return PRODUCTION_API;

  // A saved local override must never send a hosted HTTPS app to HTTP.
  if (override === 'local' && isLoopback(hostname)) {
    return 'http://127.0.0.1:5555/api';
  }

  const base = configuredBase?.trim().replace(/\/+$/, '');
  if (!base) return PRODUCTION_API;
  if (base.startsWith('/') && !base.startsWith('//')) return base;
  try {
    const url = new URL(base);
    if (!['http:', 'https:'].includes(url.protocol)) return PRODUCTION_API;
    if (!isLoopback(hostname) && (isLoopback(url.hostname) || url.protocol !== 'https:')) {
      return PRODUCTION_API;
    }
    return base;
  } catch {
    return PRODUCTION_API;
  }
}
