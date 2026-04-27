function todayContext(seed = new Date()) {
  const month = String(seed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(seed.getUTCDate()).padStart(2, '0');
  const year = seed.getUTCFullYear();
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(seed).toUpperCase();
  return { dateMMDDYYYY: `${month}/${day}/${year}`, weekday };
}

const now = todayContext();

export const day_state = {
  activeDate: now.dateMMDDYYYY,
  activeWeekday: now.weekday,
  titleOfDay: 'TITLE OF THE DAY'
};

const defaultCheatLog = {
  cheatType: '',
  whatIAte: '',
  estimatedDamage: '',
  proteinHit: ''
};

export const source_inputs = {
  day_record: { [day_state.activeDate]: { weekday: day_state.activeWeekday, titleOfDay: day_state.titleOfDay } },
  assurer_assessment: { [day_state.activeDate]: {} },
  assurer_writer: { [day_state.activeDate]: { heresTheThing: '' } },
  da_eater_day: {
    [day_state.activeDate]: {
      cheatLogs: {
        wednesday: { ...defaultCheatLog },
        saturday: { ...defaultCheatLog }
      }
    }
  },
  thicc_fitt_day: { [day_state.activeDate]: {} },
  remember_me_calendar: { [day_state.activeDate]: [] },
  remember_me_moments: { [day_state.activeDate]: [] },
  work_feed: { [day_state.activeDate]: { suggestionSeed: '' } },
  thicc_clients: {},
  thicc_client_logs: {},
  media_library: {},
  centralized_option_registry: {}
};

export const daily_synthesis = {
  summation_page: { [day_state.activeDate]: { versionId: 'v1', sealed: false } },
  summation_fragments: { [day_state.activeDate]: [] },
  summation_prompts: { [day_state.activeDate]: [] }
};

export const archive_trend_intelligence = {
  hopewood_entries: {},
  hopewood_search_index: {},
  yearly_trend_cache: {}
};
