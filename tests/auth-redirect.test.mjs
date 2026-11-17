import test from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnTo, resolveReturnTo, authPath } from '../src/features/auth/utils/auth-redirect.ts';

test('accepts supported internal destinations including query and hash', () => {
  for (const path of ['/', '/join/ABC123', '/join/abc-123?source=email#invite', '/space/8', '/space/8/settings?section=members', '/profile', '/admin/users']) {
    assert.equal(safeReturnTo(path), path);
  }
});

test('rejects external URLs, auth loops, unsupported routes and malformed paths', () => {
  for (const path of ['https://evil.example', '//evil.example', '/\\evil.example', '/login', '/register',
    '/forgot-password', '/reset-password', '/unknown', '/space/0', '/space/8/other', '/join/', '/join/%2f%2fevil', '/profile\n', 'javascript:alert(1)']) {
    assert.equal(safeReturnTo(path), null, path);
  }
});

test('prefers a valid URL destination over per-tab storage and safely builds auth links', () => {
  assert.equal(resolveReturnTo('?redirect=%2Fjoin%2FABC', '/profile'), '/join/ABC');
  assert.equal(resolveReturnTo('?redirect=https%3A%2F%2Fevil.example', '/profile'), '/profile');
  assert.equal(resolveReturnTo('', '//evil.example'), null);
  assert.equal(authPath('/login', '/join/ABC', true), '/login?redirect=%2Fjoin%2FABC&expired=true');
  assert.equal(authPath('/login', '//evil.example'), '/login');
});
