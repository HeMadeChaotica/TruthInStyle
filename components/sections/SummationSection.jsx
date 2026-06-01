import '../../styles/sections/summation.css';

const SUMMATION_BACKGROUND_SRC = '/backgrounds/THE-SUMMATION/the-summation-masquerade-official.png';

export default function SummationSection() {
  return (
    <section className="summation-page" aria-label="THE.SUMMATION">
      <img
        className="summation-background"
        src={SUMMATION_BACKGROUND_SRC}
        alt=""
        aria-hidden="true"
      />
      <div className="summation-overlay" aria-hidden="true" />
    </section>
  );
}
