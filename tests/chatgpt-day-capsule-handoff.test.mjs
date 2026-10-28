import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const records = new Map();
globalThis.window = {
  localStorage: {
    getItem(key) { return records.has(key) ? records.get(key) : null; },
    setItem(key, value) { records.set(key, value); },
  },
  setTimeout,
  clearTimeout,
};

const {
  DAY_CAPSULE_RENDER_STATUSES,
  requestDayCapsuleRender,
} = await import('../src/services/dayCapsuleRenderService.js');

test('Day Capsule requests prepare a ChatGPT handoff through the authenticated app endpoint', async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      async json() {
        return {
          renderId: 'day-capsule-2026-10-28-render',
          payloadId: 'day-capsule-2026-10-28',
          status: DAY_CAPSULE_RENDER_STATUSES.CHATGPT_HANDOFF_READY,
          providerPrompt: 'Prepared ChatGPT prompt',
          providerMetadata: { provider: 'chatgpt_handoff' },
        };
      },
    };
  };

  try {
    const result = await requestDayCapsuleRender({
      renderId: 'day-capsule-2026-10-28-render',
      payloadId: 'day-capsule-2026-10-28',
      dayIdentity: { sourceDate: '2026-10-28' },
      sourceSnapshot: {},
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/api/day-capsule-render');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(result.status, DAY_CAPSULE_RENDER_STATUSES.CHATGPT_HANDOFF_READY);
    assert.equal(result.providerMetadata.provider, 'chatgpt_handoff');
    assert.equal(result.providerPrompt, 'Prepared ChatGPT prompt');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('active handoff route cannot call the direct OpenAI or external renderer paths', async () => {
  const routeSource = await readFile(new URL('../app/api/day-capsule-render/route.js', import.meta.url), 'utf8');
  const successfulHandoffResponse = routeSource.slice(routeSource.indexOf("console.info('day-capsule-chatgpt-handoff-ready'"));

  assert.match(routeSource, /chatgpt_handoff_with_authenticated_return/);
  assert.doesNotMatch(successfulHandoffResponse, /\n\s*renderRequest,\n\s*renderArtifact/);
  assert.doesNotMatch(routeSource, /renderDayCapsuleWithProvider/);
  assert.doesNotMatch(routeSource, /DAY_CAPSULE_RENDER_ENDPOINT/);
  assert.doesNotMatch(routeSource, /api\.openai\.com/);
});

test('finished ChatGPT visualization still returns through the authenticated Supabase upload route', async () => {
  const routeSource = await readFile(new URL('../app/api/day-capsule-render/manual/route.js', import.meta.url), 'utf8');

  assert.match(routeSource, /getChaoticaSession/);
  assert.match(routeSource, /uploadDayCapsuleArtifactToSupabase/);
  assert.match(routeSource, /manual_chatgpt_upload/);
});
