'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createDayCapsulePayloadFromActiveDay,
  readStoredDayCapsulePayload,
  resolveDayIdentityClump,
} from '../../src/services/summationService';
import {
  buildDayCapsuleRenderRequest,
  getDayCapsuleRenderStatus,
  readPersistedDayCapsuleRender,
  requestDayCapsuleRender,
} from '../../src/services/dayCapsuleRenderService';
import '../../styles/sections/the-summation.css';

const BACKGROUND_URL = '/backgrounds/THE-SUMMATION/the-summation-bg.png';
const DRAFT_EVENT_NAME = 'truthinstyle-summation-draft';
const OPEN_EYE_EVENT_NAME = 'truthinstyle-open-eye-of-truth';

function ShellPanel({ className = '', eyebrow, title, children }) {
  return (
    <section className={`summation-panel ${className}`.trim()}>
      <header className="summation-panel-header">
        {eyebrow ? <p>{eyebrow}</p> : null}
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function DetailPill({ label, value }) {
  const display = value === null || value === undefined || value === '' ? 'Missing / empty' : value;
  return (
    <span className="summation-detail-pill">
      <strong>{label}</strong>
      {display}
    </span>
  );
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0 && value.some(hasValue);
  if (isPlainObject(value)) return Object.values(value).some(hasValue);
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

function humanizeKey(key) {
  return String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toUpperCase();
}

function DisplayValue({ value }) {
  if (!hasValue(value)) return <span className="summation-missing-value">Missing / empty</span>;
  if (Array.isArray(value)) {
    return <ul className="summation-source-list">{value.map((item, index) => <li key={index}><DisplayValue value={item} /></li>)}</ul>;
  }
  if (isPlainObject(value)) {
    return (
      <dl className="summation-source-subgrid">
        {Object.entries(value).map(([key, entryValue]) => (
          <div key={key}>
            <dt>{humanizeKey(key)}</dt>
            <dd><DisplayValue value={entryValue} /></dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span>{String(value)}</span>;
}

function SourceRow({ label, value }) {
  return (
    <div className="summation-source-row">
      <dt>{label}</dt>
      <dd><DisplayValue value={value} /></dd>
    </div>
  );
}


function yesNo(value) {
  return value ? 'yes' : 'no';
}

function RendererConfigDiagnostic({ diagnostic }) {
  if (!diagnostic) return null;
  const checks = diagnostic.checks || {};
  const rows = [
    ['Provider configured', yesNo(checks.providerConfigured)],
    ['OpenAI key present', yesNo(checks.openAiKeyPresent)],
    ['Storage mode', checks.storageMode || 'missing'],
    ['Supabase URL present', yesNo(checks.supabaseUrlPresent)],
    ['Supabase service role present', yesNo(checks.supabaseServiceRolePresent)],
    ['Supabase bucket present', yesNo(checks.supabaseBucketPresent)],
    ['External endpoint configured', yesNo(checks.externalEndpointConfigured)],
  ];
  return (
    <details className="summation-config-diagnostic" open>
      <summary>Renderer Configuration</summary>
      <dl>
        {rows.map(([label, value]) => <DetailPill key={label} label={label} value={value} />)}
      </dl>
      {diagnostic.missingEnv?.length ? (
        <p className="summation-missing-config">Missing config: {diagnostic.missingEnv.join(', ')}</p>
      ) : <p className="summation-config-ready">Required Supabase renderer config present.</p>}
    </details>
  );
}

function PayloadSourceSnapshot({ payload }) {
  const snapshot = payload?.sourceSnapshot || {};
  const rows = [
    ['Diary entry', payload?.assuredThoughts?.diaryEntry],
    ['Penny questions', payload?.assuredThoughts?.pennyQuestions],
    ['Mood', snapshot.mood],
    ['Word of the day', snapshot.wordOfDay],
    ['Head hummer', snapshot.headHummer],
    ['Era', snapshot.era],
    ['Singleness level', snapshot.singlenessLevel],
    ['Moments', snapshot.moments],
    ['THICC.TIME signals', snapshot.thiccTimeSignals],
    ['Remember.Me moments', snapshot.rememberMeMoments],
    ['THICC.FITT signals', snapshot.thiccFittSignals],
    ['DA.EATER signals', snapshot.daEaterSignals],
    ['Other signals', snapshot.otherSignals],
  ];
  return <dl className="summation-source-truth-list">{rows.map(([label, value]) => <SourceRow key={label} label={label} value={value} />)}</dl>;
}

export default function TheSummationSection() {
  const [payload, setPayload] = useState(null);
  const [bootstrapStatus, setBootstrapStatus] = useState('');
  const [renderRecord, setRenderRecord] = useState(() => readPersistedDayCapsuleRender());
  const [configDiagnostic, setConfigDiagnostic] = useState(null);
  const [isRendering, setIsRendering] = useState(false);

  const loadPayload = useCallback(() => {
    const rawPayload = readStoredDayCapsulePayload();
    const storedPayload = rawPayload ? { ...rawPayload, dayIdentity: resolveDayIdentityClump({ ...(rawPayload.dayIdentity || {}), sourceDate: rawPayload.dayIdentity?.sourceDate || rawPayload.sourceDate }) } : null;
    const storedRender = getDayCapsuleRenderStatus(storedPayload?.payloadId ? `${storedPayload.payloadId}-render` : undefined);
    const renderRequest = storedPayload ? buildDayCapsuleRenderRequest(storedPayload) : null;
    const connectedRender = storedPayload && !storedRender?.renderRequest
      ? { renderId: renderRequest.renderId, payloadId: renderRequest.payloadId, status: 'external_renderer_ready', renderRequest, message: 'Day Capsule external render request ready.' }
      : storedRender;
    setPayload(storedPayload);
    setRenderRecord(connectedRender);
  }, []);

  const refreshRendererConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/day-capsule-render', { method: 'GET' });
      const result = await response.json().catch(() => ({}));
      setConfigDiagnostic(result?.configDiagnostic || null);
      if (result?.status === 'external_renderer_ready' && payload && (!renderRecord || ['idle', 'external_renderer_not_configured', 'ready_to_render'].includes(renderRecord.status))) {
        const renderRequest = buildDayCapsuleRenderRequest(payload);
        setRenderRecord({ renderId: renderRequest.renderId, payloadId: renderRequest.payloadId, status: 'external_renderer_ready', renderRequest, message: 'Day Capsule external render request ready.' });
      }
      return result;
    } catch (error) {
      setBootstrapStatus(error?.message || 'Renderer configuration check failed.');
      return null;
    }
  }, [payload, renderRecord]);

  useEffect(() => {
    loadPayload();
    const onPayload = () => loadPayload();
    window.addEventListener(DRAFT_EVENT_NAME, onPayload);
    return () => window.removeEventListener(DRAFT_EVENT_NAME, onPayload);
  }, [loadPayload]);

  useEffect(() => {
    refreshRendererConfig();
  }, [refreshRendererConfig]);

  const dayIdentity = payload?.dayIdentity || {};
  const title = dayIdentity.titleOfDay || 'No Day Capsule payload loaded';
  const pennyAnswers = useMemo(() => payload?.assuredThoughts?.pennyQuestions || [], [payload]);
  const renderStatus = renderRecord?.status || 'idle';
  const renderMessage = useMemo(() => {
    if (!payload) return 'Use the Crystal Wand to prepare a Day Capsule payload first.';
    if (!renderRecord?.renderRequest) return 'Day Capsule render request ready.';
    if (renderStatus === 'local_proof_rendered') return 'Local proof render created from the real Day Capsule payload.';
    if (renderStatus === 'external_renderer_not_configured') return 'External renderer is not configured yet. See renderer configuration checklist.';
    if (renderStatus === 'external_renderer_ready') return 'Day Capsule external render request ready.';
    if (renderStatus === 'external_rendering') return 'Rendering Day Capsule…';
    if (renderStatus === 'external_rendered') return 'Day Capsule rendered by external illustrated renderer.';
    if (renderStatus === 'external_render_failed') return renderRecord?.error || renderRecord?.message || 'External Day Capsule render failed.';
    if (renderStatus === 'renderer_not_connected') return 'External renderer is not configured yet.';
    if (renderStatus === 'ready_to_render') return 'Day Capsule render request ready.';
    if (renderStatus === 'queued') return 'Day Capsule render queued.';
    if (renderStatus === 'rendering') return 'Rendering Day Capsule…';
    if (renderStatus === 'rendered') return 'Day Capsule rendered by legacy adapter status.';
    if (renderStatus === 'revision_requested') return 'Day Capsule revision requested.';
    if (renderStatus === 'revised') return 'Day Capsule revised.';
    if (renderStatus === 'failed') return 'Day Capsule render failed.';
    return payload.status || 'Day Capsule render request ready.';
  }, [payload, renderRecord, renderStatus]);

  const handleRequestExternalRender = useCallback(async (sourcePayload = payload) => {
    if (!sourcePayload) {
      setBootstrapStatus('Use the Crystal Wand to prepare a Day Capsule payload first.');
      return null;
    }

    const renderRequest = buildDayCapsuleRenderRequest(sourcePayload);
    setIsRendering(true);
    setRenderRecord({ renderId: renderRequest.renderId, payloadId: renderRequest.payloadId, status: 'external_rendering', renderRequest, message: 'Rendering Day Capsule…' });
    setBootstrapStatus('Rendering Day Capsule…');
    try {
      const pendingRender = await requestDayCapsuleRender(renderRequest);
      setRenderRecord(pendingRender);
      setConfigDiagnostic(pendingRender?.configDiagnostic || configDiagnostic);
      setBootstrapStatus(pendingRender?.message || pendingRender?.error || 'Day Capsule external render request complete.');
      return pendingRender;
    } finally {
      setIsRendering(false);
    }
  }, [payload, configDiagnostic]);

  const handleBuildFromActiveDay = async () => {
    setBootstrapStatus('Checking active day…');
    const result = await createDayCapsulePayloadFromActiveDay();
    if (!result?.payload) {
      setBootstrapStatus(result?.error || 'Use the Crystal Wand to prepare a Day Capsule payload first.');
      return;
    }
    setPayload(result.payload);
    await handleRequestExternalRender(result.payload);
  };

  const previewArtifact = renderRecord?.renderArtifact;
  const previewUrl = previewArtifact?.url || renderRecord?.artifactUrl || renderRecord?.artifactPath || renderRecord?.previewPath;
  const canShowArtifact = Boolean(previewUrl) && renderStatus === 'external_rendered';
  const actionableStatuses = ['external_renderer_not_configured', 'external_render_failed', 'ready_to_render', 'external_renderer_ready'];
  const canRequestExternal = Boolean(payload) && actionableStatuses.includes(renderStatus) && !isRendering;
  const renderButtonReason = !payload ? 'no payload' : isRendering ? 'currently rendering' : !dayIdentity?.sourceDate ? 'missing active day' : (!canRequestExternal && renderStatus === 'external_renderer_not_configured') ? 'missing config' : (!actionableStatuses.includes(renderStatus) ? `status ${renderStatus} is not actionable` : 'ready');

  const handleOpenEye = () => {
    window.dispatchEvent(new CustomEvent(OPEN_EYE_EVENT_NAME));
    setBootstrapStatus('Eye of Truth opened from the right-side rail.');
  };

  return (
    <main className="summation-shell" style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}>
      <div className="summation-background-plate" aria-hidden="true" />
      <section className="summation-stage" aria-label="THE.SUMMATION Day Capsule payload shell">
        <div className="summation-render-zone">
          <div className="summation-render-surface">
            <article className="summation-payload-ready-card">
              <p className="summation-status-kicker">{renderMessage}</p>
              <h1>{title}</h1>
              {payload ? (
                <>
                  <div className="summation-day-identity-strip" aria-label="Day Identity Clump">
                    <DetailPill label="Title of Day" value={dayIdentity.titleOfDay} />
                    <DetailPill label="Display Date" value={dayIdentity.displayDate} />
                    <DetailPill label="Day of Week" value={dayIdentity.dayOfWeek} />
                    <DetailPill label="Chaotica" value={dayIdentity.chaoticaDayNumber ? `Day #${dayIdentity.chaoticaDayNumber}` : null} />
                  </div>
                  {canShowArtifact ? (
                    <figure className="summation-render-proof-frame">
                      <img className="summation-render-artifact" src={previewUrl} alt={`Rendered Day Capsule for ${title}`} />
                      <figcaption>{renderStatus === 'local_proof_rendered' ? 'Development proof only — not the final illustrated Day Capsule.' : 'External illustrated Day Capsule artifact.'}</figcaption>
                    </figure>
                  ) : (
                    <>
                      <p>{renderMessage}</p>
                      <div className="summation-render-actions">
                        <button type="button" className="summation-render-button" disabled={!canRequestExternal} onClick={() => handleRequestExternalRender()}>
                          {renderStatus === 'external_renderer_ready' || renderStatus === 'ready_to_render' ? 'Start external render' : 'Retry external render'}
                        </button>
                        <p className="summation-button-reason">Button state: {renderButtonReason}</p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="summation-bootstrap-actions" aria-label="Day Capsule payload actions">
                  <p>Use the Crystal Wand to prepare a Day Capsule payload first.</p>
                  <button type="button" onClick={handleBuildFromActiveDay}>Build payload from active day</button>
                  <button type="button" onClick={handleOpenEye}>Open Eye of Truth</button>
                  {bootstrapStatus ? <p role="status">{bootstrapStatus}</p> : null}
                </div>
              )}
            </article>
          </div>
        </div>

        <aside className="summation-art-preserve" aria-label="THE.SUMMATION preserved right art rail">
          <ShellPanel className="summation-identity-panel" eyebrow="Payload State" title="Day Capsule">
            <DetailPill label="Status" value={renderMessage || bootstrapStatus || 'Use the Crystal Wand to prepare a Day Capsule payload first.'} />
            <DetailPill label="Render ID" value={renderRecord?.renderId} />
            <DetailPill label="Payload ID" value={payload?.payloadId} />
            <DetailPill label="Updated" value={payload?.updatedAt} />
            <RendererConfigDiagnostic diagnostic={configDiagnostic || renderRecord?.configDiagnostic} />
          </ShellPanel>
        </aside>
      </section>
    </main>
  );
}
