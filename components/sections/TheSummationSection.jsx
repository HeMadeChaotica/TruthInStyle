'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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

const BACKGROUND_URL = '/backgrounds/THE-SUMMATION/the-summation-day-capsule-bg.png';
const DRAFT_EVENT_NAME = 'truthinstyle-summation-draft';
<<<<<<< ours
<<<<<<< ours
<<<<<<< HEAD
<<<<<<< ours
const SUMMATE_RENDER_EVENT_NAME = 'truthinstyle-summation-render-request';
const PENDING_SUMMATE_RENDER_KEY = 'truthinstyle-pending-summation-render';

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
=======
>>>>>>> theirs
=======
>>>>>>> 288bf624de8a4d113a213d8ae6fbb47f97cc01b7
=======
const SUMMATE_RENDER_EVENT_NAME = 'truthinstyle-summation-render-request';
const PENDING_SUMMATE_RENDER_KEY = 'truthinstyle-pending-summation-render';
>>>>>>> theirs
=======
const SUMMATE_RENDER_EVENT_NAME = 'truthinstyle-summation-render-request';
const PENDING_SUMMATE_RENDER_KEY = 'truthinstyle-pending-summation-render';
>>>>>>> theirs

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
  if (!hasValue(value)) return null;
  if (Array.isArray(value)) {
    return <ul className="summation-source-list">{value.filter(hasValue).map((item, index) => <li key={index}><DisplayValue value={item} /></li>)}</ul>;
  }
  if (isPlainObject(value)) {
    return (
      <dl className="summation-source-subgrid">
        {Object.entries(value).filter(([, entryValue]) => hasValue(entryValue)).map(([key, entryValue]) => (
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

function SourceBlock({ label, value }) {
  if (!hasValue(value)) return null;
  return (
    <section className="summation-record-block">
      <h3>{label}</h3>
      <DisplayValue value={value} />
    </section>
  );
}

function DayRecordPage({ payload, dayIdentity }) {
  if (!payload) {
    return (
      <div className="summation-page-empty" role="status">
        <p>Day Capsule ready.</p>
        <span>Use the global Control Panel sacred triggers to prepare the active day.</span>
      </div>
    );
  }

  const snapshot = payload.sourceSnapshot || {};
  const blocks = [
    ['Native Assurer summary', payload.assuredThoughts?.diaryEntry],
    ['Penny questions', payload.assuredThoughts?.pennyQuestions],
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
  ].filter(([, value]) => hasValue(value));

  return (
    <article className="summation-day-page summation-left-page" aria-label="Factual Day Record">
      <header className="summation-page-header">
        <p>Factual Day Record</p>
        {hasValue(dayIdentity.titleOfDay) ? <h1>{dayIdentity.titleOfDay}</h1> : null}
        <dl className="summation-day-meta">
          {hasValue(dayIdentity.displayDate) ? <div><dt>Date</dt><dd>{dayIdentity.displayDate}</dd></div> : null}
          {hasValue(dayIdentity.dayOfWeek) ? <div><dt>Day</dt><dd>{dayIdentity.dayOfWeek}</dd></div> : null}
          {hasValue(dayIdentity.chaoticaDayNumber) ? <div><dt>Chaotica</dt><dd>Day #{dayIdentity.chaoticaDayNumber}</dd></div> : null}
        </dl>
      </header>
      <div className="summation-record-stack">
        {blocks.length ? blocks.map(([label, value]) => <SourceBlock key={label} label={label} value={value} />) : (
          <div className="summation-page-empty"><p>No factual source sections are present yet.</p></div>
        )}
      </div>
    </article>
  );
}

function VisualizationPage({ payload, renderRecord, renderStatus, renderMessage, previewUrl, canShowArtifact }) {
  if (!payload) {
    return (
      <div className="summation-page-empty" role="status">
        <p>Visualization ready.</p>
        <span>No Day Capsule payload has been prepared yet.</span>
      </div>
    );
  }

  return (
    <article className="summation-day-page summation-right-page" aria-label="Generated Day Visualization">
      <header className="summation-page-header">
        <p>Generated Day Visualization</p>
        <h2>{renderStatus.replace(/_/g, ' ')}</h2>
      </header>
      {canShowArtifact ? (
        <figure className="summation-artifact-frame">
          <img className="summation-render-artifact" src={previewUrl} alt="Generated Day Capsule visualization" />
          <figcaption>{renderRecord?.renderArtifact?.storagePath || renderRecord?.artifactPath || 'External Day Capsule artifact'}</figcaption>
        </figure>
      ) : (
        <div className="summation-visual-status" role="status">
          <p>{renderMessage}</p>
          {renderRecord?.renderId ? <span>Render ID: {renderRecord.renderId}</span> : null}
          {renderRecord?.payloadId ? <span>Payload ID: {renderRecord.payloadId}</span> : null}
        </div>
      )}
    </article>
  );
}

export default function TheSummationSection() {
  const [payload, setPayload] = useState(null);
  const [renderRecord, setRenderRecord] = useState(() => readPersistedDayCapsuleRender());

  const startRender = useCallback(async (nextPayload) => {
    if (!nextPayload) return null;
    const renderRequest = buildDayCapsuleRenderRequest(nextPayload);
    setRenderRecord({
      renderId: renderRequest.renderId,
      payloadId: renderRequest.payloadId,
      status: 'external_rendering',
      renderRequest,
      renderArtifact: null,
      message: 'Rendering Day Capsule…',
    });
    const nextRecord = await requestDayCapsuleRender(renderRequest);
    setRenderRecord(nextRecord);
    return nextRecord;
  }, []);

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

  useEffect(() => {
    loadPayload();
    if (window.sessionStorage.getItem(PENDING_SUMMATE_RENDER_KEY) === '1') {
      window.sessionStorage.removeItem(PENDING_SUMMATE_RENDER_KEY);
      startRender(readStoredDayCapsulePayload());
    }
    const onPayload = () => loadPayload();
    const onRenderRequest = (event) => {
      window.sessionStorage.removeItem(PENDING_SUMMATE_RENDER_KEY);
      const nextPayload = event?.detail?.payload || readStoredDayCapsulePayload();
      startRender(nextPayload);
    };
    window.addEventListener(DRAFT_EVENT_NAME, onPayload);
    window.addEventListener(SUMMATE_RENDER_EVENT_NAME, onRenderRequest);
    return () => {
      window.removeEventListener(DRAFT_EVENT_NAME, onPayload);
      window.removeEventListener(SUMMATE_RENDER_EVENT_NAME, onRenderRequest);
    };
  }, [loadPayload, startRender]);

  const dayIdentity = payload?.dayIdentity || {};
  const renderStatus = renderRecord?.status || 'idle';
  const renderMessage = useMemo(() => {
    if (!payload) return 'Use the global Control Panel to prepare a Day Capsule payload first.';
    if (!renderRecord?.renderRequest) return 'Day Capsule render request ready.';
    if (renderStatus === 'external_renderer_not_configured') return 'External renderer is not configured yet.';
    if (renderStatus === 'external_renderer_ready') return 'Day Capsule external render request ready.';
    if (renderStatus === 'external_rendering' || renderStatus === 'rendering') return 'Rendering Day Capsule…';
    if (renderStatus === 'external_rendered') return 'Day Capsule rendered by external illustrated renderer.';
    if (renderStatus === 'external_render_failed') return renderRecord?.error || renderRecord?.message || 'External Day Capsule render failed.';
    if (renderStatus === 'queued') return 'Day Capsule render queued.';
    if (renderStatus === 'failed') return 'Day Capsule render failed.';
    return renderRecord?.message || payload.status || 'Day Capsule render request ready.';
  }, [payload, renderRecord, renderStatus]);

<<<<<<< HEAD
<<<<<<< ours
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

  useEffect(() => {
    const runSummateRender = async (event) => {
      window.sessionStorage.removeItem(PENDING_SUMMATE_RENDER_KEY);
      const eventPayload = event?.detail?.payload || null;
      const sourcePayload = eventPayload || readStoredDayCapsulePayload();

      if (!sourcePayload) {
        setBootstrapStatus('Use the Crystal Wand to prepare a Day Capsule payload first.');
        return;
      }

      setPayload(sourcePayload);
      await handleRequestExternalRender(sourcePayload);
    };

    window.addEventListener(SUMMATE_RENDER_EVENT_NAME, runSummateRender);

    const hasPendingSummate = window.sessionStorage.getItem(PENDING_SUMMATE_RENDER_KEY) === '1';
    if (hasPendingSummate) {
      window.sessionStorage.removeItem(PENDING_SUMMATE_RENDER_KEY);
      runSummateRender();
    }

    return () => window.removeEventListener(SUMMATE_RENDER_EVENT_NAME, runSummateRender);
  }, [handleRequestExternalRender]);

  const previewArtifact = renderRecord?.renderArtifact;
  const previewUrl = previewArtifact?.url || renderRecord?.artifactUrl || renderRecord?.artifactPath || renderRecord?.previewPath;
  const canShowArtifact = Boolean(previewUrl) && renderStatus === 'external_rendered';
  const actionableStatuses = ['external_renderer_not_configured', 'external_render_failed', 'ready_to_render', 'external_renderer_ready'];
  const canRequestExternal = Boolean(payload) && actionableStatuses.includes(renderStatus) && !isRendering;
  const renderButtonReason = !payload ? 'no payload' : isRendering ? 'currently rendering' : !dayIdentity?.sourceDate ? 'missing active day' : (!canRequestExternal && renderStatus === 'external_renderer_not_configured') ? 'missing config' : (!actionableStatuses.includes(renderStatus) ? `status ${renderStatus} is not actionable` : 'ready');
=======
  const previewArtifact = renderRecord?.renderArtifact;
  const previewUrl = previewArtifact?.url || renderRecord?.artifactUrl || renderRecord?.artifactPath || renderRecord?.previewPath;
  const canShowArtifact = Boolean(previewUrl) && renderStatus === 'external_rendered';
>>>>>>> theirs
=======
  const previewArtifact = renderRecord?.renderArtifact;
  const previewUrl = previewArtifact?.url || renderRecord?.artifactUrl || renderRecord?.artifactPath || renderRecord?.previewPath;
  const canShowArtifact = Boolean(previewUrl) && renderStatus === 'external_rendered';
>>>>>>> 288bf624de8a4d113a213d8ae6fbb47f97cc01b7

  return (
    <main className="summation-shell" style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}>
      <div className="summation-background-plate" aria-hidden="true" />
<<<<<<< HEAD
<<<<<<< ours
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
                <div className="summation-bootstrap-actions" aria-label="Day Capsule payload status">
                  <p>Use the Eye in the global Control Panel to choose or backfill the active day, then use the Crystal Wand there to Summate.</p>
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
=======
=======
>>>>>>> 288bf624de8a4d113a213d8ae6fbb47f97cc01b7
      <section className="summation-stage" aria-label="THE.SUMMATION Day Capsule two-page overlay">
        <DayRecordPage payload={payload} dayIdentity={dayIdentity} />
        <div className="summation-center-protect" aria-hidden="true" />
        <VisualizationPage
          payload={payload}
          renderRecord={renderRecord}
          renderStatus={renderStatus}
          renderMessage={renderMessage}
          previewUrl={previewUrl}
          canShowArtifact={canShowArtifact}
        />
<<<<<<< HEAD
>>>>>>> theirs
=======
>>>>>>> 288bf624de8a4d113a213d8ae6fbb47f97cc01b7
      </section>
    </main>
  );
}
