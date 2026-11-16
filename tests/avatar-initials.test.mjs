import test from 'node:test';
import assert from 'node:assert/strict';
import { toAlias } from '../src/lib/utils.ts';

test('uses the last two parts of a full name and preserves Vietnamese characters', () => {
  assert.equal(toAlias('nguyễn đăng phúc'), 'ĐP');
  assert.equal(toAlias('  Nguyễn   Đăng\tPhúc  '), 'ĐP');
  assert.equal(toAlias('Phúc'), 'P');
  assert.equal(toAlias('Đặng Phúc Nguyễn'), 'PN');
});

test('handles absent names and email fallbacks', () => {
  assert.equal(toAlias(null), '?');
  assert.equal(toAlias('  '), '?');
  assert.equal(toAlias('nguyenvana@example.com'), 'NG');
});
