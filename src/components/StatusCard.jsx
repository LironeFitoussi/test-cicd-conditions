import { getStatusLabel } from '../utils/status.js';

const COLORS = {
  ok: '#2e7d32',
  warn: '#ed6c02',
  fail: '#c62828',
  unknown: '#616161',
};

export default function StatusCard({ status, onCycle }) {
  const label = getStatusLabel(status);
  const color = COLORS[status] ?? COLORS.unknown;

  return (
    <section
      style={{
        margin: '1.5rem',
        padding: '1.5rem',
        border: `2px solid ${color}`,
        borderRadius: '8px',
        maxWidth: '320px',
      }}
    >
      <div style={{ color, fontSize: '2rem', fontWeight: 'bold' }} data-testid="status-label">
        {label}
      </div>
      <button
        type="button"
        onClick={onCycle}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
      >
        Cycle status
      </button>
    </section>
  );
}
