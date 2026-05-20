import ItsGettingThiccSection from '../../components/sections/ItsGettingThiccSection';
import ClientErrorBoundary from '../../components/shared/ClientErrorBoundary';

function ItsGettingThiccFallback() {
  return (
    <section
      style={{
        minHeight: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
        color: '#ffd7ef',
        background: 'radial-gradient(circle at center, rgba(255, 77, 184, 0.22), rgba(8, 2, 8, 0.96))',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          border: '1px solid rgba(255, 170, 228, 0.65)',
          borderRadius: '18px',
          padding: '24px',
          background: 'rgba(18, 6, 16, 0.72)',
          boxShadow: '0 0 28px rgba(255, 77, 184, 0.28)'
        }}
      >
        <h1 style={{ margin: '0 0 12px', fontSize: '1rem' }}>ITS.GETTING.THICC LOAD SAFE MODE</h1>
        <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.6 }}>
          The route opened, but one internal panel threw during render. Check the console for the exact error and keep using the Control Panel while the section data is cleaned.
        </p>
      </div>
    </section>
  );
}

export default function ItsGettingThiccPage() {
  return (
    <ClientErrorBoundary label="ITS.GETTING.THICC ROUTE ERROR" fallback={<ItsGettingThiccFallback />}>
      <ItsGettingThiccSection />
    </ClientErrorBoundary>
  );
}
