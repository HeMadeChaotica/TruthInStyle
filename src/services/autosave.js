import { sourceRepository } from '../storage/storageAdapter.js';

const debounceTimers = new Map();

export function autosaveText({ sectionKey, dateKey, payload, debounceMs = 400 }) {
  const debounceKey = `${sectionKey}:${dateKey}`;
  clearTimeout(debounceTimers.get(debounceKey));
  const timer = setTimeout(() => {
    sourceRepository.write(sectionKey, dateKey, payload);
    debounceTimers.delete(debounceKey);
  }, debounceMs);
  debounceTimers.set(debounceKey, timer);
}

export function autosaveImmediate({ sectionKey, dateKey, payload }) {
  sourceRepository.write(sectionKey, dateKey, payload);
}
