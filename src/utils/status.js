export const STATUSES = ['ok', 'warn', 'fail', 'unknown'];

export function getStatusLabel(status) {
  if (status === 'ok') return 'OK';
  if (status === 'warn') return 'WARN';
  if (status === 'fail') return 'FAIL';
  return 'UNKNOWN';
}

export function nextStatus(current) {
  const idx = STATUSES.indexOf(current);
  if (idx === -1) return STATUSES[0];
  return STATUSES[(idx + 1) % STATUSES.length];
}
