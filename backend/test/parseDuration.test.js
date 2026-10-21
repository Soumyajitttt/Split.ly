import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseDurationMs } from '../src/utils/parseDuration.js';

describe('parseDurationMs', () => {
  const FALLBACK = 12345;

  test('parses each supported unit', () => {
    assert.equal(parseDurationMs('500ms', FALLBACK), 500);
    assert.equal(parseDurationMs('30s', FALLBACK), 30_000);
    assert.equal(parseDurationMs('15m', FALLBACK), 15 * 60_000);
    assert.equal(parseDurationMs('1h', FALLBACK), 3_600_000);
    assert.equal(parseDurationMs('7d', FALLBACK), 7 * 86_400_000);
  });

  test('is case-insensitive and tolerates whitespace', () => {
    assert.equal(parseDurationMs('  2H ', FALLBACK), 7_200_000);
    assert.equal(parseDurationMs('10 m', FALLBACK), 600_000);
  });

  test('treats a bare numeric string or number as milliseconds', () => {
    assert.equal(parseDurationMs('1500', FALLBACK), 1500);
    assert.equal(parseDurationMs(1500, FALLBACK), 1500);
  });

  test('returns the fallback for null/undefined', () => {
    assert.equal(parseDurationMs(undefined, FALLBACK), FALLBACK);
    assert.equal(parseDurationMs(null, FALLBACK), FALLBACK);
  });

  test('returns the fallback for unparseable input', () => {
    assert.equal(parseDurationMs('soon', FALLBACK), FALLBACK);
    assert.equal(parseDurationMs('5w', FALLBACK), FALLBACK);
    assert.equal(parseDurationMs('-5m', FALLBACK), FALLBACK);
    assert.equal(parseDurationMs('1.5h', FALLBACK), FALLBACK);
  });
});
