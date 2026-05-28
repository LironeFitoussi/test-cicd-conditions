import { describe, it, expect } from 'vitest';
import { getStatusLabel, nextStatus, STATUSES } from '../src/utils/status.js';

describe('getStatusLabel', () => {
  it('returns "OK" for the ok status', () => {
    expect(getStatusLabel('ok')).toBe('OK');
  });

  it('returns "WARN" for the warn status', () => {
    expect(getStatusLabel('warn')).toBe('WARN');
  });

  it('returns "FAIL" for the fail status', () => {
    expect(getStatusLabel('fail')).toBe('FAIL');
  });

  it('returns "UNKNOWN" for any unrecognized status', () => {
    expect(getStatusLabel('banana')).toBe('UNKNOWN');
    expect(getStatusLabel(undefined)).toBe('UNKNOWN');
  });
});

describe('nextStatus', () => {
  it('cycles through every status in order', () => {
    expect(nextStatus('ok')).toBe('warn');
    expect(nextStatus('warn')).toBe('fail');
    expect(nextStatus('fail')).toBe('unknown');
    expect(nextStatus('unknown')).toBe('ok');
  });

  it('falls back to the first status when given an unknown value', () => {
    expect(nextStatus('not-a-status')).toBe(STATUSES[0]);
  });
});
