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
} from '../../src/services/dayCapsuleRenderService';
import '../../styles/sections/the-summation.css';

const BACKGROUND_URL = '/backgrounds/THE-SUMMATION/the-summation-bg.png';
const DRAFT_EVENT_NAME = 'truthinstyle-summation-draft';

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
    const onPayload = () => loadPayload();
    window.addEventListener(DRAFT_EVENT_NAME, onPayload);
    return () => window.removeEventListener(DRAFT_EVENT_NAME, onPayload);
  }, [loadPayload]);

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

  const previewArtifact = renderRecord?.renderArtifact;
  const previewUrl = previewArtifact?.url || renderRecord?.artifactUrl || renderRecord?.artifactPath || renderRecord?.previewPath;
  const canShowArtifact = Boolean(previewUrl) && renderStatus === 'external_rendered';

  return (
    <main className="summation-shell" style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}>
      <div className="summation-background-plate" aria-hidden="true" />
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
      </section>
    </main>
  );
}
