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
const SUMMATE_RENDER_EVENT_NAME = 'truthinstyle-summation-render-request';
const PENDING_SUMMATE_RENDER_KEY = 'truthinstyle-pending-summation-render';

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function isEmptyObject(value) {
  return isPlainObject(value) && Object.values(value).every((entry) => !hasValue(entry));
}

function cleanText(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  return String(value).trim();
}

function hasValue(value) {
  if (typeof value === 'boolean') return false;
  if (Array.isArray(value)) return value.some(hasValue);
  if (isPlainObject(value)) return !isEmptyObject(value);
  return cleanText(value).length > 0;
}

function compactList(values = [], limit = 6) {
  const seen = new Set();
  return (Array.isArray(values) ? values : [values])
    .flatMap((value) => {
      if (Array.isArray(value)) return value;
      return [value];
    })
    .map(formatSummaryLine)
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function joinParts(parts = [], separator = ' • ') {
  return parts.map(cleanText).filter(Boolean).join(separator);
}

function pickFirst(...values) {
  return values.find(hasValue);
}

function formatWordOfDay(value) {
  if (!hasValue(value)) return '';
  if (!isPlainObject(value)) return cleanText(value);
  return joinParts([value.word, value.definition || value.meaning, value.note], ' — ');
}

function formatSummaryLine(value) {
  if (!hasValue(value)) return '';
  if (typeof value === 'number' || typeof value === 'string') return cleanText(value);
  if (Array.isArray(value)) return compactList(value, 3).join(' • ');
  if (isPlainObject(value)) {
    const title = pickFirst(value.title, value.label, value.name, value.type, value.question, value.text, value.description, value.detail, value.summary, value.macroText, value.status);
    const details = [
      pickFirst(value.time, value.date, value.day, value.session, value.meal),
      pickFirst(value.answer, value.note, value.take, value.result, value.place, value.location),
    ].map(formatSummaryLine).filter(Boolean);
    return joinParts([formatSummaryLine(title), ...details]);
  }
  return '';
}

function buildRows(rows = []) {
  return rows
    .map(([label, value]) => ({ label, value: formatSummaryLine(value) }))
    .filter((row) => hasValue(row.value));
}

function RecordRows({ rows }) {
  if (!rows.length) return null;
  return (
    <dl className="summation-record-rows">
      {rows.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RecordList({ items }) {
  if (!items.length) return null;
  return (
    <ul className="summation-record-list">
      {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
    </ul>
  );
}

function SourceBlock({ label, rows = [], items = [] }) {
  if (!rows.length && !items.length) return null;

  return (
    <section className="summation-record-block">
      <h3>{label}</h3>
      <RecordRows rows={rows} />
      <RecordList items={items} />
    </section>
  );
}

function buildDayRecordSections(payload, dayIdentity) {
  const snapshot = payload.sourceSnapshot || {};
  const otherSignals = snapshot.otherSignals || {};
  const assured = payload.assuredThoughts || {};
  const daEater = snapshot.daEaterSignals || {};
  const thiccFitt = compactList(snapshot.thiccFittSignals, 6);
  const rememberMoments = compactList(snapshot.rememberMeMoments?.length ? snapshot.rememberMeMoments : snapshot.moments, 6);
  const pennyItems = compactList((assured.pennyQuestions || []).map((entry) => joinParts([entry?.question, entry?.answer], ' — ')), 2);
  const diaryItems = compactList([assured.diaryEntry, ...pennyItems], 4);

  return [
    {
      label: 'DAY IDENTITY',
      rows: buildRows([
        ['Display date', dayIdentity.displayDate],
        ['Day of week', dayIdentity.dayOfWeek],
        ['Title of day', dayIdentity.titleOfDay],
        ['Active/source date', dayIdentity.sourceDate],
        ['Chaotica day', dayIdentity.chaoticaDayNumber ? `Day #${dayIdentity.chaoticaDayNumber}` : null],
      ]),
    },
    {
      label: 'ASSURER SIGNALS',
      rows: buildRows([
        ['Mood', snapshot.mood],
        ['Era', snapshot.era],
        ['Singleness level', snapshot.singlenessLevel],
        ['Location', otherSignals.location],
        ['Head hummer', snapshot.headHummer],
        ['Word of the day', formatWordOfDay(snapshot.wordOfDay)],
      ]),
      items: diaryItems,
    },
    {
      label: 'DA.EATER SIGNALS',
      items: compactList([
        ...compactList(daEater.macroHighlights, 4).map((item) => `Macro: ${item}`),
        ...compactList(daEater.mealHighlights, 6).map((item) => `Meal: ${item}`),
        ...compactList(daEater.treatSignal || daEater.treat || daEater.treats, 2).map((item) => `Treat: ${item}`),
      ], 8),
    },
    {
      label: 'THICC.FITT SIGNALS',
      rows: buildRows([
        ['Battle cry', otherSignals.battleCry],
        ['Sleep total', snapshot.sleepTotal || otherSignals.sleepTotal],
      ]),
      items: compactList([
        ...thiccFitt,
        ...compactList(snapshot.workoutSummary || snapshot.exerciseSummary || snapshot.sessionSummary, 3),
        ...compactList(snapshot.soHowYouDoin || snapshot.soHowYouDoinTake, 2),
        ...compactList(snapshot.trophySignal || snapshot.mediaSignal || snapshot.trophyMediaSignal, 2),
      ], 8),
    },
    {
      label: 'REMEMBER.ME SIGNALS',
      items: compactList(rememberMoments, 8),
    },
    {
      label: 'ITS / THICC.TIME SIGNALS',
      items: compactList([
        snapshot.thiccTimeSignals,
        snapshot.itsSignals,
        snapshot.totalClients ? `Total clients: ${snapshot.totalClients}` : null,
      ], 6),
    },
  ].map((section) => ({ ...section, rows: section.rows || [], items: section.items || [] }))
    .filter((section) => section.rows.length || section.items.length);
}

function DayRecordPage({ payload, dayIdentity }) {
  if (!payload) {
    return (
      <div className="summation-page-empty summation-left-page" role="status">
        <p>No Day Capsule payload prepared.</p>
        <span>Use the Control Panel Eye to choose an active day, then use the Crystal Wand to request a real Day Capsule.</span>
      </div>
    );
  }

  const sections = buildDayRecordSections(payload, dayIdentity);

  return (
    <article className="summation-day-page summation-left-page" aria-label="Factual Day Record">
      <header className="summation-page-header">
        <p>Factual Day Record</p>
        {hasValue(dayIdentity.titleOfDay) ? <h1>{dayIdentity.titleOfDay}</h1> : <h1>THE.SUMMATION</h1>}
        {hasValue(dayIdentity.displayDate) ? <span className="summation-page-date">{dayIdentity.displayDate}</span> : null}
      </header>
      <div className="summation-record-stack">
        {sections.length ? sections.map((section) => <SourceBlock key={section.label} {...section} />) : (
          <div className="summation-page-empty"><p>No factual source sections are present yet.</p></div>
        )}
      </div>
    </article>
  );
}


function providerReason(renderRecord) {
  return cleanText(renderRecord?.providerReason || renderRecord?.error || renderRecord?.message || renderRecord?.details?.reason || renderRecord?.reason);
}

function isProviderBlockedStatus(status, renderRecord) {
  const text = `${status} ${providerReason(renderRecord)}`.toLowerCase();
  return status === 'external_render_failed' || /billing|limit|quota|provider|config|credential|api key|not configured|insufficient|payment/.test(text);
}

function getVisualizationCopy(renderStatus, renderRecord, renderMessage) {
  if (renderStatus === 'external_renderer_not_configured') {
    return {
      eyebrow: 'Visualization Status',
      title: 'Renderer not configured',
      message: 'The Day Capsule is prepared, but the external renderer cannot run until configuration is completed.',
    };
  }
  if (isProviderBlockedStatus(renderStatus, renderRecord)) {
    return {
      eyebrow: 'Visualization Status',
      title: /limit|quota|billing|payment/i.test(providerReason(renderRecord)) ? 'PROVIDER LIMIT REACHED' : 'Visualization Held',
      message: /limit|quota|billing|payment/i.test(providerReason(renderRecord))
        ? 'The Day Capsule is prepared, but the external visualization renderer could not complete because the render provider returned a billing or usage-limit response.'
        : 'The Day Capsule is prepared, but external rendering could not complete because the provider returned a configuration or credential response.',
    };
  }
  return {
    eyebrow: 'Generated Day Visualization',
    title: renderStatus.replace(/_/g, ' '),
    message: renderMessage,
  };
}

function renderDetailChips(renderRecord, renderStatus) {
  return buildRows([
    ['Status', renderStatus],
    ['Render ID', renderRecord?.renderId],
    ['Payload ID', renderRecord?.payloadId],
    ['Provider reason', providerReason(renderRecord)],
    ['Missing config', Array.isArray(renderRecord?.missingConfig) ? renderRecord.missingConfig.join(', ') : renderRecord?.missingConfig],
  ]);
}

function VisualizationPage({ payload, renderRecord, renderStatus, renderMessage, previewUrl, canShowArtifact }) {
  if (!payload) {
    return (
      <div className="summation-page-empty summation-right-page" role="status">
        <p>No visualization requested.</p>
        <span>No Day Capsule payload has been prepared, so no generated visualization exists yet.</span>
      </div>
    );
  }

  const copy = getVisualizationCopy(renderStatus, renderRecord, renderMessage);
  const detailChips = renderDetailChips(renderRecord, renderStatus);

  return (
    <article className="summation-day-page summation-right-page" aria-label="Generated Day Visualization">
      {canShowArtifact ? (
        <>
          <header className="summation-page-header">
            <p>Generated Day Visualization</p>
            <h2>External Rendered</h2>
          </header>
          <figure className="summation-artifact-frame">
            <img className="summation-render-artifact" src={previewUrl} alt="Generated Day Capsule visualization" />
            <figcaption>{renderRecord?.renderArtifact?.storagePath || renderRecord?.artifactPath || 'External Day Capsule artifact'}</figcaption>
          </figure>
        </>
      ) : (
        <div className="summation-visual-status" role="status">
          <span className="summation-status-eyebrow">{copy.eyebrow}</span>
          <h2>{copy.title}</h2>
          <p>{copy.message}</p>
          {detailChips.length ? (
            <dl className="summation-status-chips">
              {detailChips.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
          ) : null}
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
    const storedPayload = rawPayload ? {
      ...rawPayload,
      dayIdentity: resolveDayIdentityClump({
        ...(rawPayload.dayIdentity || {}),
        sourceDate: rawPayload.dayIdentity?.sourceDate || rawPayload.sourceDate,
      }),
    } : null;
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
    if (!renderRecord?.renderRequest) return 'No generated visualization has been requested yet.';
    if (renderStatus === 'external_renderer_not_configured') return 'External renderer is not configured yet.';
    if (renderStatus === 'external_renderer_ready') return 'Day Capsule external render request ready.';
    if (renderStatus === 'external_rendering' || renderStatus === 'rendering') return 'Rendering Day Capsule…';
    if (renderStatus === 'external_rendered') return 'Day Capsule rendered by external illustrated renderer.';
    if (renderStatus === 'external_render_failed') return renderRecord?.error || renderRecord?.message || 'External Day Capsule render failed.';
    if (renderStatus === 'queued') return 'Day Capsule render queued.';
    if (renderStatus === 'failed') return 'Day Capsule render failed.';
    return renderRecord?.message || payload.status || 'No generated visualization has been requested yet.';
  }, [payload, renderRecord, renderStatus]);

  const previewArtifact = renderRecord?.renderArtifact;
  const previewUrl = previewArtifact?.url || renderRecord?.artifactUrl || renderRecord?.artifactPath || renderRecord?.previewPath;
  const canShowArtifact = Boolean(previewUrl) && renderStatus === 'external_rendered';
  const canRequestExternal = Boolean(payload) && ['external_renderer_not_configured', 'external_render_failed', 'ready_to_render', 'external_renderer_ready'].includes(renderStatus);
  const renderButtonReason = !payload ? 'no payload' : canRequestExternal ? 'ready' : `status ${renderStatus} is not actionable`;

  return (
    <main
      className="summation-shell"
      style={{ '--summation-bg': `url(${BACKGROUND_URL})` }}
      data-can-request-external={canRequestExternal ? 'true' : 'false'}
      data-render-button-reason={renderButtonReason}
    >
      <section className="summation-stage" aria-label="THE.SUMMATION Day Capsule two-page overlay">
        <div className="summation-background-plate" aria-hidden="true" />
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
