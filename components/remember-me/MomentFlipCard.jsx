const formatMomentDisplayDate = (value) => {
  if (!value) return '';

  if (typeof value === 'string' && value.includes('-')) {
    const [year, month, day] = value.split('-');
    return `${month}/${day}/${year}`;
  }

  const next = new Date(value);
  if (Number.isNaN(next.getTime())) return '';

  const month = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  const year = next.getFullYear();

  return `${month}/${day}/${year}`;
};

const getMomentMediaRef = (moment) => String(moment?.persistedMediaRef || moment?.photoRef || moment?.mediaRef || '').trim();

const getMomentTitle = (moment) => String(moment?.title || moment?.label || moment?.shortLabel || moment?.detail || '').trim();

const getMomentDescription = (moment, title) => {
  const candidates = [moment?.description, moment?.note, moment?.text, moment?.body, moment?.detail];
  const found = candidates.map((value) => String(value || '').trim()).find((value) => value && value !== title);
  return found || '';
};

const getMomentFrontSummary = (title, description) => {
  const source = String(title || description || '').trim();
  if (source.length <= 80) return source;
  return `${source.slice(0, 77).trim()}…`;
};

export default function MomentFlipCard({ type, moment, isFlipped, onToggle }) {
  const hasMoment = Boolean(moment);
  const title = getMomentTitle(moment);
  const description = getMomentDescription(moment, title);
  const mediaRef = getMomentMediaRef(moment);
  const displayTime = String(moment?.time || moment?.time_value || '').trim();
  const displayDate = formatMomentDisplayDate(moment?.date_key || moment?.date || '');
  const frontSummary = getMomentFrontSummary(title, description);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <article
      className={`moment-card-shell remember-moment-card${isFlipped ? ' is-flipped remember-moment-card-flipped' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={`${type} REMEMBER.ME moment card${hasMoment ? ', saved moment available' : ', no moment recorded yet'}`}
      data-moment-type={type}
      data-flipped={isFlipped ? 'true' : 'false'}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <div className="moment-card-plane remember-moment-plane">
        <div className="moment-card-face front remember-moment-face remember-moment-front" aria-hidden={isFlipped}>
          <strong>{type}</strong>
          {hasMoment ? (
            <>
              {frontSummary ? <span className="remember-moment-front-summary">{frontSummary}</span> : null}
            </>
          ) : null}
        </div>

        <div className="moment-card-face back remember-moment-face remember-moment-back" aria-hidden={!isFlipped}>
          <div className="remember-moment-back-scroll">
            <span className="remember-moment-kicker">{hasMoment ? 'REMEMBER.ME SAVED MOMENT' : 'READY FOR REMEMBER.ME'}</span>
            <strong>{type}</strong>
            {hasMoment ? (
              <div className="remember-moment-saved-data">
                {displayDate || displayTime ? <span className="remember-moment-time">{[displayDate, displayTime].filter(Boolean).join(' • ')}</span> : null}
                {title ? <span className="remember-moment-title">{title}</span> : null}
                {description ? <span className="remember-moment-description">{description}</span> : null}
                {!title && !description ? <span className="remember-moment-empty">NO MOMENT TEXT RECORDED</span> : null}
                {mediaRef ? <img src={mediaRef} alt={`${type} REMEMBER.ME moment`} /> : null}
              </div>
            ) : (
              <span className="remember-moment-empty">NO MOMENT RECORDED YET</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
