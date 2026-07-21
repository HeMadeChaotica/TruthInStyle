'use client';

import { useEffect, useRef } from 'react';
import { registerSectionSaveHandler } from '../../lib/state/autosaveRegistry';

const META_KEY = 'truthinstyle_cloud_state_meta_v1';
const MAX_VALUE_BYTES = 400000;
const MAX_SNAPSHOT_BYTES = 3000000;

function safeParse(value, fallback = {}) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function collectValues() {
  const values = {};
  let bytes = 0;
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || key === META_KEY) continue;
    const value = window.localStorage.getItem(key);
    if (typeof value !== 'string' || value.length > MAX_VALUE_BYTES || bytes + value.length > MAX_SNAPSHOT_BYTES) continue;
    values[key] = value;
    bytes += key.length + value.length;
  }
  return values;
}

async function requestCloudState(method, state) {
  const response = await fetch('/api/cloud-state', {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
    body: method === 'POST' ? JSON.stringify({ state }) : undefined,
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(body?.error || `Cloud state returned HTTP ${response.status}.`);
  return body;
}

export default function CloudStateBridge() {
  const stateRef = useRef({});
  const syncRef = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    let timer;

    const sync = () => {
      syncRef.current = syncRef.current.then(async () => {
        if (!active) return;
        const values = collectValues();
        const now = new Date().toISOString();
        const next = { ...stateRef.current };
        Object.entries(values).forEach(([key, value]) => {
          if (!next[key] || next[key].value !== value) next[key] = { value, updatedAt: now };
        });
        Object.keys(next).forEach((key) => {
          if (!(key in values) && !next[key]?.deleted) next[key] = { deleted: true, updatedAt: now };
        });
        if (JSON.stringify(next) === JSON.stringify(stateRef.current)) return;
        const saved = await requestCloudState('POST', next);
        if (!saved) return;
        stateRef.current = saved.state || next;
        window.localStorage.setItem(META_KEY, JSON.stringify(Object.fromEntries(Object.entries(stateRef.current).map(([key, entry]) => [key, entry.updatedAt]))));
      }).catch((error) => console.warn('TruthInStyle cloud state sync paused.', error));
      return syncRef.current;
    };

    const initialize = async () => {
      const cloud = await requestCloudState('GET');
      if (!active || !cloud) return;
      const cloudState = cloud.state || {};
      const localMeta = safeParse(window.localStorage.getItem(META_KEY), {});
      let hydratedChange = false;
      Object.entries(cloudState).forEach(([key, entry]) => {
        const localUpdatedAt = localMeta[key];
        if (!localUpdatedAt || Date.parse(entry.updatedAt) >= Date.parse(localUpdatedAt)) {
          if (entry.deleted && window.localStorage.getItem(key) !== null) {
            window.localStorage.removeItem(key);
            hydratedChange = true;
          } else if (!entry.deleted && window.localStorage.getItem(key) !== entry.value) {
            window.localStorage.setItem(key, entry.value);
            hydratedChange = true;
          }
        }
      });
      const values = collectValues();
      const now = new Date().toISOString();
      stateRef.current = { ...cloudState };
      Object.entries(values).forEach(([key, value]) => {
        const existing = stateRef.current[key];
        if (!existing || existing.value !== value) stateRef.current[key] = { value, updatedAt: localMeta[key] || now };
      });
      window.localStorage.setItem(META_KEY, JSON.stringify(Object.fromEntries(Object.entries(stateRef.current).map(([key, entry]) => [key, entry.updatedAt]))));
      await requestCloudState('POST', stateRef.current);
      window.dispatchEvent(new CustomEvent('truthinstyle-cloud-state-hydrated'));
      const reloadKey = 'truthinstyle-cloud-state-reloaded';
      if (hydratedChange && !window.sessionStorage.getItem(reloadKey)) {
        window.sessionStorage.setItem(reloadKey, '1');
        window.location.reload();
        return;
      }
      window.sessionStorage.removeItem(reloadKey);
      timer = window.setInterval(sync, 2500);
    };

    initialize().catch((error) => console.warn('TruthInStyle cloud state unavailable; using local state.', error));
    const unregister = registerSectionSaveHandler('cloud-state', sync);
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
      unregister();
    };
  }, []);

  return null;
}
