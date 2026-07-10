'use client';

const handlers = new Map();
const EXIT_TIMEOUT_MS = 4500;

function withTimeout(promise, timeoutMs = EXIT_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error('save_timeout')), timeoutMs);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => window.clearTimeout(timer));
}

export function registerSectionSaveHandler(key, handler) {
  if (!key || typeof handler !== 'function') return () => {};
  handlers.set(key, handler);
  return () => {
    if (handlers.get(key) === handler) handlers.delete(key);
  };
}

export async function flushAllPendingSaves() {
  const pending = Array.from(handlers.entries()).map(([key, handler]) =>
    withTimeout(handler()).then(
      () => ({ key, ok: true }),
      (error) => ({ key, ok: false, error: error?.message || 'save_failed' }),
    ),
  );

  window.dispatchEvent(new CustomEvent('truthinstyle-autosave-flush'));
  const results = await Promise.all(pending);
  const failed = results.filter((result) => !result.ok);
  return { ok: failed.length === 0, results, failed };
}
