function cleanText(value) {
  return String(value ?? '').trim();
}

function getConfig() {
  const supabaseUrl = cleanText(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const serviceRoleKey = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return { supabaseUrl, serviceRoleKey, configured: Boolean(supabaseUrl && serviceRoleKey) };
}

async function requestTable(path, options = {}) {
  const config = getConfig();
  if (!config.configured) throw new Error('HOPEWOOD Supabase archive is not configured.');
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }
  if (!response.ok) throw new Error(cleanText(body?.message || body?.error) || `Supabase archive returned HTTP ${response.status}.`);
  return body;
}

function searchableSnapshot(record) {
  return JSON.stringify(record).slice(0, 250000);
}

function list(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value && typeof value === 'object') return Object.values(value).flatMap(list);
  return cleanText(value) ? [value] : [];
}

export async function readHopewoodArchiveFromSupabase() {
  const rows = await requestTable('summation_page?select=rendered_page&archive_ready=eq.true&order=created_at.asc');
  return (Array.isArray(rows) ? rows : []).map((row) => row?.rendered_page).filter(Boolean);
}

export async function upsertHopewoodArchiveRecord(record) {
  const sourceDate = cleanText(record?.sourceDate || record?.dayIdentity?.sourceDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) throw new Error('A valid sourceDate is required to seal HOPEWOOD.');
  const title = cleanText(record?.title || record?.dayIdentity?.titleOfDay) || null;
  const searchableText = searchableSnapshot(record);
  const dayRows = await requestTable('day_record?on_conflict=day_date', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ day_date: sourceDate, title_of_day: title, source_state: 'complete', synthesis_state: 'rendered', archive_state: 'sealed', updated_at: new Date().toISOString() }),
  });
  const dayId = dayRows?.[0]?.id;
  if (!dayId) throw new Error('Supabase did not return the sealed day record.');

  const pageRows = await requestTable('summation_page?on_conflict=day_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ day_id: dayId, title_of_day: title, rendered_page: record, searchable_text_snapshot: searchableText, archive_ready: true }),
  });
  const pageId = pageRows?.[0]?.id;
  if (!pageId) throw new Error('Supabase did not return the Summation page.');

  const truth = record?.sourceTruthSnapshot || record?.fullAssurerDaySnapshot || {};
  const signals = record?.sourceSignals || record?.future525600?.sourceSignals || {};
  await requestTable('hopewood_entries?on_conflict=day_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      day_id: dayId,
      summation_page_id: pageId,
      title_of_day: title,
      day_date: sourceDate,
      mood: cleanText(record?.mood || truth?.mood) || null,
      era: cleanText(record?.era || truth?.era) || null,
      dropdown_qualifiers: list([record?.singleness, truth?.singlenessLevel]),
      keyword_phrases: list([truth?.wordOfDay, record?.selectedVersionContent]),
      trend_tags: list(signals),
      searchable_text_snapshot: searchableText,
    }),
  });
  return record;
}
